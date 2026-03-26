import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia' as any, // Using the latest or your specified version
});

// We must use the Service Role Key here because this is a server-to-server 
// action and needs to bypass Row Level Security to update the user's profile.
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('Stripe-Signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    console.error('Webhook signature verification failed.', error.message);
    return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
  }

  // Handle the checkout session completed event
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Remember in your api/checkout/route.ts we passed the userId as client_reference_id!
    const userId = session.client_reference_id;
    const stripeCustomerId = session.customer as string;
    const stripeSubscriptionId = session.subscription as string;

    if (userId) {
      // Update the user's profile in Supabase to active!
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          subscription_status: 'active', // 
          stripe_customer_id: stripeCustomerId,
          stripe_subscription_id: stripeSubscriptionId,
        })
        .eq('id', userId);

      if (error) {
        console.error('Error updating user profile:', error);
        return new NextResponse('Database update failed', { status: 500 });
      }
      
      console.log(`Successfully activated subscription for user ${userId}`);
    }
  }

  // Handle subscription cancellations/lapsed states 
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    
    await supabaseAdmin
      .from('profiles')
      .update({ subscription_status: 'inactive' })
      .eq('stripe_subscription_id', subscription.id);
  }

  return new NextResponse('Webhook processed successfully', { status: 200 });
}
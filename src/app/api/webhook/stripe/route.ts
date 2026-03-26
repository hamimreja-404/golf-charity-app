import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// Use Service Role Key to bypass RLS and write to the database
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

export async function POST(req: Request) {
  const body = await req.text();
  const headersList = await headers();
const signature = headersList.get('stripe-signature') as string;
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // Listen for successful subscription updates or creations
  if (event.type === 'customer.subscription.created' || event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription;
    const userId = subscription.metadata.userId;

    if (userId) {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({
          subscription_status: subscription.status, // e.g., 'active'
          stripe_subscription_id: subscription.id,   // Saving the ID here
          current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
        })
        .eq('id', userId);
      
      if (error) console.error("DB Update Error:", error);
    }
  }

  return new NextResponse(null, { status: 200 });
}
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia', // your version
});

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
    console.error(`🔴 Webhook signature verification failed:`, err.message);
    return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
  }

  // =====================================================================
  // SCENARIO 1: Initial Checkout (Grabs the userId from metadata)
  // =====================================================================
// =====================================================================
  // SCENARIO 1: Initial Checkout
  // =====================================================================
  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    const userId = session.metadata?.userId;
    const stripeSubscriptionId = session.subscription as string;
    const stripeCustomerId = session.customer as string;

    console.log("🔵 Checkout completed! Linking user:", userId);

    if (userId && stripeSubscriptionId) {
      try {
        const subscription = (await stripe.subscriptions.retrieve(stripeSubscriptionId)) as Stripe.Subscription;

        console.log("🟡 Raw Subscription Status:", subscription.status);
        console.log("🟡 Raw Period End:", (subscription as any).current_period_end);

        // 👇 SAFE DATE CALCULATION 👇
        // Fallback to today's date + 30 days just in case Stripe sends undefined
        let endDateIso = new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(); 
        
        if ((subscription as any).current_period_end) {
          // If Stripe gave us a good number, use it!
          endDateIso = new Date((subscription as any).current_period_end * 1000).toISOString();
        }

        const { error } = await supabaseAdmin
          .from('profiles')
          .update({
            subscription_status: subscription.status, 
            stripe_subscription_id: stripeSubscriptionId,
            stripe_customer_id: stripeCustomerId,
            current_period_end: endDateIso,
          })
          .eq('id', userId);

        if (error) {
          console.error("🔴 DB Update Error (Checkout):", error);
        } else {
          console.log("🟢 User successfully linked and activated in Database!");
        }
        
      } catch (err: any) {
        console.error("🔴 Error fetching subscription from Stripe:", err.message);
      }
    }
  }

  // =====================================================================
  // SCENARIO 2: Future Renewals or Cancellations
  // =====================================================================
// =====================================================================
  // SCENARIO 2: Future Renewals or Cancellations
  // =====================================================================
  if (event.type === 'customer.subscription.updated' || event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription;
    const stripeSubscriptionId = subscription.id;

    console.log(`🔵 Subscription ${subscription.status} update detected!`);

    // 👇 SAFE DATE CALCULATION (Added to Scenario 2!) 👇
    let endDateIso = new Date(new Date().setDate(new Date().getDate() + 30)).toISOString(); 
    if ((subscription as any).current_period_end) {
      endDateIso = new Date((subscription as any).current_period_end * 1000).toISOString();
    }

    // Notice we don't need the userId here. We update based on the Stripe Subscription ID we saved during checkout.
    const { error } = await supabaseAdmin
      .from('profiles')
      .update({
        subscription_status: subscription.status,
        current_period_end: endDateIso, // <-- Using the safe date here now!
      })
      .eq('stripe_subscription_id', stripeSubscriptionId);

    if (error) console.error("🔴 DB Update Error (Renewal/Cancellation):", error);
    else console.log(`🟢 Database updated for subscription: ${subscription.status}`);
  }

  return new NextResponse(null, { status: 200 });
}


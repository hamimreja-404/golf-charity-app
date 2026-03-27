import { NextResponse } from 'next/server';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-03-25.dahlia', // Use latest stable
});

export async function POST(req: Request) {
  try {
    const { priceId, userId } = await req.json();
console.log("🟠 A. /api/checkout route hit!");
    if (!priceId || !userId) {
      console.log("🔴 D. No user found. Must be logged in.");
      return NextResponse.json({ error: 'Missing priceId or userId' }, { status: 400 });
    }
    
console.log("🟠 B. Received Price ID:", priceId);
console.log("🟠 C. Base URL is:", process.env.NEXT_PUBLIC_BASE_URL);
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId, // You will get this from your Stripe Dashboard (Products)
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?success=true`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?canceled=true`,
      client_reference_id: userId, 
      metadata: {
        userId: userId,
      },
      subscription_data: {
        metadata: {
          userId: userId, 
        },
      },
    });
console.log("🟢 E. Session created successfully!");
    return NextResponse.json({ sessionId: session.id, url: session.url });
  } catch (error: any) {
    console.error("🔴 F. Stripe/Backend Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// pages/api/create-checkout-session.ts
import { NextApiRequest, NextApiResponse } from 'next';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-04-30.basil',
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { priceId, quantity } = req.body;

    try {
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Golf Tournament Ticket',
              },
              unit_amount: 13000, // $130.00 in cents
            },
            quantity,
          },
        ],
        mode: 'payment',
        success_url: `${process.env.BASE_URL}/success`,
        cancel_url: `${process.env.BASE_URL}/cancel`,
      });

      return res.status(200).json({ url: session.url });
    } catch (error) {
      return res.status(500).json({ error: 'Failed to create Stripe session' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
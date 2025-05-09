import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

// Define Context and HttpRequest types manually if needed
interface Context {
  res: {
    status: number;
    body: any;
  };
}

interface HttpRequest {
  method: string;
  body: any;
  headers: {
    origin: string;
  };
}

export default async function (context: Context, req: HttpRequest): Promise<void> {
  if (req.method !== "POST") {
    context.res = {
      status: 405,
      body: "Method Not Allowed",
    };
    return;
  }

  try {
    const { quantity } = req.body;

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: "price_1RMspvFbxi1DNGUmiNUHe6Ai",
          quantity: quantity || 1,
        },
      ],
      mode: "payment",
      success_url: `${req.headers.origin}/success`,
      cancel_url: `${req.headers.origin}/events`,
    });

    context.res = {
      status: 200,
      body: { url: session.url },
    };
  } catch (err) {
    context.res = {
      status: 500,
      body: "Stripe error",
    };
  }
}
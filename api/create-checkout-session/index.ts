import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-04-30.basil",
});

// Define basic Azure Functions types (if not importing from @azure/functions)
interface Context {
  log: (...args: any[]) => void;
  res: {
    status: number;
    headers?: { [key: string]: string };
    body: any;
  };
}

interface HttpRequest {
  method: string;
  body?: any;
  headers: { [key: string]: string };
}

export default async function handleStripeCheckout(
  context: Context,
  req: HttpRequest
): Promise<void> {
  if (req.method !== "POST") {
    context.res = {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
      body: { error: "Method Not Allowed" },
    };
    return;
  }

  try {
    const origin = req.headers.origin || "https://jrhof.org";
    const { quantity = 1 } = req.body || {};

    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: "price_1RMspvFbxi1DNGUmiNUHe6Ai",
          quantity,
        },
      ],
      mode: "payment",
      success_url: `${origin}/success`,
      cancel_url: `${origin}/events`,
    });

    context.res = {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      body: { url: session.url },
    };
  } catch (err: any) {
    context.log("Stripe error", err);
    context.res = {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
      body: { error: "Stripe checkout session creation failed." },
    };
  }
}
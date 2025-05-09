"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = handleStripeCheckout;
const stripe_1 = __importDefault(require("stripe"));
const stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2025-04-30.basil",
});
async function handleStripeCheckout(context, req) {
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
    }
    catch (err) {
        context.log("Stripe error", err);
        context.res = {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
            body: { error: "Stripe checkout session creation failed." },
        };
    }
}

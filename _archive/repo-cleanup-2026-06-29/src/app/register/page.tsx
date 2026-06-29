"use client";

import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);
console.log("📦 Stripe Key (client):", process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

export default function RegisterPage() {
  const [golfers, setGolfers] = useState([{ name: "", email: "" }]);
  const [raffleTickets, setRaffleTickets] = useState(0);
  const [comments, setComments] = useState("");
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGolferChange = (index: number, field: "name" | "email", value: string) => {
    const updated = [...golfers];
    updated[index][field] = value;
    setGolfers(updated);
  };

  const addGolfer = () => {
    if (golfers.length < 4) setGolfers([...golfers, { name: "", email: "" }]);
  };

  const handleSubmit = async () => {
    console.log("🟢 Checkout button clicked");
    if (!email.trim()) {
      alert("Please enter a valid contact email.");
      setIsSubmitting(false);
      return;
    }
    setIsSubmitting(true);
    const stripe = await stripePromise;
    console.log("🧾 Stripe object resolved:", stripe);
    if (!stripe) {
      console.error("❌ Stripe failed to initialize. Check your publishable key.");
      alert("Stripe could not be loaded. Please try again later.");
      setIsSubmitting(false);
      return;
    }

    // Build lineItems explicitly to avoid undefined entries
    const lineItems = [
      {
        price: process.env.NEXT_PUBLIC_STRIPE_GOLF_TICKET_PRICE_ID!,
        quantity: golfers.length,
      },
    ];

    if (raffleTickets > 0) {
      lineItems.push({
        price: process.env.NEXT_PUBLIC_STRIPE_RAFFLE_TICKET_PRICE_ID!,
        quantity: raffleTickets,
      });
    }

    console.log("🚀 Sending to stripecheckout:", {
      lineItems,
      metadata: {
        contactEmail: email,
        comments,
        ...(golfers.reduce((acc, g, i) => {
          acc[`golfer${i + 1}_name`] = g.name;
          acc[`golfer${i + 1}_email`] = g.email;
          return acc;
        }, {} as Record<string, string>)),
      }
    });

    try {
      const response = await fetch("https://jrhof-stripe-api.azurewebsites.net/api/stripecheckout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lineItems,
          metadata: {
            contactEmail: email,
            comments,
            ...(golfers.reduce((acc, g, i) => {
              acc[`golfer${i + 1}_name`] = g.name;
              acc[`golfer${i + 1}_email`] = g.email;
              return acc;
            }, {} as Record<string, string>)),
          },
        }),
      });
      console.log("📥 Stripe API response object:", response);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Stripe API Error Text:", errorText);
        alert("There was an issue starting your checkout. Please try again.");
        setIsSubmitting(false);
        return;
      }

      const session = await response.json();
      console.log("🎟️ Stripe session parsed:", session);

      if (!session?.id || typeof session.id !== "string") {
        console.error("❌ Invalid session response object:", session);
        alert("Checkout session could not be created.");
        setIsSubmitting(false);
        return;
      }

      // Log registration details
      await fetch("https://jrhof-stripe-api.azurewebsites.net/api/logregistration", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: session.id,
          contactEmail: email,
          comments,
          golf_quantity: golfers.length,
          raffle_quantity: raffleTickets,
          ...(golfers.reduce((acc, g, i) => {
            acc[`golfer${i + 1}_name`] = g.name;
            acc[`golfer${i + 1}_email`] = g.email;
            return acc;
          }, {} as Record<string, string>)),
        }),
      });

      try {
        await stripe?.redirectToCheckout({ sessionId: session.id });
      } catch (redirectErr) {
        console.error("🚨 Stripe redirectToCheckout error:", redirectErr);
        alert("There was a problem redirecting to Stripe. Please try again.");
      }
    } catch (err) {
      if (err instanceof Error) {
        console.error("Stripe checkout error:", err.message);
      } else {
        console.error("Stripe checkout error:", err);
      }
      alert("There was an unexpected error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h1 className="text-3xl font-bold mb-4 text-center">Golf Tournament Registration</h1>
      <label className="block mb-2">Your Contact Email</label>
      <input
        className="w-full mb-4 p-2 border rounded"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
        placeholder="your@email.com"
      />

      {golfers.map((golfer, index) => (
        <div key={index} className="mb-4">
          <label className="block font-semibold">Golfer {index + 1}</label>
          <input
            className="w-full p-2 my-1 border rounded"
            placeholder="Name"
            value={golfer.name}
            onChange={(e) => handleGolferChange(index, "name", e.target.value)}
          />
          <input
            className="w-full p-2 my-1 border rounded"
            placeholder="Email"
            value={golfer.email}
            onChange={(e) => handleGolferChange(index, "email", e.target.value)}
          />
        </div>
      ))}

      {golfers.length < 4 && (
        <button className="text-blue-600 underline mb-4" onClick={addGolfer}>
          + Add another golfer
        </button>
      )}

      <label className="block mb-2">Raffle Tickets</label>
      <input
        type="number"
        min={0}
        className="w-full p-2 mb-4 border rounded"
        value={raffleTickets}
        onChange={(e) => setRaffleTickets(Number(e.target.value))}
        placeholder="Enter number of raffle tickets"
      />

      <label className="block mb-2">Team Request / Comments</label>
      <textarea
        className="w-full p-2 mb-4 border rounded"
        rows={3}
        value={comments}
        onChange={(e) => setComments(e.target.value)}
        placeholder="Any special requests or team preferences?"
      />

      <button
        className="bg-[#0078D7] hover:bg-[#005fa3] text-white px-4 py-2 rounded text-lg w-full"
        onClick={handleSubmit}
        disabled={isSubmitting}
      >
        {isSubmitting ? "Processing..." : "Checkout with Stripe"}
      </button>
    </div>
  );
}
"use client";

import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

const TIP_OPTIONS = [
  { label: "$0", value: 0 },
  { label: "$5", value: 5 },
  { label: "$10", value: 10 },
  { label: "$20", value: 20 },
];

interface PaymentFormProps {
  ticketId: string;
  baseRate: number; // in cents
  onPaymentComplete: () => void;
}

function CheckoutForm({ onPaymentComplete }: { onPaymentComplete: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (submitError) {
      setError(submitError.message || "Payment failed");
      setLoading(false);
    } else {
      onPaymentComplete();
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />
      {error && (
        <p className="text-red-400 text-sm mt-3">{error}</p>
      )}
      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full mt-4 rounded-2xl bg-[#0A7AFF] hover:bg-[#0968d6] active:bg-[#0858b8] text-white font-semibold text-lg py-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Processing..." : "Pay & Pick Up"}
      </button>
    </form>
  );
}

export default function PaymentForm({ ticketId, baseRate, onPaymentComplete }: PaymentFormProps) {
  const [tipAmount, setTipAmount] = useState(0);
  const [customTip, setCustomTip] = useState("");
  const [showCustom, setShowCustom] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);
  const [loading, setLoading] = useState(false);

  const effectiveTip = showCustom ? parseFloat(customTip) || 0 : tipAmount;
  const totalCents = baseRate + effectiveTip * 100;
  const totalDollars = (totalCents / 100).toFixed(2);

  useEffect(() => {
    if (totalCents <= 0) return;
    setLoading(true);
    fetch("/api/create-payment-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ticketId, tipAmount: effectiveTip }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.clientSecret) setClientSecret(data.clientSecret);
      })
      .finally(() => setLoading(false));
  }, [ticketId, totalCents, effectiveTip]);

  if (paid) {
    return (
      <div className="bg-[#1F2937] rounded-2xl p-6 text-center">
        <div className="text-4xl mb-3">&#10003;</div>
        <p className="text-white font-semibold text-xl">Paid — thank you!</p>
        <p className="text-gray-400 text-sm mt-2">
          ${totalDollars} total {effectiveTip > 0 ? `(includes $${effectiveTip.toFixed(2)} tip)` : ""}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[#1F2937] rounded-2xl p-5">
      {/* Amount */}
      <div className="text-center mb-5">
        <p className="text-gray-400 text-sm">Parking fee</p>
        <p className="text-white text-3xl font-bold mt-1">${(baseRate / 100).toFixed(2)}</p>
      </div>

      {/* Tip Selector */}
      <div className="mb-5">
        <p className="text-gray-400 text-sm mb-2">Add a tip</p>
        <div className="grid grid-cols-5 gap-2">
          {TIP_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                setTipAmount(opt.value);
                setShowCustom(false);
              }}
              className={`rounded-xl py-2.5 text-sm font-semibold transition-all ${
                !showCustom && tipAmount === opt.value
                  ? "bg-[#0A7AFF] text-white"
                  : "bg-[#111827] text-gray-400 hover:bg-gray-700"
              }`}
            >
              {opt.label}
            </button>
          ))}
          <button
            onClick={() => setShowCustom(true)}
            className={`rounded-xl py-2.5 text-sm font-semibold transition-all ${
              showCustom
                ? "bg-[#0A7AFF] text-white"
                : "bg-[#111827] text-gray-400 hover:bg-gray-700"
            }`}
          >
            Other
          </button>
        </div>
        {showCustom && (
          <div className="mt-3 flex items-center bg-[#111827] rounded-xl px-4">
            <span className="text-gray-400 text-lg">$</span>
            <input
              type="number"
              inputMode="decimal"
              placeholder="0.00"
              value={customTip}
              onChange={(e) => setCustomTip(e.target.value)}
              className="flex-1 bg-transparent text-white text-lg py-3 pl-2 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        )}
      </div>

      {/* Total */}
      <div className="flex items-center justify-between py-3 border-t border-gray-700 mb-4">
        <span className="text-gray-400">Total</span>
        <span className="text-white text-xl font-bold">${totalDollars}</span>
      </div>

      {/* Stripe Elements */}
      {loading && (
        <div className="flex justify-center py-8">
          <svg className="animate-spin h-6 w-6 text-[#0A7AFF]" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      )}
      {clientSecret && !loading && (
        <Elements
          stripe={stripePromise}
          options={{
            clientSecret,
            appearance: {
              theme: "night",
              variables: {
                colorPrimary: "#0A7AFF",
                colorBackground: "#111827",
                borderRadius: "12px",
              },
            },
          }}
        >
          <CheckoutForm
            onPaymentComplete={() => {
              setPaid(true);
              onPaymentComplete();
            }}
          />
        </Elements>
      )}
      {!clientSecret && !loading && totalCents <= 0 && (
        <p className="text-gray-500 text-center text-sm py-4">
          Select a tip amount or enter a custom tip to proceed
        </p>
      )}
    </div>
  );
}

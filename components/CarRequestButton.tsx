"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

interface CarRequestButtonProps {
  ticketId: string;
  onRequested: () => void;
}

export default function CarRequestButton({ ticketId, onRequested }: CarRequestButtonProps) {
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleRequest = async () => {
    if (confirmed) return;
    setLoading(true);

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("tickets")
      .update({
        status: "REQUESTED",
        requested_at: now,
      })
      .eq("id", ticketId);

    if (error) {
      console.error("Failed to request car:", error);
      setLoading(false);
      return;
    }

    setConfirmed(true);
    setLoading(false);
    onRequested();
  };

  if (confirmed) {
    return (
      <div className="w-full rounded-2xl bg-[#0A7AFF]/10 border border-[#0A7AFF]/30 py-5 text-center">
        <div className="text-2xl mb-1">&#10003;</div>
        <p className="text-[#0A7AFF] font-semibold text-lg">Car Requested!</p>
        <p className="text-gray-400 text-sm mt-1">A valet is on the way</p>
      </div>
    );
  }

  return (
    <button
      onClick={handleRequest}
      disabled={loading}
      className="w-full rounded-2xl bg-[#0A7AFF] hover:bg-[#0968d6] active:bg-[#0858b8] text-white font-semibold text-lg py-5 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[#0A7AFF]/25"
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Requesting...
        </span>
      ) : (
        "Request My Car"
      )}
    </button>
  );
}

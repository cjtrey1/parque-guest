"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import StatusTimeline from "@/components/StatusTimeline";
import CarRequestButton from "@/components/CarRequestButton";
import PaymentForm from "@/components/PaymentForm";

interface TicketData {
  id: string;
  ticket_code: string;
  status: string;
  created_at: string;
  parked_at: string | null;
  requested_at: string | null;
  completed_at: string | null;
  parking_zone: string | null;
  parking_level: string | null;
  parking_spot: string | null;
  job_id: string;
  vehicle_id: string | null;
}

interface JobData {
  id: string;
  title: string;
  location: string;
  payment_config: {
    model: string;
    baseRate: number;
    allowTips: boolean;
    timing: "AT_PICKUP" | "AT_DROPOFF";
  } | null;
}

interface VehicleData {
  make: string | null;
  model: string | null;
  color: string | null;
  license_plate: string | null;
}

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case "CREATED":
    case "QUEUED":
    case "CLAIMED":
    case "PARKING_IN_PROGRESS":
      return (
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-[#0A7AFF]/20 flex items-center justify-center">
            <span className="text-4xl">&#128664;</span>
          </div>
          <div className="absolute inset-0 w-20 h-20 rounded-full bg-[#0A7AFF]/20 animate-pulse-ring" />
        </div>
      );
    case "PARKED":
    case "OVERNIGHT_PARKED":
      return (
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
          <span className="text-4xl">&#10003;</span>
        </div>
      );
    case "REQUESTED":
      return (
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-amber-500/20 flex items-center justify-center">
            <span className="text-4xl">&#9201;</span>
          </div>
          <div className="absolute inset-0 w-20 h-20 rounded-full bg-amber-500/20 animate-pulse-ring" />
        </div>
      );
    case "RETRIEVAL_IN_PROGRESS":
      return (
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-[#0A7AFF]/20 flex items-center justify-center">
            <span className="text-4xl">&#128663;</span>
          </div>
          <div className="absolute inset-0 w-20 h-20 rounded-full bg-[#0A7AFF]/20 animate-pulse-ring" />
        </div>
      );
    case "READY":
      return (
        <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center">
          <span className="text-4xl">&#127881;</span>
        </div>
      );
    case "COMPLETED":
    case "CLOSED":
    case "DELIVERED":
      return (
        <div className="w-20 h-20 rounded-full bg-[#0A7AFF]/20 flex items-center justify-center">
          <span className="text-4xl">&#11088;</span>
        </div>
      );
    default:
      return null;
  }
}

function getStatusHeadline(status: string): string {
  switch (status) {
    case "CREATED":
    case "QUEUED":
    case "CLAIMED":
    case "PARKING_IN_PROGRESS":
      return "Your vehicle is being checked in";
    case "PARKED":
    case "OVERNIGHT_PARKED":
      return "Your vehicle is parked and secure";
    case "REQUESTED":
      return "We've received your request";
    case "RETRIEVAL_IN_PROGRESS":
      return "Your car is on its way!";
    case "READY":
      return "Your car is ready!";
    case "COMPLETED":
    case "CLOSED":
    case "DELIVERED":
      return "Thank you! Have a great night";
    default:
      return "Vehicle Status";
  }
}

function getStatusSubtext(status: string): string {
  switch (status) {
    case "CREATED":
    case "QUEUED":
    case "CLAIMED":
    case "PARKING_IN_PROGRESS":
      return "A valet attendant is handling your vehicle";
    case "PARKED":
    case "OVERNIGHT_PARKED":
      return "Your keys are safe with us. Request your car when you're ready to leave.";
    case "REQUESTED":
      return "A valet attendant will retrieve your car shortly";
    case "RETRIEVAL_IN_PROGRESS":
      return "Your car is being brought to the front";
    case "READY":
      return "Your car is waiting at the front";
    case "COMPLETED":
    case "CLOSED":
    case "DELIVERED":
      return "We hope you had a great experience";
    default:
      return "";
  }
}

function formatTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function GuestStatusPage() {
  const params = useParams();
  const code = params.code as string;

  const [ticket, setTicket] = useState<TicketData | null>(null);
  const [job, setJob] = useState<JobData | null>(null);
  const [vehicle, setVehicle] = useState<VehicleData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const fetchTicket = useCallback(async () => {
    const { data: ticketData, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("ticket_code", code)
      .single();

    if (error || !ticketData) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setTicket(ticketData);

    // Fetch job
    const { data: jobData } = await supabase
      .from("jobs")
      .select("id, title, location, payment_config")
      .eq("id", ticketData.job_id)
      .single();

    if (jobData) setJob(jobData);

    // Fetch vehicle if exists
    if (ticketData.vehicle_id) {
      const { data: vehicleData } = await supabase
        .from("vehicles")
        .select("make, model, color, license_plate")
        .eq("id", ticketData.vehicle_id)
        .single();

      if (vehicleData) setVehicle(vehicleData);
    }

    setLoading(false);
  }, [code]);

  // Initial fetch
  useEffect(() => {
    fetchTicket();
  }, [fetchTicket]);

  // Realtime subscription
  useEffect(() => {
    if (!ticket?.id) return;

    const channel = supabase
      .channel(`ticket-${ticket.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "tickets",
          filter: `id=eq.${ticket.id}`,
        },
        (payload) => {
          setTicket(payload.new as TicketData);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [ticket?.id]);

  // Loading state
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <svg className="animate-spin h-8 w-8 text-[#0A7AFF] mb-4" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
        <p className="text-gray-400">Loading your ticket...</p>
      </div>
    );
  }

  // Not found
  if (notFound || !ticket) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">&#10060;</span>
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Ticket Not Found</h1>
          <p className="text-gray-400 text-sm">
            No ticket found for code <span className="font-mono text-white">{code}</span>.
            Please check your link or scan your QR code again.
          </p>
        </div>
      </div>
    );
  }

  const status = ticket.status;
  const isPaid = job?.payment_config?.model === "GUEST_PAYS" || job?.payment_config?.model === "PAID";
  const allowTips = job?.payment_config?.allowTips !== false;
  const baseRate = job?.payment_config?.baseRate || 0;
  const paymentTiming = job?.payment_config?.timing || "AT_PICKUP";
  const isComplete = ["COMPLETED", "CLOSED", "DELIVERED"].includes(status);
  const showRequestButton = ["PARKED", "OVERNIGHT_PARKED"].includes(status);
  const showPayment = isPaid && baseRate > 0 && (
    (paymentTiming === "AT_DROPOFF" && ["QUEUED", "PARKED", "PARKING_IN_PROGRESS"].includes(status)) ||
    (paymentTiming === "AT_PICKUP" && status === "READY")
  );
  const showTipOnly = !isPaid && allowTips && (
    (paymentTiming === "AT_DROPOFF" && ["QUEUED", "PARKED", "PARKING_IN_PROGRESS"].includes(status)) ||
    (paymentTiming === "AT_PICKUP" && status === "READY")
  );

  const parkingLocation = [ticket.parking_zone, ticket.parking_level, ticket.parking_spot]
    .filter(Boolean)
    .join(" / ");

  return (
    <div className="flex flex-col min-h-screen px-5 py-8">
      {/* Header */}
      <div className="text-center mb-2">
        <p className="text-[#0A7AFF] text-xs font-semibold uppercase tracking-widest">Parque Valet</p>
      </div>

      {/* Venue Info */}
      {job && (
        <div className="text-center mb-6">
          <h2 className="text-white font-semibold text-lg">{job.title}</h2>
          <p className="text-gray-400 text-sm">{job.location}</p>
        </div>
      )}

      {/* Timeline */}
      {!isComplete && (
        <div className="mb-8">
          <StatusTimeline status={status} />
        </div>
      )}

      {/* Status Icon + Headline */}
      <div className="flex flex-col items-center text-center mb-8">
        <StatusIcon status={status} />
        <h1 className="text-white text-2xl font-bold mt-5">{getStatusHeadline(status)}</h1>
        <p className="text-gray-400 text-sm mt-2 max-w-xs">{getStatusSubtext(status)}</p>
      </div>

      {/* Info Card */}
      <div className="bg-[#1F2937] rounded-2xl p-5 mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider">Ticket</p>
            <p className="text-white font-mono font-semibold mt-0.5">{ticket.ticket_code}</p>
          </div>
          <div>
            <p className="text-gray-500 text-xs uppercase tracking-wider">Drop-off</p>
            <p className="text-white font-semibold mt-0.5">{formatTime(ticket.created_at)}</p>
          </div>
          {ticket.parked_at && (
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider">Parked</p>
              <p className="text-white font-semibold mt-0.5">{formatTime(ticket.parked_at)}</p>
            </div>
          )}
          {parkingLocation && (
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider">Location</p>
              <p className="text-white font-semibold mt-0.5">{parkingLocation}</p>
            </div>
          )}
          {vehicle && (
            <div className="col-span-2">
              <p className="text-gray-500 text-xs uppercase tracking-wider">Vehicle</p>
              <p className="text-white font-semibold mt-0.5">
                {[vehicle.color, vehicle.make, vehicle.model].filter(Boolean).join(" ")}
                {vehicle.license_plate ? ` \u2022 ${vehicle.license_plate}` : ""}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-auto space-y-4 pb-8">
        {showRequestButton && (
          <CarRequestButton
            ticketId={ticket.id}
            onRequested={() => {
              setTicket((prev) => prev ? { ...prev, status: "REQUESTED" } : prev);
            }}
          />
        )}

        {showPayment && (
          <PaymentForm
            ticketId={ticket.id}
            baseRate={baseRate}
            onPaymentComplete={() => {}}
          />
        )}

        {showTipOnly && (
          <PaymentForm
            ticketId={ticket.id}
            baseRate={0}
            onPaymentComplete={() => {}}
          />
        )}

        {isComplete && (
          <div className="text-center">
            <p className="text-gray-500 text-xs">{formatDate(ticket.created_at)}</p>
          </div>
        )}
      </div>
    </div>
  );
}

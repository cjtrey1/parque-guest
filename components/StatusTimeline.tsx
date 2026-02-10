"use client";

const STEPS = [
  { key: "checked_in", label: "Checked In" },
  { key: "parked", label: "Parked" },
  { key: "requested", label: "Requested" },
  { key: "on_the_way", label: "On the Way" },
  { key: "ready", label: "Ready" },
];

function getStepIndex(status: string): number {
  switch (status) {
    case "CREATED":
    case "QUEUED":
    case "CLAIMED":
    case "PARKING_IN_PROGRESS":
      return 0;
    case "PARKED":
    case "OVERNIGHT_PARKED":
      return 1;
    case "REQUESTED":
      return 2;
    case "RETRIEVAL_IN_PROGRESS":
      return 3;
    case "READY":
      return 4;
    case "COMPLETED":
    case "CLOSED":
    case "DELIVERED":
      return 5; // past all steps
    default:
      return 0;
  }
}

export default function StatusTimeline({ status }: { status: string }) {
  const currentIndex = getStepIndex(status);

  return (
    <div className="flex items-center justify-between w-full px-2">
      {STEPS.map((step, i) => {
        const isComplete = i < currentIndex;
        const isCurrent = i === currentIndex;

        return (
          <div key={step.key} className="flex flex-col items-center flex-1">
            {/* Connector + Dot Row */}
            <div className="flex items-center w-full">
              {/* Left connector */}
              {i > 0 && (
                <div
                  className={`h-0.5 flex-1 ${
                    isComplete || isCurrent ? "bg-[#0A7AFF]" : "bg-gray-700"
                  }`}
                />
              )}
              {i === 0 && <div className="flex-1" />}

              {/* Dot */}
              <div
                className={`w-3 h-3 rounded-full shrink-0 ${
                  isComplete
                    ? "bg-[#0A7AFF]"
                    : isCurrent
                    ? "bg-[#0A7AFF] ring-4 ring-[#0A7AFF]/30"
                    : "bg-gray-700"
                }`}
              />

              {/* Right connector */}
              {i < STEPS.length - 1 && (
                <div
                  className={`h-0.5 flex-1 ${
                    isComplete ? "bg-[#0A7AFF]" : "bg-gray-700"
                  }`}
                />
              )}
              {i === STEPS.length - 1 && <div className="flex-1" />}
            </div>

            {/* Label */}
            <span
              className={`text-[10px] mt-1.5 text-center leading-tight ${
                isComplete || isCurrent ? "text-[#0A7AFF] font-semibold" : "text-gray-500"
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

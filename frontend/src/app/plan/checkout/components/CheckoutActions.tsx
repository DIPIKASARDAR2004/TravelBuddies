import React from "react";
import { StatusBanner } from "@/components/ui/StatusBanner";
import { ProtectedBooking } from "@/types";

interface CheckoutActionsProps {
  booking: ProtectedBooking;
  handleDemoAction: (action: "release" | "cancel" | "dispute") => void;
  handleAdminAction: (action: "CANCEL" | "NO_SHOW") => void;
  isProcessing: boolean;
}

interface ActionButtonConfig {
  label: string;
  description: string;
  className: string;
  onClick: () => void;
}

export default function CheckoutActions({
  booking,
  handleDemoAction,
  handleAdminAction,
  isProcessing,
}: CheckoutActionsProps) {
  if (booking.status !== "PROTECTED") {
    return (
      <StatusBanner title="Actions unlock after protection">
        Traveler and hotel controls appear once payment has been successfully protected. Closed and disputed bookings stay read-only
        here so the timeline remains easy to follow.
      </StatusBanner>
    );
  }

  const userActions: ActionButtonConfig[] = [
    {
      label: "Confirm checkout",
      description: "Simulate a successful stay and release the protected amount.",
      className:
        "border-emerald-200 bg-emerald-50 text-emerald-800 hover:border-emerald-300 hover:bg-emerald-100 dark:border-emerald-800/50 dark:bg-emerald-950/30 dark:text-emerald-200 dark:hover:bg-emerald-900/40",
      onClick: () => handleDemoAction("release"),
    },
    {
      label: "Cancel booking",
      description: "Run the traveler-side cancellation flow with the configured refund logic.",
      className:
        "border-slate-200 bg-slate-50 text-slate-800 hover:border-slate-300 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
      onClick: () => handleDemoAction("cancel"),
    },
    {
      label: "Open dispute",
      description: "Freeze payout when the traveler reports denied entry or overbooking.",
      className:
        "border-orange-200 bg-orange-50 text-orange-800 hover:border-orange-300 hover:bg-orange-100 dark:border-orange-800/50 dark:bg-orange-950/30 dark:text-orange-200 dark:hover:bg-orange-900/40",
      onClick: () => handleDemoAction("dispute"),
    },
  ];

  const adminActions: ActionButtonConfig[] = [
    {
      label: "Hotel cancels booking",
      description: "Simulate a hotel-side cancellation with a full refund path.",
      className:
        "border-rose-200 bg-rose-50 text-rose-800 hover:border-rose-300 hover:bg-rose-100 dark:border-rose-800/50 dark:bg-rose-950/30 dark:text-rose-200 dark:hover:bg-rose-900/40",
      onClick: () => handleAdminAction("CANCEL"),
    },
    {
      label: "Mark no-show",
      description: "Apply the prototype no-show outcome and settle the booking accordingly.",
      className:
        "border-amber-200 bg-amber-50 text-amber-900 hover:border-amber-300 hover:bg-amber-100 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-200 dark:hover:bg-amber-900/40",
      onClick: () => handleAdminAction("NO_SHOW"),
    },
  ];

  const renderActionGroup = (title: string, copy: string, actions: ActionButtonConfig[]) => (
    <div className="space-y-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">{title}</p>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{copy}</p>
      </div>

      <div className="space-y-3">
        {actions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            disabled={isProcessing}
            className={`w-full rounded-[1.35rem] border px-4 py-4 text-left transition disabled:cursor-not-allowed disabled:opacity-55 ${action.className}`}
          >
            <p className="text-sm font-bold">{action.label}</p>
            <p className="mt-1 text-sm opacity-85">{action.description}</p>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 rounded-[2rem] border border-slate-200/80 bg-white/95 p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.45)] dark:border-slate-800 dark:bg-slate-950/80">
      {renderActionGroup(
        "Traveler actions",
        "Use these to simulate what happens after arrival or if the stay needs to be cancelled.",
        userActions,
      )}

      <div className="border-t border-dashed border-slate-200 pt-6 dark:border-slate-800">
        {renderActionGroup(
          "Hotel team simulator",
          "These controls help review host-side edge cases without leaving the checkout screen.",
          adminActions,
        )}
      </div>
    </div>
  );
}

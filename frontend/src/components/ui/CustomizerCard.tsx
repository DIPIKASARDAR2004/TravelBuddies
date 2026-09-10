import React from "react";
import { formatINR } from "@/lib/utils";
import { FiPlus } from "react-icons/fi";

interface CustomizerCardProps {
  type: string;
  title: string;
  cost: number;
  itemName: string | undefined;
  itemDetails: string;
  onSwap: () => void;
  onAdd: () => void;
  icon: React.ElementType;
  colorClass: string;
}

const toneClasses: Record<string, { border: string; pill: string }> = {
  sky: {
    border: "border-sky-500/60",
    pill: "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  },
  amber: {
    border: "border-amber-500/60",
    pill: "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300",
  },
  emerald: {
    border: "border-emerald-500/60",
    pill: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
  },
  violet: {
    border: "border-violet-500/60",
    pill: "bg-violet-100 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300",
  },
};

export const CustomizerCard: React.FC<CustomizerCardProps> = ({ 
  type, title, cost, itemName, itemDetails, onSwap, onAdd, icon: Icon, colorClass 
}) => {
  const tone = toneClasses[colorClass] ?? toneClasses.sky;

  return (
    <div
      className={`group flex flex-col justify-between rounded-[1.75rem] border bg-white/92 p-6 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.42)] backdrop-blur transition duration-300 hover:-translate-y-1 hover:shadow-[0_30px_80px_-44px_rgba(15,23,42,0.55)] dark:bg-slate-950/80 ${tone.border}`}
    >
      <div>
        <div className="flex justify-between items-start mb-4">
          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider ${tone.pill}`}>
            <Icon className="w-3.5 h-3.5" /> {title}
          </span>
          <div className="text-right">
            <span className="font-black text-xl text-slate-900 dark:text-white block">{formatINR(cost)}</span>
            <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
          </div>
        </div>
        <h4 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1 leading-tight">{itemName || `No ${title} Selected`}</h4>
        <p className="text-sm font-medium text-slate-500 mb-6">{itemDetails}</p>
      </div>
      <div className="flex gap-3">
        <button 
          onClick={onSwap} 
          className="flex-1 py-2.5 rounded-xl text-sm font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
        >
          Swap Option
        </button>
        <button 
          onClick={onAdd} 
          className="w-12 h-10 flex items-center justify-center rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 transition-colors"
          title="Add another"
        >
          <FiPlus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

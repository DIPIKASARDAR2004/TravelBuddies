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

export const CustomizerCard: React.FC<CustomizerCardProps> = ({ 
  type, title, cost, itemName, itemDetails, onSwap, onAdd, icon: Icon, colorClass 
}) => {
  return (
    <div className={`glass-panel premium-shadow rounded-3xl p-6 flex flex-col justify-between hover-lift group border-t-4`} style={{ borderColor: `var(--${colorClass}-500, #3b82f6)` }}>
      <div>
        <div className="flex justify-between items-start mb-4">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-${colorClass}-100 dark:bg-${colorClass}-900/30 text-${colorClass}-700 dark:text-${colorClass}-400`}>
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

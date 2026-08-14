"use client";

import { FaArrowRight } from 'react-icons/fa';
import Link from 'next/link';

export default function EscrowBanner() {
  return (
    <div className="w-full bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 rounded-t-[3rem] shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)] py-10 px-8 mt-16 relative overflow-hidden">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
        <div>
          <h2 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight">
            Your Payment. <span className="text-blue-600 dark:text-blue-500">Protected.</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-2">
            Experience the future of secure travel bookings with our upcoming smart escrow system.
          </p>
        </div>
        
        <Link 
          href="/escrow" 
          className="flex items-center gap-2 text-slate-600 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400 font-medium transition-colors"
        >
          Learn how our escrow system works
          <FaArrowRight className="text-sm" />
        </Link>
      </div>
      
      {/* Decorative background circle */}
      <div className="absolute top-1/2 -translate-y-1/2 -right-20 w-64 h-64 bg-blue-50 dark:bg-blue-900/20 rounded-full blur-3xl -z-0"></div>
    </div>
  );
}

"use client";

import { FaShieldAlt, FaFemale, FaMapMarkedAlt } from 'react-icons/fa';

export default function Highlights() {
  return (
    <div className="w-full max-w-6xl mx-auto py-16 px-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4 lg:gap-12 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
        
        {/* Protected Payments */}
        <div className="flex items-start gap-5 pt-8 md:pt-0 md:px-6">
          <div className="bg-emerald-100 dark:bg-emerald-900/30 p-4 rounded-2xl shrink-0">
            <FaShieldAlt className="text-emerald-600 dark:text-emerald-400 text-2xl" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-1">Protected Payments</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Your money is safe with us until you check-in.
            </p>
          </div>
        </div>

        {/* Women Safety First */}
        <div className="flex items-start gap-5 pt-8 md:pt-0 md:px-6">
          <div className="bg-indigo-100 dark:bg-indigo-900/30 p-4 rounded-2xl shrink-0">
            <FaFemale className="text-indigo-600 dark:text-indigo-400 text-2xl" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-1">Women Safety First</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Verified women-friendly stays and safety features.
            </p>
          </div>
        </div>

        {/* Smart Maps */}
        <div className="flex items-start gap-5 pt-8 md:pt-0 md:px-6">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-2xl shrink-0">
            <FaMapMarkedAlt className="text-blue-600 dark:text-blue-400 text-2xl" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 dark:text-slate-100 text-lg mb-1">Smart Maps</h3>
            <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">
              Explore nearby hospitals, police stations and more.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}

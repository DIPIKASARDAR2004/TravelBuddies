"use client";

import { FaMapMarkerAlt, FaCalendarAlt, FaUser } from 'react-icons/fa';

export default function HeroSearchBar() {
  return (
    <div className="w-full max-w-5xl mx-auto bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl p-2 md:p-3 flex flex-col md:flex-row items-center gap-2 md:gap-0 border border-slate-100 dark:border-slate-800">
      
      {/* Destination */}
      <div className="flex-1 flex items-center gap-3 px-6 py-2 md:border-r border-slate-200 dark:border-slate-700 w-full md:w-auto hover:bg-slate-50 dark:hover:bg-slate-800 rounded-[2rem] md:rounded-none transition-colors cursor-pointer">
        <FaMapMarkerAlt className="text-slate-400 text-lg" />
        <div className="flex flex-col w-full">
          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Where to?</span>
          <input 
            type="text" 
            placeholder="Search destination" 
            className="bg-transparent border-none outline-none text-sm text-slate-600 dark:text-slate-400 placeholder:text-slate-400 w-full p-0"
          />
        </div>
      </div>

      {/* Check-in */}
      <div className="flex-[0.8] flex items-center gap-3 px-6 py-2 md:border-r border-slate-200 dark:border-slate-700 w-full md:w-auto hover:bg-slate-50 dark:hover:bg-slate-800 rounded-[2rem] md:rounded-none transition-colors cursor-pointer">
        <FaCalendarAlt className="text-slate-400 text-lg" />
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Check-in</span>
          <span className="text-sm text-slate-400">Select date</span>
        </div>
      </div>

      {/* Check-out */}
      <div className="flex-[0.8] flex items-center gap-3 px-6 py-2 md:border-r border-slate-200 dark:border-slate-700 w-full md:w-auto hover:bg-slate-50 dark:hover:bg-slate-800 rounded-[2rem] md:rounded-none transition-colors cursor-pointer">
        <FaCalendarAlt className="text-slate-400 text-lg" />
        <div className="flex flex-col">
          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Check-out</span>
          <span className="text-sm text-slate-400">Select date</span>
        </div>
      </div>

      {/* Travellers */}
      <div className="flex-1 flex items-center justify-between px-6 py-2 w-full md:w-auto hover:bg-slate-50 dark:hover:bg-slate-800 rounded-[2rem] md:rounded-none transition-colors cursor-pointer">
        <div className="flex items-center gap-3">
          <FaUser className="text-slate-400 text-lg" />
          <div className="flex flex-col">
            <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">Travellers</span>
            <span className="text-sm text-slate-600 dark:text-slate-400">1 Traveller</span>
          </div>
        </div>
        
        {/* Explore Button */}
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-full font-semibold transition-all shadow-md hover:shadow-lg ml-4 whitespace-nowrap">
          Explore
        </button>
      </div>

    </div>
  );
}

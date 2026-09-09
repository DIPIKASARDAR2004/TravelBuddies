import React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function HotelSearchForm() {
  return (
    <Card className="p-4 md:p-6 rounded-3xl mt-8">
      <form className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="col-span-1 md:col-span-2">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Destination or Hotel Name</label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text" 
              placeholder="Where are you going?" 
              className="w-full pl-11 px-4 py-3.5 rounded-xl border-none bg-white/50 dark:bg-slate-900/50 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-blue-500/50 transition-all backdrop-blur-sm"
            />
          </div>
        </div>
        
        <div className="col-span-1 border-t md:border-t-0 md:border-l border-slate-200 dark:border-slate-700 pt-4 md:pt-0 md:pl-4 flex flex-col justify-end">
          <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Guests & Rooms</label>
          <button type="button" className="w-full text-left px-4 py-3.5 rounded-xl bg-white/50 dark:bg-slate-900/50 text-slate-700 dark:text-slate-200 hover:bg-white/80 dark:hover:bg-slate-800/80 transition-colors flex items-center justify-between backdrop-blur-sm">
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
              2 Adults, 1 Room
            </span>
          </button>
        </div>

        <div className="col-span-1 flex items-end">
          <Button fullWidth size="lg" className="py-3.5 text-base shadow-blue-200 dark:shadow-blue-900/40 hover:-translate-y-0.5">
            Search Hotels
          </Button>
        </div>
      </form>
    </Card>
  );
}

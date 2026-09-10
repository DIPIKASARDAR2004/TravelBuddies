import React from "react";
import { FiMapPin, FiSearch, FiUsers } from "react-icons/fi";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface HotelSearchFormProps {
  query: string;
  guests: string;
  onQueryChange: (value: string) => void;
  onGuestsChange: (value: string) => void;
  onSearch: () => void;
}

export default function HotelSearchForm({
  query,
  guests,
  onQueryChange,
  onGuestsChange,
  onSearch,
}: HotelSearchFormProps) {
  return (
    <Card className="mt-8 rounded-[2rem] border border-white/25 p-4 md:p-6">
      <div className="grid gap-4 md:grid-cols-[1.5fr_0.9fr_auto]">
        <label className="flex items-center gap-3 rounded-[1.5rem] border border-slate-200 bg-white/75 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/70">
          <FiSearch className="h-5 w-5 text-slate-400" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Destination or property</span>
            <input
              type="text"
              placeholder="Udaipur, palace stay, lakefront..."
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              className="bg-transparent pt-1 text-sm text-slate-800 outline-none placeholder:text-slate-400 dark:text-white"
            />
          </div>
        </label>

        <label className="flex items-center gap-3 rounded-[1.5rem] border border-slate-200 bg-white/75 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/70">
          <FiUsers className="h-5 w-5 text-slate-400" />
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-500">Guests</span>
            <input
              type="number"
              min="1"
              value={guests}
              onChange={(event) => onGuestsChange(event.target.value)}
              className="bg-transparent pt-1 text-sm text-slate-800 outline-none dark:text-white"
            />
          </div>
        </label>

        <div className="flex items-end">
          <Button fullWidth size="lg" className="w-full py-3.5 text-base md:min-w-[180px]" onClick={onSearch}>
            Search stays
          </Button>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-900">
          <FiMapPin className="h-3.5 w-3.5" />
          Filter curated mock inventory instantly
        </span>
      </div>
    </Card>
  );
}

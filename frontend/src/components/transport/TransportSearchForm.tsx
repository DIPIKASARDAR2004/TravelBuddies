import React, { useState } from 'react';

interface TransportSearchFormProps {
  title: string;
  logoSrc: string;
}

export default function TransportSearchForm({ title, logoSrc }: TransportSearchFormProps) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [travelClass, setTravelClass] = useState("All");

  const swap = () => {
    const a = from;
    setFrom(to);
    setTo(a);
  };

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert(`Searching…\nFrom: ${from}\nTo: ${to}\nDate: ${date}\nClass: ${travelClass}`);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-4">
      <div className="flex items-center gap-4 mb-6 mt-8">
        <div className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-md border border-slate-200 dark:border-slate-700">
          <img src={logoSrc} className="w-10 h-10 object-contain rounded-full" alt="logo" />
        </div>
        <h2 className="text-3xl font-bold text-slate-800 dark:text-white tracking-tight">{title}</h2>
      </div>

      <form className="glass-panel premium-shadow rounded-2xl p-6 md:p-8 space-y-6" onSubmit={handleSearch}>
        <div className="flex flex-col md:flex-row items-end gap-4">
          <div className="w-full md:flex-1 space-y-2">
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">From</label>
            <input
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              type="text"
              placeholder="Kolkata"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </div>

          <div className="flex justify-center -mb-2 md:mb-2">
            <button
              type="button"
              className="p-3 bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400 hover:bg-blue-200 dark:hover:bg-blue-800/60 rounded-full transition-colors shadow-sm"
              aria-label="Swap From and To"
              onClick={swap}
              title="Swap"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg>
            </button>
          </div>

          <div className="w-full md:flex-1 space-y-2">
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">To</label>
            <input
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              type="text"
              placeholder="Mumbai/Delhi"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </div>

          <div className="w-full md:w-48 space-y-2">
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Date</label>
            <input
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>

          <div className="w-full md:w-40 space-y-2">
            <label className="text-sm font-semibold text-slate-600 dark:text-slate-300">Class</label>
            <select
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-slate-900 dark:text-white shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              value={travelClass}
              onChange={(e) => setTravelClass(e.target.value)}
            >
              <option>All</option>
              <option>AC</option>
              <option>Non-AC</option>
              <option>Sleeper</option>
            </select>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-start md:items-center gap-4 pt-4 border-t border-slate-200 dark:border-slate-700/50">
          <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Special Fares:</p>
          <div className="flex flex-wrap gap-2">
            {['Regular', 'Student', 'Senior Citizen', 'Doctor & Nurses', 'Army'].map(fare => (
              <label key={fare} className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 dark:border-slate-700 rounded-lg text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 cursor-pointer transition-colors bg-white dark:bg-slate-800">
                <input type="radio" name="fare" className="text-blue-600 focus:ring-blue-500" />
                {fare}
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-xl">
          <input type="checkbox" value="che" className="mt-1 w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-slate-300" />
          <div>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Add FlexiFly: 100% refund on cancellation or Zero date change charges
            </p>
            <a href="https://www.bing.com/search?q=train+policy" className="text-xs text-blue-600 dark:text-blue-400 hover:underline">View Details</a>
          </div>
        </div>

        <div className="pt-4 flex justify-center">
          <button className="w-full md:w-auto px-12 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all hover-lift text-lg" type="submit">
            Search Routes
          </button>
        </div>
      </form>
    </div>
  );
}

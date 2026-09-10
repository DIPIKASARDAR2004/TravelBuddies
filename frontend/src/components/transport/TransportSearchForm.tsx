import React, { useState } from "react";
import { FiArrowRight, FiCalendar, FiMapPin, FiShield, FiUsers } from "react-icons/fi";
import { Button } from "@/components/ui/Button";
import { StatusBanner } from "@/components/ui/StatusBanner";

interface TransportSearchFormProps {
  title: string;
  logoSrc: string;
  transportLabel: string;
}

const SPECIAL_FARES = ["Regular", "Student", "Senior Citizen", "Doctor & Nurses", "Army"] as const;

export default function TransportSearchForm({
  title,
  logoSrc,
  transportLabel,
}: TransportSearchFormProps) {
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [date, setDate] = useState("");
  const [travelClass, setTravelClass] = useState("All");
  const [fare, setFare] = useState<(typeof SPECIAL_FARES)[number]>("Regular");
  const [showFlexi, setShowFlexi] = useState(false);
  const [searchSummary, setSearchSummary] = useState<string | null>(null);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSearchSummary(
      `Previewing ${transportLabel.toLowerCase()} search from ${from || "your origin"} to ${to || "your destination"} on ${date || "your chosen date"} in ${travelClass} class with ${fare} fare${showFlexi ? " and flexi protection" : ""}.`,
    );
  };

  return (
    <div className="w-full max-w-6xl">
      <div className="mb-6 flex items-center gap-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-2 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <img src={logoSrc} className="h-11 w-11 rounded-xl object-contain" alt={`${transportLabel} icon`} />
        </div>
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400">Transport planner</p>
          <h2 className="text-3xl font-black tracking-tight text-slate-950 dark:text-white">{title}</h2>
        </div>
      </div>

      <form
        className="rounded-[2rem] border border-slate-200 bg-white/85 p-6 shadow-[0_24px_80px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/75 md:p-8"
        onSubmit={handleSearch}
      >
        <div className="grid gap-4 md:grid-cols-[1fr_auto_1fr_180px_160px]">
          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">From</span>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
              <FiMapPin className="h-4 w-4 text-slate-400" />
              <input
                className="w-full bg-transparent text-slate-900 outline-none dark:text-white"
                type="text"
                placeholder="Kolkata"
                value={from}
                onChange={(event) => setFrom(event.target.value)}
              />
            </div>
          </label>

          <div className="flex items-end justify-center">
            <button
              type="button"
              className="rounded-full bg-sky-100 p-3 text-sky-600 transition-colors hover:bg-sky-200 dark:bg-sky-950/40 dark:text-sky-300 dark:hover:bg-sky-950/60"
              aria-label="Swap from and to"
              onClick={swap}
              title="Swap route"
            >
              <FiArrowRight className="h-5 w-5" />
            </button>
          </div>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">To</span>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
              <FiMapPin className="h-4 w-4 text-slate-400" />
              <input
                className="w-full bg-transparent text-slate-900 outline-none dark:text-white"
                type="text"
                placeholder="Mumbai / Delhi"
                value={to}
                onChange={(event) => setTo(event.target.value)}
              />
            </div>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Date</span>
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
              <FiCalendar className="h-4 w-4 text-slate-400" />
              <input
                className="w-full bg-transparent text-slate-900 outline-none dark:text-white"
                type="date"
                value={date}
                onChange={(event) => setDate(event.target.value)}
              />
            </div>
          </label>

          <label className="space-y-2">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Class</span>
            <select
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition-all focus:ring-2 focus:ring-sky-500 dark:border-slate-800 dark:bg-slate-900 dark:text-white"
              value={travelClass}
              onChange={(event) => setTravelClass(event.target.value)}
            >
              <option>All</option>
              <option>AC</option>
              <option>Non-AC</option>
              <option>Sleeper</option>
            </select>
          </label>
        </div>

        <div className="mt-6 grid gap-6 border-t border-slate-200 pt-6 dark:border-slate-800 md:grid-cols-[1fr_auto] md:items-end">
          <div className="space-y-4">
            <div>
              <p className="mb-3 text-sm font-bold text-slate-800 dark:text-slate-200">Special fares</p>
              <div className="flex flex-wrap gap-2">
                {SPECIAL_FARES.map((option) => (
                  <label
                    key={option}
                    className={`cursor-pointer rounded-full border px-3 py-1.5 text-sm font-medium transition-colors ${
                      fare === option
                        ? "border-sky-300 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/40 dark:text-sky-300"
                        : "border-slate-200 bg-white text-slate-600 hover:border-sky-200 hover:text-sky-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-sky-800 dark:hover:text-sky-300"
                    }`}
                  >
                    <input
                      type="radio"
                      name="fare"
                      value={option}
                      checked={fare === option}
                      onChange={() => setFare(option)}
                      className="sr-only"
                    />
                    {option}
                  </label>
                ))}
              </div>
            </div>

            <label className="flex items-start gap-3 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm dark:border-sky-900/40 dark:bg-sky-950/20">
              <input
                type="checkbox"
                checked={showFlexi}
                onChange={(event) => setShowFlexi(event.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span className="text-slate-700 dark:text-slate-200">
                Add flexible protection for easier cancellation and date changes.
              </span>
            </label>
          </div>

          <div className="flex flex-col gap-3 md:min-w-[220px]">
            <Button className="w-full py-4 text-base" type="submit">
              Search routes
            </Button>
            <div className="inline-flex items-center justify-center gap-2 rounded-full bg-slate-100 px-4 py-2 text-xs font-semibold text-slate-500 dark:bg-slate-900 dark:text-slate-400">
              <FiUsers className="h-3.5 w-3.5" />
              Preview-only UI for now
            </div>
          </div>
        </div>

        {searchSummary ? (
          <div className="mt-6">
            <StatusBanner title="Search summary">{searchSummary}</StatusBanner>
          </div>
        ) : (
          <div className="mt-6">
            <StatusBanner tone="warning" title="Current limitation">
              Route search is still a UI preview here. This redesign replaces the old alert flow and leaves a clean seam for real transport data integration next.
            </StatusBanner>
          </div>
        )}

        <div className="mt-4 inline-flex items-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
          <FiShield className="h-3.5 w-3.5 text-sky-500" />
          Safer booking guidance and validation-ready transport form.
        </div>
      </form>
    </div>
  );
}

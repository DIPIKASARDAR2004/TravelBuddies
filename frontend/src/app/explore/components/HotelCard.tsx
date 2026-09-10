import React from "react";
import { FiArrowRight, FiMapPin, FiShield, FiStar } from "react-icons/fi";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface HotelCardProps {
  hotel: {
    id: number;
    name: string;
    location: string;
    price: string;
    rating: string;
    image: string;
  };
}

export default function HotelCard({ hotel }: HotelCardProps) {
  return (
    <Card hoverable className="group flex flex-col rounded-[1.75rem] border border-slate-200 bg-white/90 dark:border-slate-800 dark:bg-slate-950/70">
      <div className="relative h-64 overflow-hidden">
        <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950/55 via-slate-950/10 to-transparent" />
        <img
          src={hotel.image}
          alt={hotel.name}
          className="h-full w-full object-cover transition-transform duration-700 ease-in-out group-hover:scale-105"
        />
        <div className="absolute left-4 top-4 z-20 inline-flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-900 shadow-sm backdrop-blur dark:bg-slate-900/90 dark:text-white">
          <FiStar className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
          {hotel.rating}
        </div>
        <div className="absolute bottom-4 left-4 z-20 inline-flex items-center gap-1 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white backdrop-blur">
          <FiShield className="h-3.5 w-3.5" />
          Curated stay
        </div>
      </div>

      <div className="flex flex-1 flex-col p-5">
        <div className="mb-4">
          <h3 className="text-xl font-black tracking-tight text-slate-950 dark:text-white">{hotel.name}</h3>
          <div className="mt-2 flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
            <FiMapPin className="h-4 w-4" />
            {hotel.location}
          </div>
        </div>

        <div className="mb-5 rounded-2xl bg-slate-50 p-4 dark:bg-slate-900">
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-400">Starting rate</p>
          <p className="mt-2 text-2xl font-black text-slate-950 dark:text-white">
            {hotel.price}
            <span className="ml-1 text-sm font-medium text-slate-500 dark:text-slate-400">/ night</span>
          </p>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
          <p className="text-sm text-slate-500 dark:text-slate-400">Good fit for premium itinerary shortlists.</p>
          <Button size="sm" className="shrink-0">
            View stay
            <FiArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

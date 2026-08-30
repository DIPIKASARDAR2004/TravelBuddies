import React from "react";
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
    <Card hoverable className="flex flex-col border border-slate-100 dark:border-slate-800">
      <div className="relative h-64 overflow-hidden">
        <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-transparent transition-all duration-300 z-10"></div>
        <img
          src={hotel.image}
          alt={hotel.name}
          className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
        />
        <div className="absolute top-4 right-4 z-20 bg-white dark:bg-slate-800/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-sm font-semibold flex items-center gap-1 shadow-sm text-slate-800 dark:text-white">
          <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          {hotel.rating}
        </div>
      </div>

      <div className="p-5 flex flex-col flex-grow">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-bold text-lg text-slate-900 dark:text-white line-clamp-1">{hotel.name}</h3>
        </div>
        <div className="flex items-center text-slate-500 dark:text-slate-400 text-sm mb-4 gap-1">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {hotel.location}
        </div>
        
        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Starts from</span>
            <span className="font-bold text-slate-900 dark:text-white">{hotel.price} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">/night</span></span>
          </div>
          <Button size="sm">
            View Details
          </Button>
        </div>
      </div>
    </Card>
  );
}

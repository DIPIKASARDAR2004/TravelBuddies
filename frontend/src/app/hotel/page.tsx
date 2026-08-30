"use client";

import React from "react";
import HotelSearchForm from "./components/HotelSearchForm";
import HotelCard from "./components/HotelCard";
import { hotels } from "@/data/mockHotels";

export default function HotelBookingForm() {
  return (
    <main className="min-h-screen font-sans">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[500px] flex items-center justify-center">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <img
            src="https://images.unsplash.com/photo-1542314831-c6a4d274868c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80"
            alt="Luxury Hotel"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"></div>
        </div>

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-6xl px-6 flex flex-col items-center mt-[-4rem]">
          <h1 className="text-4xl md:text-6xl font-extrabold text-white text-center tracking-tight mb-4 drop-shadow-lg">
            Discover Exceptional Stays
          </h1>
          <p className="text-lg md:text-xl text-white/90 text-center mb-10 max-w-2xl drop-shadow-md">
            From lavish palaces to modern luxury retreats, book your perfect getaway with JourneyPilot.
          </p>

          <HotelSearchForm />
        </div>
      </section>

      {/* Featured Hotels Grid */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex flex-col items-center mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white tracking-tight mb-4">
            Exclusive Handpicked Stays
          </h2>
          <div className="h-1 w-24 bg-blue-600 rounded-full mb-6"></div>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl">
            Experience world-class hospitality in India's most prestigious properties, curated exclusively for our members.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {hotels.map((hotel) => (
            <HotelCard key={hotel.id} hotel={hotel} />
          ))}
        </div>
      </section>

      {/* Footer Section */}
      <footer className="bg-slate-900 text-slate-300 py-16 mt-12 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div>
            <h4 className="text-white font-bold text-lg mb-4">JourneyPilot Luxury Stays</h4>
            <p className="text-sm leading-relaxed text-slate-400">
              Elevate your travel experience with our handpicked collection of luxury hotels, resorts, and heritage properties. Enjoy seamless booking, exclusive perks, and 24/7 concierge support.
            </p>
          </div>

          <div>
            <h4 className="text-white font-bold text-lg mb-4">Why Book With Us?</h4>
            <ul className="text-sm space-y-3 text-slate-400">
              <li className="flex gap-2"><span className="text-blue-500">✓</span> Lowest Price Guarantee</li>
              <li className="flex gap-2"><span className="text-blue-500">✓</span> Free Cancellations</li>
              <li className="flex gap-2"><span className="text-blue-500">✓</span> Verified Guest Reviews</li>
              <li className="flex gap-2"><span className="text-blue-500">✓</span> Complimentary Upgrades</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-lg mb-4">Top Destinations</h4>
            <ul className="text-sm space-y-3 text-slate-400">
              <li className="hover:text-blue-400 cursor-pointer transition-colors">Hotels in Udaipur</li>
              <li className="hover:text-blue-400 cursor-pointer transition-colors">Resorts in Goa</li>
              <li className="hover:text-blue-400 cursor-pointer transition-colors">Villas in Kerala</li>
              <li className="hover:text-blue-400 cursor-pointer transition-colors">Palaces in Jaipur</li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-bold text-lg mb-4">Safe & Secure Payments</h4>
            <p className="text-sm leading-relaxed text-slate-400 mb-4">
              We accept all major credit cards, UPI, and digital wallets. Your transactions are secured with industry-leading encryption.
            </p>
            <div className="flex gap-3 opacity-60 grayscale">
              <div className="w-10 h-6 bg-slate-700 rounded"></div>
              <div className="w-10 h-6 bg-slate-700 rounded"></div>
              <div className="w-10 h-6 bg-slate-700 rounded"></div>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 mt-12 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
          © 2026 JourneyPilot. All rights reserved.
        </div>
      </footer>
    </main>
  );
}

"use client";

import { useState } from "react";

export default function HotelBookingForm() {
  const [city, setCity] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [rooms, setRooms] = useState(1);
  const [guests, setGuests] = useState(2);
  const [price, setPrice] = useState("0-1500");

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    alert(
      `Searching Hotels...\nCity: ${city}\nCheck-In: ${checkIn}\nCheck-Out: ${checkOut}\nRooms: ${rooms}, Guests: ${guests}\nPrice: ${price}`
    );
  };

  const hotels = [
    {
      id: 1,
      name: "The Leela Palace",
      location: "Udaipur",
      price: "₹18,500",
      rating: "4.9",
      image: "https://images.unsplash.com/photo-1542314831-c6a4d274868c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 2,
      name: "The Oberoi Udaivilas",
      location: "Udaipur",
      price: "₹22,000",
      rating: "5.0",
      image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 3,
      name: "ITC Grand Chola",
      location: "Chennai",
      price: "₹12,000",
      rating: "4.8",
      image: "https://images.unsplash.com/photo-1551882547-ff40eb0d8e73?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 4,
      name: "The Lodhi",
      location: "New Delhi",
      price: "₹15,500",
      rating: "4.7",
      image: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 5,
      name: "Umaid Bhawan Palace",
      location: "Jodhpur",
      price: "₹25,000",
      rating: "4.9",
      image: "https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 6,
      name: "Taj Lake Palace",
      location: "Udaipur",
      price: "₹30,000",
      rating: "5.0",
      image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 7,
      name: "Raj Palace",
      location: "Jaipur",
      price: "₹14,000",
      rating: "4.6",
      image: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    },
    {
      id: 8,
      name: "The Oberoi Grand",
      location: "Kolkata",
      price: "₹11,500",
      rating: "4.8",
      image: "https://images.unsplash.com/photo-1445019980597-93fa8acb246c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 font-sans">
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
            From lavish palaces to modern luxury retreats, book your perfect getaway with Journey Pilot.
          </p>

          {/* Glassmorphism Search Form */}
          <form
            onSubmit={handleSearch}
            className="w-full bg-white/10 backdrop-blur-md border border-white/20 p-4 md:p-6 rounded-3xl shadow-2xl flex flex-col md:flex-row gap-4 md:items-end"
          >
            {/* Location */}
            <div className="flex-1">
              <label className="block text-white text-sm font-medium mb-1.5 ml-1">Location</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="w-5 h-5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <input
                  type="text"
                  placeholder="Where to?"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border-none focus:ring-4 focus:ring-blue-500/50 bg-white/90 text-slate-900 placeholder-slate-500 shadow-inner transition-all"
                />
              </div>
            </div>

            {/* Dates */}
            <div className="flex flex-1 gap-4">
              <div className="flex-1">
                <label className="block text-white text-sm font-medium mb-1.5 ml-1">Check-in</label>
                <input
                  type="date"
                  value={checkIn}
                  onChange={(e) => setCheckIn(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-none focus:ring-4 focus:ring-blue-500/50 bg-white/90 text-slate-900 shadow-inner transition-all"
                />
              </div>
              <div className="flex-1">
                <label className="block text-white text-sm font-medium mb-1.5 ml-1">Check-out</label>
                <input
                  type="date"
                  value={checkOut}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-none focus:ring-4 focus:ring-blue-500/50 bg-white/90 text-slate-900 shadow-inner transition-all"
                />
              </div>
            </div>

            {/* Guests & Price */}
            <div className="flex flex-1 gap-4">
              <div className="flex-[0.6]">
                <label className="block text-white text-sm font-medium mb-1.5 ml-1">Guests</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    value={guests}
                    onChange={(e) => setGuests(Number(e.target.value))}
                    className="w-full px-3 py-3 rounded-xl border-none focus:ring-4 focus:ring-blue-500/50 bg-white/90 text-slate-900 text-center shadow-inner transition-all"
                  />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-white text-sm font-medium mb-1.5 ml-1">Budget</label>
                <select
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border-none focus:ring-4 focus:ring-blue-500/50 bg-white/90 text-slate-900 shadow-inner transition-all appearance-none"
                >
                  <option value="0-1500">₹0 - 1500</option>
                  <option value="1500-2500">₹1500 - 2500</option>
                  <option value="2500-5000">₹2500 - 5000</option>
                  <option value="5000+">₹5000+</option>
                </select>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex-shrink-0 w-full md:w-auto mt-4 md:mt-0">
              <button
                type="submit"
                className="w-full md:w-auto px-8 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Featured Hotels Grid */}
      <section className="max-w-6xl mx-auto px-6 py-20">
        <div className="flex flex-col items-center mb-12 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight mb-4">
            Exclusive Handpicked Stays
          </h2>
          <div className="h-1 w-24 bg-blue-600 rounded-full mb-6"></div>
          <p className="text-slate-600 max-w-2xl">
            Experience world-class hospitality in India&apos;s most prestigious properties, curated exclusively for our members.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {hotels.map((hotel) => (
            <div
              key={hotel.id}
              className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl border border-slate-100 transition-all duration-300 flex flex-col"
            >
              {/* Image Container */}
              <div className="relative h-64 overflow-hidden">
                <div className="absolute inset-0 bg-slate-900/20 group-hover:bg-transparent transition-all duration-300 z-10"></div>
                <img
                  src={hotel.image}
                  alt={hotel.name}
                  className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700 ease-in-out"
                />
                <div className="absolute top-4 right-4 z-20 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-sm font-semibold flex items-center gap-1 shadow-sm text-slate-800">
                  <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                  {hotel.rating}
                </div>
              </div>

              {/* Content */}
              <div className="p-5 flex flex-col flex-grow">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-bold text-lg text-slate-900 line-clamp-1">{hotel.name}</h3>
                </div>
                <div className="flex items-center text-slate-500 text-sm mb-4 gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {hotel.location}
                </div>
                
                <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-500 font-medium">Starts from</span>
                    <span className="font-bold text-slate-900">{hotel.price} <span className="text-sm font-normal text-slate-500">/night</span></span>
                  </div>
                  <button className="px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-blue-600 transition-colors">
                    View Details
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Re-written Footer Section */}
      <footer className="bg-slate-900 text-slate-300 py-16 mt-12 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div>
            <h4 className="text-white font-bold text-lg mb-4">Journey Pilot Luxury Stays</h4>
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
              {/* Payment Icons Placeholder */}
              <div className="w-10 h-6 bg-slate-700 rounded"></div>
              <div className="w-10 h-6 bg-slate-700 rounded"></div>
              <div className="w-10 h-6 bg-slate-700 rounded"></div>
            </div>
          </div>
        </div>
        <div className="max-w-6xl mx-auto px-6 mt-12 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
          © 2026 Journey Pilot. All rights reserved.
        </div>
      </footer>
    </main>
  );
}

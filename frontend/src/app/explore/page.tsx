import React from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabaseClient';

export default async function ExplorePage() {
  // Fetch some hotels to display as popular destinations
  const { data: hotels } = await supabase
    .from('hotels')
    .select('*')
    .limit(6);

  // Fallback data if DB fetch fails or is empty
  const destinations = hotels && hotels.length > 0 ? hotels : [
    { id: '1', name: 'Taj Mahal Palace', city: 'Mumbai', image_url: 'https://images.unsplash.com/photo-1566438480900-0609be27a4be?q=80&w=800&auto=format&fit=crop', rating: 4.8 },
    { id: '2', name: 'Oberoi Amarvilas', city: 'Agra', image_url: 'https://images.unsplash.com/photo-1548013146-72479768bada?q=80&w=800&auto=format&fit=crop', rating: 4.9 },
    { id: '3', name: 'Umaid Bhawan', city: 'Jodhpur', image_url: 'https://images.unsplash.com/photo-1596895111956-bf1cf0599ce5?q=80&w=800&auto=format&fit=crop', rating: 4.7 },
    { id: '4', name: 'Rambagh Palace', city: 'Jaipur', image_url: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?q=80&w=800&auto=format&fit=crop', rating: 4.9 },
    { id: '5', name: 'The Leela Palace', city: 'Udaipur', image_url: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?q=80&w=800&auto=format&fit=crop', rating: 4.8 },
    { id: '6', name: 'ITC Grand Chola', city: 'Chennai', image_url: 'https://images.unsplash.com/photo-1551882547-ff40eb0d8e71?q=80&w=800&auto=format&fit=crop', rating: 4.6 }
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 pt-24 pb-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white mb-4 tracking-tight">
            Explore <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Destinations</span>
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Discover breathtaking stays and highly-rated accommodations for your next adventure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {destinations.map((hotel) => (
            <Link href="/hotel" key={hotel.id} className="group block">
              <div className="bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-slate-100 dark:border-slate-800 flex flex-col h-full transform hover:-translate-y-1">
                <div className="relative h-60 overflow-hidden">
                  <img 
                    src={hotel.image_url || "https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=800&auto=format&fit=crop"} 
                    alt={hotel.name} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-bold text-slate-800 dark:text-white shadow-sm flex items-center gap-1">
                    <span className="text-yellow-500">★</span> {hotel.rating || '4.5'}
                  </div>
                </div>
                <div className="p-6 flex flex-col flex-grow">
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-1">{hotel.name}</h3>
                  <p className="text-slate-500 dark:text-slate-400 flex items-center gap-1 mb-4">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    {hotel.city || 'India'}
                  </p>
                  <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                    <span className="text-blue-600 dark:text-blue-400 font-medium group-hover:underline">View Details</span>
                    <span className="text-slate-400 transition-transform group-hover:translate-x-1">→</span>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

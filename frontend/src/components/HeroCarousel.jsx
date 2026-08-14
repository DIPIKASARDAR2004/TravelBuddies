 // components/HeroCarousel.tsx
'use client';

import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import Image from 'next/image';

const slides = [
  {
    image: '/add1.jpg',
    title: 'Sun, Sand & Goa',
    subtitle: 'Beachside resorts & nightlife',
    price: 'Packages from ₹6,999*',
    note: 'Festive deals live now',
  },
  {
    image: '/image3.png',
    title: 'Winter in Kashmir',
    subtitle: 'Snowy escapes & cozy stays',
    price: 'From ₹8,499*',
    note: 'Limited availability',
  },
  {
    image: '/image2.png',
    title: 'Luxury Villas in Bali',
    subtitle: 'Private pools & ocean views',
    price: 'From ₹12,999/night',
    note: 'Book early for best rates',
  },
  {
    image: 'https://img.freepik.com/premium-psd/travel-tour-social-media-post-template_608451-3741.jpg?w=2000',
    title: 'Romantic Paris',
    subtitle: 'Curated stays for couples',
    price: 'From ₹4,499/night',
    note: 'Airbnb picks for you',
  },
  {
    image: 'https://img.freepik.com/premium-psd/travel-agency-social-media-post-template_505751-5121.jpg',
    title: 'Thailand Adventures',
    subtitle: 'Island hopping & street food',
    price: 'Packages from ₹9,999*',
    note: 'Explore now',
  },
];


export default function HeroCarousel() {
  return (
    <div className="w-full max-w-screen-xl mx-auto">
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        autoplay={{ delay: 3000 }}
        pagination={{ clickable: true }}
        navigation
        loop
        className="rounded-lg overflow-hidden"
      >
        {slides.map((slide, index) => (
          <SwiperSlide key={index}>
            {/* White card container */}
            <div className="flex items-center justify-center h-[400px] md:h-[300px] bg-white rounded-lg shadow-lg">
              {/* Image inside the white box */}
              <img
                src={slide.image}
                alt={`Slide ${index}`}
                className="object-contain h-full w-full p-4"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

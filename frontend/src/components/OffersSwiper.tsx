'use client';
import { Swiper, SwiperSlide } from 'swiper/react';
import 'swiper/css';
import OfferCard from './OfferCard';
import Image from 'next/image';

const offers = [
  {
    category: 'INTL FLIGHTS • T&C APPLY',
    title: 'Avail Up to 60% OFF + Interest-free EMI',
    description: 'Domestic & international flights.',
    imageSrc: '/logoimg.jpg',
    ctaText: 'BOOK NOW',
  },
  {
    category: 'TRAINS • T&C APPLY',
    title: 'Aadhaar-based Authentication on IRCTC',
    description: 'New mandatory for Tatkal bookings.',
    imageSrc: '/image3.png',
    ctaText: 'BOOK NOW',
  },
  {
    category: 'CABS • T&C APPLY',
    title: 'Grab FLAT 18% OFF on Buses',
    description: 'From Delhi, Uttar Pradesh & more.',
    imageSrc: '/image2.png',
    ctaText: 'BOOK NOW',
    promoCode: 'MMT18OFF',
  },
  {
    category: 'INTL FLIGHTS • T&C APPLY',
    title: 'Avail Up to 60% OFF + Interest-free EMI',
    description: 'Domestic & international flights.',
    imageSrc: '/images.png',
    ctaText: 'BOOK NOW',
  },
  {
    category: 'INTL FLIGHTS • T&C APPLY',
    title: 'Avail Up to 60% OFF + Interest-free EMI',
    description: 'Domestic & international flights.',
    imageSrc: '/image.png',
    ctaText: 'BOOK NOW',
  },
];

export default function OffersSwiper() {
  return (
    <div className="px-4 py-6">
      <Swiper spaceBetween={16} slidesPerView={'auto'}>
        {offers.map((offer, index) => (
          <SwiperSlide key={index} style={{ width: '320px' }}>
            <OfferCard {...offer} />
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

"use client";

import Link from "next/link";
import { FaMoneyBillWave, FaGift, FaFemale, FaUserGraduate } from "react-icons/fa";

export default function HolidayPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 bg-cover bg-center"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80')",
      }}
    >
      <h1 className="text-4xl md:text-5xl font-bold text-white mb-10 drop-shadow-lg">
        Holiday Packages
      </h1>

      {/* Grid of 4 options */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 w-full max-w-6xl">
        
        {/* Budget Packages */}
        <Link
          href="/holyday/budget"
          className="bg-black/60 backdrop-blur-md text-white rounded-2xl p-6 shadow-lg hover:scale-105 transition-transform text-center"
        >
          <FaMoneyBillWave className="text-green-400 text-5xl mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Budget Packages</h2>
          <p className="mt-2">Affordable trips for everyone.</p>
        </Link>

        {/* Special Packages */}
        <Link
          href="/holyday/special"
          className="bg-black/60 backdrop-blur-md text-white rounded-2xl p-6 shadow-lg hover:scale-105 transition-transform text-center"
        >
          <FaGift className="text-red-400 text-5xl mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Special Packages</h2>
          <p className="mt-2">Exclusive offers & seasonal trips.</p>
        </Link>

        {/* Women Special Offer */}
        <Link
          href="/holyday/website-offer"
          className="bg-black/60 backdrop-blur-md text-white rounded-2xl p-6 shadow-lg hover:scale-105 transition-transform text-center"
        >
          <FaFemale className="text-pink-400 text-5xl mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Women Only</h2>
          <p className="mt-2">Deals only on our website.</p>
        </Link>

        {/* Students Offer */}
        <Link
          href="/holyday/student-offer"
          className="bg-black/60 backdrop-blur-md text-white rounded-2xl p-6 shadow-lg hover:scale-105 transition-transform text-center"
        >
          <FaUserGraduate className="text-blue-400 text-5xl mx-auto mb-4" />
          <h2 className="text-xl font-semibold">Students Offer</h2>
          <p className="mt-2">Discounts designed for students.</p>
        </Link>

      </div>
    </div>
  );
}

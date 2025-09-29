 // ThailandPackagesPage.tsx
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { motion } from "framer-motion";
import Image from "next/image";

// Package type
interface Package {
  title: string;
  nights: string;
  details: string[];
  price: string;
  total: string;
  image: string;
}

/* your existing package data */
const packages: Package[] = [
  {
    title: "Spectacular Krabi & Phuket Getaway",
    nights: "5N/6D",
    details: ["2N Krabi + 3N Phuket", "Round Trip Flights", "4 Star Hotels", "4 Activities"],
    price: "₹55,141 / Person",
    total: "Total ₹1,10,282",
    image: "/krabi-phuket.jpg",
  },
  {
    title: "Best of Pattaya & Bangkok Getaway",
    nights: "5N/6D",
    details: ["3N Pattaya + 2N Bangkok", "Round Trip Flights", "4 Star Hotels", "4 Activities"],
    price: "₹47,910 / Person",
    total: "Total ₹95,820",
    image: "/pattaya-bangkok.jpg",
  },
  {
    title: "Phuket Island Escape",
    nights: "4N/5D",
    details: ["4N Phuket", "Round Trip Flights", "4 Star Hotels", "3 Activities"],
    price: "₹47,672 / Person",
    total: "Total ₹95,344",
    image: "/phuket.jpg",
     },
  {
    title: "Couples Choice – Seal Deal",
    nights: "6N/7D",
    details: ["2N Krabi + 1N Phi Phi + 3N Phuket", "Round Trip Flights", "4 Star Hotels", "7 Activities"],
    price: "₹67,178 / Person",
    total: "Total ₹1,34,356",
    image: "/couples-choice.jpg",
  },
  {
    title: "Breathtaking Pattaya & Bangkok",
    nights: "4N/5D",
    details: ["2N Pattaya + 2N Bangkok", "Round Trip Flights", "4 Star Hotels", "4 Activities"],
    price: "₹45,946 / Person",
    total: "Total ₹91,892",
    image: "/pattaya.jpg",
  },
  {
    title: "Tour of the Magnificent Islands",
    nights: "5N/6D",
    details: ["2N Krabi + 1N Phi Phi + 2N Phuket", "Round Trip Flights", "4 Star Hotels", "6 Activities"],
    price: "₹52,964 / Person",
    total: "Total ₹1,05,928",
    image: "/islands.jpg",
  },
   {
    title: "Romantic Krabi & Phuket Vacay",
    nights: "6N/7D",
    details: ["3N Krabi + 3N Phuket", "Round Trip Flights", "4 Star Hotels", "8 Activities"],
    price: "₹61,999 / Person",
    total: "Total ₹1,23,998",
    image: "/romantic-krabi.jpg",
  },
  {
    title: "Joyful Krabi & Phuket Getaway",
    nights: "4N/5D",
    details: ["2N Krabi + 2N Phuket", "Round Trip Flights", "4 Star Hotels", "5 Activities"],
    price: "₹49,999 / Person",
    total: "Total ₹99,998",
    image: "/joyful-krabi.jpg",
  },
];



const packages: Package[] = [/* your existing package data */];

export default function ThailandPackagesPage() {
  const [activeTab, setActiveTab] = React.useState("all");

  const filteredPackages = packages.filter(pkg => {
    if (activeTab === "all") return true;
    if (activeTab === "honeymoon") return pkg.title.toLowerCase().includes("couple");
    if (activeTab === "family") return pkg.details.some(d => d.toLowerCase().includes("family"));
    if (activeTab === "premium") return parseInt(pkg.price.replace(/[^\d]/g, "")) > 60000;
    if (activeTab === "group") return pkg.details.some(d => d.toLowerCase().includes("group"));
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Search */}
      <div className="bg-blue-900 text-white p-6">
        <div className="max-w-6xl mx-auto flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
          <Input placeholder="Starting From (e.g. New Delhi)" className="bg-white text-black" />
          <Input placeholder="Going To (e.g. Thailand)" className="bg-white text-black" />
          <Input placeholder="Starting Date" type="date" className="bg-white text-black" />
          <Button className="flex gap-2"><Search className="w-4" /> Search</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-6xl mx-auto mt-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="flex gap-2">
            <TabsTrigger value="all">All Packages</TabsTrigger>
            <TabsTrigger value="honeymoon">Honeymoon</TabsTrigger>
            <TabsTrigger value="family">Family Vacays</TabsTrigger>
            <TabsTrigger value="premium">Premium</TabsTrigger>
            <TabsTrigger value="group">Group Tour</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Scrollable Package Cards */}
      <div className="max-w-6xl mx-auto overflow-x-auto snap-x snap-mandatory flex gap-6 p-6">
        {filteredPackages.map((pkg, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            whileHover={{ scale: 1.03 }}
            className="min-w-[300px] snap-start shadow-lg rounded-2xl overflow-hidden bg-white"
          >
            <Image
              src={pkg.image}
              alt={pkg.title}
              width={400}
              height={200}
              className="w-full h-48 object-cover"
            />
            <Card className="border-0 shadow-none">
              <CardContent className="p-4 space-y-2">
                <h3 className="text-lg font-semibold">{pkg.title}</h3>
                <p className="text-sm text-gray-500">{pkg.nights}</p>
                <ul className="text-sm list-disc list-inside text-gray-600">
                  {pkg.details.map((d, idx) => (
                    <li key={idx}>{d}</li>
                  ))}
                </ul>
                <p className="text-blue-700 font-bold">{pkg.price}</p>
                <p className="text-gray-500 text-sm">{pkg.total}</p>
                <Button className="w-full mt-2">Book Now</Button>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

"use client";

import React, { useState } from "react";
import { FaRoute, FaTree, FaLandmark, FaClock, FaMapMarkedAlt } from "react-icons/fa";

interface Route {
  id: number;
  title: string;
  description: string;
  icon: JSX.Element;
  duration?: string;
}

const routes: Route[] = [
  {
    id: 1,
    title: "Scenic Route",
    description: "Enjoy rivers, mountains & natural beauty.",
    icon: <FaTree className="text-green-500 text-3xl" />,
    duration: "2-3 hrs",
  },
  {
    id: 2,
    title: "Cultural Trail",
    description: "Visit historic sites, temples & museums.",
    icon: <FaLandmark className="text-yellow-500 text-3xl" />,
    duration: "3-4 hrs",
  },
  {
    id: 3,
    title: "Quick Route",
    description: "Optimized for time-efficient travel.",
    icon: <FaClock className="text-blue-500 text-3xl" />,
    duration: "1 hr",
  },
  {
    id: 4,
    title: "Hidden Gems",
    description: "Discover secret spots away from crowds.",
    icon: <FaMapMarkedAlt className="text-purple-500 text-3xl" />,
  },
];

export default function ExploreRoutes() {
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  return (
    <div className="p-6 bg-white shadow-lg rounded-xl max-w-4xl mx-auto mt-10">
      <h2 className="text-2xl font-bold mb-6 text-center">Explore Routes</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {routes.map((route) => (
          <div
            key={route.id}
            onClick={() => setSelectedRoute(route)}
            className="cursor-pointer p-4 border rounded-xl hover:shadow-2xl transition duration-300 flex items-center gap-4 bg-gray-50 hover:bg-gray-100"
          >
            {route.icon}
            <div>
              <h3 className="font-semibold text-lg">{route.title}</h3>
              <p className="text-sm text-gray-600">{route.description}</p>
              {route.duration && (
                <p className="text-xs text-gray-500 mt-1">Duration: {route.duration}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {selectedRoute && (
        <div className="mt-8 p-4 border rounded-xl bg-gray-50 shadow-lg animate-fadeIn">
          <h3 className="font-bold text-xl mb-2">{selectedRoute.title}</h3>
          <p>{selectedRoute.description}</p>
          {selectedRoute.duration && <p className="text-gray-600 mt-1">Duration: {selectedRoute.duration}</p>}
        </div>
      )}
    </div>
  );
}

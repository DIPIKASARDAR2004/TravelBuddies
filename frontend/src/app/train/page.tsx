"use client";

import { TransportLanding } from "@/components/transport/TransportLanding";

const TRAIN_OFFERS = [
  {
    image: "/t1.png",
    title: "Goa Express",
    description: "A familiar long-route option for leisure travelers who want a clear trip starting point.",
  },
  {
    image: "/t2.jpg",
    title: "Mumbai Rajdhani Express",
    description: "A strong premium benchmark for users comparing comfort and city-to-city travel time.",
  },
  {
    image: "/t5.jpg",
    title: "Kolkata Rajdhani",
    description: "A useful rail example for eastbound planning and route-oriented itinerary thinking.",
  },
  {
    image: "/t7.jpg",
    title: "Bhopal Shatabdi",
    description: "A faster day-travel style option when time efficiency matters more than overnight flexibility.",
  },
];

const TRAIN_SECTIONS = [
  {
    title: "Cleaner route planning",
    body: "The train page now follows the same information hierarchy as the redesigned planner rather than relying on older isolated layout classes.",
  },
  {
    title: "Better UX seam",
    body: "Instead of an alert popup, route entry now produces a visible summary state that can later be replaced by real search results without changing the interaction model.",
  },
  {
    title: "Less duplication",
    body: "Bus and train pages now share the same transport landing components, which reduces maintenance cost and keeps visual updates synchronized.",
  },
];

export default function Train() {
  return (
    <TransportLanding
      title="Explore rail travel in a layout that is easier to use and easier to maintain"
      subtitle="Search route details with a cleaner form, browse notable train options, and hand off into the broader trip-planning flow without losing momentum."
      logoSrc="/d2.png"
      transportLabel="Train"
      accent="sky"
      offers={TRAIN_OFFERS}
      footerTitle="How the transport redesign fits the broader frontend cleanup"
      footerSections={TRAIN_SECTIONS}
    />
  );
}

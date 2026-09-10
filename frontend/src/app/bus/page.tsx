"use client";

import { TransportLanding } from "@/components/transport/TransportLanding";

const BUS_OFFERS = [
  {
    image: "/b2.png",
    title: "Scania Metrolink",
    description: "A comfortable premium coach option for longer intercity travel with smoother cabin comfort.",
  },
  {
    image: "/b3.png",
    title: "Tata Marcopolo and Globus",
    description: "Popular fleet picks when you want broader route coverage without overcomplicating selection.",
  },
  {
    image: "/b5.png",
    title: "BharatBenz 2441",
    description: "A practical higher-capacity option for busy routes and group-oriented travel demand.",
  },
  {
    image: "/b7.png",
    title: "Airavat Club Class",
    description: "A recognizable premium-state service style for travelers prioritizing reliability and comfort.",
  },
];

const BUS_SECTIONS = [
  {
    title: "Why this flow matters",
    body: "Bus planning should not feel like a disconnected microsite. This redesign keeps search, trip planning, and safer travel guidance closer together.",
  },
  {
    title: "What improved here",
    body: "The old alert-based interaction has been replaced with an actual booking-form summary state, clearer inputs, and reusable components shared with the rest of the frontend.",
  },
  {
    title: "What comes next",
    body: "The current form is ready for real route APIs. The component seams are cleaner now, so transport search can be implemented without rewriting the page shell again.",
  },
];

export default function Bus() {
  return (
    <TransportLanding
      title="Find bus routes with a cleaner, calmer booking experience"
      subtitle="Use a more structured search flow, browse highlighted coach options, and move into the main trip planner whenever you are ready to build the full itinerary."
      logoSrc="/blo.png"
      transportLabel="Bus"
      accent="amber"
      offers={BUS_OFFERS}
      footerTitle="Why JourneyPilot is moving transport pages toward the same product system"
      footerSections={BUS_SECTIONS}
    />
  );
}

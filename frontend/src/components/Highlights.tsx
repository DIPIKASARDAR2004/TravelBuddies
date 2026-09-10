"use client";

import { FaFemale, FaMapMarkedAlt, FaShieldAlt } from "react-icons/fa";
import { SectionHeader } from "@/components/ui/SectionHeader";

const highlights = [
  {
    title: "Protected payments",
    body: "Keep booking funds protected until check-in milestones are met.",
    icon: FaShieldAlt,
    tone: "emerald",
  },
  {
    title: "Women safety first",
    body: "Filter planning around verified women-friendly stays and dedicated safety tools.",
    icon: FaFemale,
    tone: "rose",
  },
  {
    title: "Map-aware planning",
    body: "Preview activity timing, travel legs, and return-to-hotel guidance before checkout.",
    icon: FaMapMarkedAlt,
    tone: "sky",
  },
] as const;

const toneClasses = {
  emerald: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-300",
  rose: "bg-rose-100 text-rose-700 dark:bg-rose-950/30 dark:text-rose-300",
  sky: "bg-sky-100 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300",
} as const;

export default function Highlights() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-16">
      <SectionHeader
        eyebrow="Why it feels different"
        title="A calmer trip flow from the first click"
        description="The product now leans into planning clarity, safer decision making, and fewer dead-end experiences across the journey."
        align="center"
      />

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {highlights.map((item) => (
          <article
            key={item.title}
            className="rounded-[1.75rem] border border-slate-200 bg-white/85 p-6 shadow-[0_24px_70px_-40px_rgba(15,23,42,0.35)] backdrop-blur dark:border-slate-800 dark:bg-slate-950/75"
          >
            <div className={`inline-flex rounded-2xl p-4 ${toneClasses[item.tone]}`}>
              <item.icon className="text-2xl" />
            </div>
            <h3 className="mt-5 text-xl font-black tracking-tight text-slate-950 dark:text-white">
              {item.title}
            </h3>
            <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">{item.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}

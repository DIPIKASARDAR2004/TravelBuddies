import CardGrid from "@/components/CardGrid";
import HeroSearchBar from "@/components/HeroSearchBar";
import Highlights from "@/components/Highlights";
import EscrowBanner from "@/components/EscrowBanner";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen w-full flex-col bg-[radial-gradient(circle_at_top,#e0f2fe,transparent_28%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] pt-[72px] dark:bg-[radial-gradient(circle_at_top,#082f49,transparent_24%),linear-gradient(180deg,#020617_0%,#0f172a_100%)]">
      <section className="relative flex h-[640px] w-full flex-col items-center justify-center px-6 pb-32 pt-10 md:h-[720px]">
        <div className="absolute inset-0 z-0">
          <img
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop"
            alt="Scenic mountain lake travel background"
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(2,6,23,0.18)_0%,rgba(2,6,23,0.52)_55%,rgba(248,250,252,1)_100%)] dark:bg-[linear-gradient(180deg,rgba(2,6,23,0.2)_0%,rgba(2,6,23,0.7)_55%,rgba(2,6,23,1)_100%)]" />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-5xl flex-col items-center text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/12 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            Plan smarter, travel calmer
          </div>

          <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-white drop-shadow-lg md:text-7xl lg:text-8xl">
            Trips that feel
            <br />
            <span className="text-sky-300">thought through</span>
            <span className="text-white"> before takeoff.</span>
          </h1>

          <p className="mb-10 max-w-2xl text-lg font-medium text-slate-100 drop-shadow-md md:text-xl">
            Build a full travel plan with curated packages, safer stay options, itinerary mapping, and protected checkout in one flow.
          </p>

          <div className="mb-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/plan"
              className="rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-950 transition-colors hover:bg-slate-100"
            >
              Open trip planner
            </Link>
            <Link
              href="/safety"
              className="rounded-full border border-white/30 bg-white/10 px-6 py-3 text-sm font-bold text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              Explore safety mode
            </Link>
          </div>

          <div className="absolute -bottom-32 left-1/2 w-full max-w-5xl -translate-x-1/2 px-4 md:-bottom-24">
            <HeroSearchBar />
          </div>
        </div>
      </section>

      <div className="relative z-20 flex flex-1 flex-col bg-transparent pt-36 md:pt-28">
        <Highlights />
        <CardGrid />
        <EscrowBanner />
      </div>
    </div>
  );
}

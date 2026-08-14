import CardGrid from "@/components/CardGrid";
import HeroSearchBar from "@/components/HeroSearchBar";
import Highlights from "@/components/Highlights";
import EscrowBanner from "@/components/EscrowBanner";

export default function HomePage() {
  return (
    <div className="w-full min-h-screen bg-slate-50 dark:bg-[#0b0f19] flex flex-col pt-[72px]">
      
      {/* Hero Section */}
      <section className="relative w-full h-[600px] md:h-[700px] flex flex-col items-center justify-center pt-10 pb-32 px-6">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop" 
            alt="Scenic mountain lake travel background"
            className="w-full h-full object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-slate-50 dark:to-[#0b0f19]"></div>
        </div>

        <div className="relative z-10 text-center max-w-4xl mx-auto flex flex-col items-center w-full">
          <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 text-white px-4 py-1.5 rounded-full text-sm font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
            Your journey, our protection
          </div>
          
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white tracking-tight mb-6 leading-tight drop-shadow-lg">
            Travel smart.<br />Travel <span className="text-blue-400">safe.</span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-100 font-medium max-w-2xl drop-shadow-md mb-12">
            Plan your trips, find safe stays, and enjoy protected payments with our smart escrow system.
          </p>

          <div className="w-full max-w-5xl absolute -bottom-32 md:-bottom-24 left-1/2 -translate-x-1/2 px-4">
            <HeroSearchBar />
          </div>
        </div>
      </section>

      {/* Main Content below hero */}
      <div className="relative z-20 bg-slate-50 dark:bg-[#0b0f19] flex-1 flex flex-col pt-36 md:pt-28">
        <Highlights />
        <CardGrid />
        <EscrowBanner />
      </div>

    </div>
  );
}

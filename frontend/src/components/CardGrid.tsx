import Link from "next/link";
import { FaArrowRight } from "react-icons/fa";
import { SectionHeader } from "@/components/ui/SectionHeader";

type CardItem = {
  title: string;
  text: string;
  img: string;
  link: string;
};

const cardData: CardItem[] = [
  {
    title: "Goa",
    text: "Beaches • Nightlife",
    img: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=800&auto=format&fit=crop",
    link: "/destinations/goa",
  },
  {
    title: "Darjeeling",
    text: "Mountains • Views",
    img: "https://images.unsplash.com/photo-1544550581-5f7ceaf7f992?q=80&w=800&auto=format&fit=crop",
    link: "/destinations/darjeeling",
  },
  {
    title: "Manali",
    text: "Snow • Adventure",
    img: "https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=800&auto=format&fit=crop",
    link: "/destinations/manali",
  },
  {
    title: "Udaipur",
    text: "Heritage • Lakes",
    img: "https://images.unsplash.com/photo-1615966650071-855b15fba20f?q=80&w=800&auto=format&fit=crop",
    link: "/destinations/udaipur",
  },
];

export default function CardGrid() {
  return (
    <section className="mx-auto w-full max-w-6xl px-6 py-12">
      <SectionHeader
        eyebrow="Popular destinations"
        title="Places that work well with the new planning flow"
        description="Start with inspiration, then hand off directly into package planning, safer booking, and route previews."
        actions={
          <Link
            href="/destinations"
            className="hidden items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 md:inline-flex"
          >
            View all <FaArrowRight className="text-xs" />
          </Link>
        }
      />

      <div className="mt-8 flex space-x-6 overflow-x-auto px-1 pb-6 hide-scrollbar md:grid md:grid-cols-4 md:space-x-0 md:gap-6 md:px-0">
        {cardData.map((card) => (
          <Link
            href={card.link}
            key={card.title}
            className="group relative block aspect-[4/4.8] min-w-[280px] overflow-hidden rounded-[1.75rem] shadow-[0_24px_70px_-40px_rgba(15,23,42,0.5)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_28px_90px_-44px_rgba(15,23,42,0.55)] md:min-w-0"
          >
            <div className="absolute inset-0 z-10 bg-gradient-to-t from-slate-950/88 via-slate-950/18 to-transparent" />
            <img
              src={card.img}
              alt={card.title}
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute bottom-0 left-0 z-20 w-full p-5">
              <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-slate-200">Curated pick</p>
              <h5 className="mt-2 text-2xl font-black text-white drop-shadow-md">{card.title}</h5>
              <p className="mt-1 text-sm font-medium text-slate-200 drop-shadow-md">{card.text}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="mt-2 flex justify-center md:hidden">
        <Link
          href="/destinations"
          className="flex items-center gap-2 rounded-full border border-slate-300 px-6 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          View all <FaArrowRight className="text-xs" />
        </Link>
      </div>
    </section>
  );
}

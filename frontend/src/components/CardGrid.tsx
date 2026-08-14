import Link from 'next/link';
import { FaArrowRight } from 'react-icons/fa';

type CardItem = {
  title: string;
  text: string;
  img: string;
  link: string;
};

const cardData: CardItem[] = [
  {
    title: 'Goa',
    text: 'Beaches • Nightlife',
    img: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?q=80&w=800&auto=format&fit=crop',
    link: '/destinations/goa',
  },
  {
    title: 'Darjeeling',
    text: 'Mountains • Views',
    img: 'https://images.unsplash.com/photo-1544550581-5f7ceaf7f992?q=80&w=800&auto=format&fit=crop',
    link: '/destinations/darjeeling',
  },
  {
    title: 'Manali',
    text: 'Snow • Adventure',
    img: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?q=80&w=800&auto=format&fit=crop',
    link: '/destinations/manali',
  },
  {
    title: 'Udaipur',
    text: 'Heritage • Lakes',
    img: 'https://images.unsplash.com/photo-1615966650071-855b15fba20f?q=80&w=800&auto=format&fit=crop',
    link: '/destinations/udaipur',
  },
];

export default function CardGrid() {
  return (
    <section className="w-full max-w-6xl mx-auto py-12 px-6">
      
      <div className="flex justify-between items-end mb-8">
        <div>
          <h4 className="text-blue-600 font-semibold mb-2 text-sm tracking-wide">Popular Destinations</h4>
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 dark:text-slate-100">Where do you want to go next?</h2>
        </div>
        
        <Link 
          href="/destinations" 
          className="hidden md:flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
        >
          View all <FaArrowRight className="text-xs" />
        </Link>
      </div>

      <div className="flex overflow-x-auto space-x-6 pb-6 hide-scrollbar -mx-6 px-6 md:mx-0 md:px-0">
        {cardData.map((card, index) => (
          <Link
            href={card.link}
            key={index}
            className="group min-w-[280px] md:min-w-[0] md:flex-1 relative rounded-2xl overflow-hidden aspect-[4/3] shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>
            <img
              src={card.img}
              alt={card.title}
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
            />
            <div className="absolute bottom-0 left-0 p-5 z-20 w-full">
              <h5 className="text-2xl font-bold text-white mb-1 drop-shadow-md">{card.title}</h5>
              <p className="text-slate-200 text-sm font-medium drop-shadow-md">{card.text}</p>
            </div>
          </Link>
        ))}
      </div>
      
      <div className="mt-4 flex justify-center md:hidden">
        <Link 
          href="/destinations" 
          className="flex items-center gap-2 px-6 py-3 border border-slate-300 dark:border-slate-700 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm font-medium"
        >
          View all <FaArrowRight className="text-xs" />
        </Link>
      </div>
       
    </section>
  );
}

import Link from 'next/link';
import Image from 'next/image';

type CardItem = {
  title: string;
  text: string;
  img: string;
  link: string;
};

const cardData: CardItem[] = [
  {
    title: 'Thailand',
    text: 'Starting at ₹42,000 per person',
    img: 'https://thailandinsider.com/wp-content/uploads/2019/03/shutterstock_1536886961-1024x575.jpg',
    link: '/destinations/thailand',
  },
  {
    title: 'Maldives',
    text: 'Starting at ₹65,000 per person',
    img: 'https://cdn.images.express.co.uk/img/dynamic/202/1200x630/5292411.jpg',
    link: '/destinations/maldives',
  },
  {
    title: 'Japan',
    text: 'Starting at ₹1,20,000 per person',
    img: 'https://trawellogy.com/wp-content/uploads/2022/07/japan.jpg',
    link: '/destinations/japan',
  },
  {
    title: 'Bali',
    text: 'Starting at ₹48,000 per person',
    img: 'https://recommend.com/wp-content/uploads/2023/04/CultureHolidays.png',
    link: '/destinations/bali',
  },
  {
    title: 'Dubai',
    text: 'Starting at ₹55,000 per person',
    img: 'https://www.iabtravel.com/wp-content/uploads/2017/07/DUBAI-COUNTRY-IMAGE-2.jpg',
    link: '/destinations/dubai',
  },
  {
    title: 'Vietnam',
    text: 'Starting at ₹39,000 per person',
    img: 'https://tse2.mm.bing.net/th/id/OIP.AzmLTSbGR94atM_fJnUtDAHaFj?r=0&w=960&h=720&rs=1&pid=ImgDetMain&o=7&rm=3',
    link: '/destinations/vietnam',
  },
  {
    title: 'Europe',
    text: 'Starting at ₹1,90,000 per person',
    img: 'https://i.pinimg.com/736x/1f/cb/a0/1fcba0a2be42e3d5bfaac33dd11271ff.jpg',
    link: '/destinations/europe',
  },
];

export default function CardScrollRow() {
  return (
    
    <section className="flex justify-center px-7 py-12">
      
      <div className="w-[100%] max-w-[1400px] mx-auto bg-white dark:bg-slate-800/90 rounded-2xl shadow-xl dark:shadow-2xl p-8 border border-slate-100 dark:border-slate-700/50 backdrop-blur-sm transition-colors duration-300">


        <h2 className="text-4xl font-bold mb-6 text-slate-500 dark:text-slate-300">International Destinations!</h2>
        <div className="flex overflow-x-auto space-x-4 px-2 pb-4 hide-scrollbar">
          {cardData.map((card, index) => (
            <div
              key={index}
              className="min-w-[288px] bg-white dark:bg-slate-900 rounded-xl shadow-md dark:shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800/80 hover:shadow-lg dark:hover:shadow-blue-900/10 hover:-translate-y-1 transition-all duration-300"
            >
              <img
                src={card.img}
                alt={card.title}
                className="w-full h-40 object-cover hover:scale-105 transition-transform duration-500"
              />
              <div className="p-4">
                <h5 className="text-lg font-semibold mb-1 text-slate-800 dark:text-slate-100">{card.title}</h5>
                <p className="text-slate-600 dark:text-slate-400 mb-3 text-sm">{card.text}</p>
                <Link
                  href={card.link}
                  className="inline-block bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-medium transition-all duration-300 text-sm hover:scale-[1.03] active:scale-[0.98]"
                >
                  Explore
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
       
    </section>
   
  );
}

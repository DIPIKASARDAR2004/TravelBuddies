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

export default function CardScrollRow(): JSX.Element {
  return (
    
    <section className="flex justify-center px-7 py-12">
      
      <div className="w-[100%] max-w-[1400px] mx-auto bg-white rounded-2xl shadow-xl p-8">


        <h2 className="text-4xl font-bold mb-6 text-gray-400">International Destinations!</h2>
        <div className="flex overflow-x-auto space-x-4 px-2 pb-2">
          {cardData.map((card, index) => (
            <div
              key={index}
              className="min-w-[288px] bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              <img
                src={card.img}
                alt={card.title}
                className="w-full h-40 object-cover"
              />
              <div className="p-4">
                <h5 className="text-lg font-semibold mb-1">{card.title}</h5>
                <p className="text-gray-600 mb-3 text-sm">{card.text}</p>
                <Link
                  href={card.link}
                  className="inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors text-sm"
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

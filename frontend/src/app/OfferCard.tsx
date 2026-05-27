import Image from 'next/image';

interface OfferCardProps {
  category: string;
  title: string;
  description: string;
  imageSrc: string;
  ctaText: string;
  promoCode?: string;
}

export default function OfferCard({
  category,
  title,
  description,
  imageSrc,
  ctaText,
  promoCode,
}: OfferCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 w-[320px] flex flex-col justify-between">
      <div className="text-[11px] text-gray-500 font-medium mb-1">{category}</div>
      <div className="flex gap-3">
        <div className="flex-1">
          <h3 className="text-sm font-semibold mb-1">{title}</h3>
          <p className="text-xs text-gray-600 mb-2">{description}</p>
          {promoCode && (
            <div className="text-[11px] text-blue-600 font-medium mb-2">
              Code: {promoCode}
            </div>
          )}
        </div>
        <div className="relative w-20 h-20 shrink-0">
          <Image
            src={imageSrc}
            alt={title}
            fill
            className="object-cover rounded-md"
          />
        </div>
      </div>
      <div className="mt-3 text-right">
        <button className="text-sm text-blue-600 font-semibold hover:underline">
          {ctaText}
        </button>
      </div>
    </div>
  );
}

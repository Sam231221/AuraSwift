import React, { useState } from "react";
import { ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";

type CarouselCardProps = {
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  title: string;
};

const CarouselCard = ({ icon: Icon, title }: CarouselCardProps) => (
  <div className="flex-shrink-0 w-36 h-36 sm:w-44 sm:h-44 md:w-52 md:h-52 bg-gray-100 rounded-lg flex flex-col items-center justify-center gap-3 sm:gap-4 md:gap-6">
    <Icon className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 stroke-1" />
    <span className="text-xl sm:text-2xl md:text-3xl font-normal">{title}</span>
  </div>
);

export default function Carousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);

  const items = [
    { icon: MessageCircle, title: "Refund" },
    { icon: MessageCircle, title: "Void" },
    { icon: MessageCircle, title: "Count" },
    { icon: MessageCircle, title: "Dashboard" },
    { icon: MessageCircle, title: "Reports" },
    { icon: MessageCircle, title: "Settings" },
  ];

  const itemsPerView = 3;
  const maxIndex = Math.max(0, items.length - itemsPerView);

  const minSwipeDistance = 50;

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  const onTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setTouchEnd(0);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove: React.TouchEventHandler<HTMLDivElement> = (
    e: React.TouchEvent<HTMLDivElement>
  ) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;

    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < maxIndex) {
      handleNext();
    }
    if (isRightSwipe && currentIndex > 0) {
      handlePrev();
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="flex items-center gap-0">
        {/* Left Arrow */}
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="w-20 h-52 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed flex items-center justify-center rounded-l-lg transition-colors"
          style={{
            clipPath: "polygon(30% 0, 100% 0, 100% 100%, 30% 100%, 0 50%)",
          }}
        >
          <ChevronLeft className="w-8 h-8 text-gray-700" />
        </button>

        {/* Carousel Container */}
        <div
          className="overflow-hidden"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <div
            className="flex gap-12 transition-transform duration-300 ease-in-out px-6"
            style={{ transform: `translateX(-${currentIndex * (208 + 48)}px)` }}
          >
            {items.map((item, index) => (
              <CarouselCard key={index} icon={item.icon} title={item.title} />
            ))}
          </div>
        </div>

        {/* Right Arrow */}
        <button
          onClick={handleNext}
          disabled={currentIndex === maxIndex}
          className="w-20 h-52 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed flex items-center justify-center rounded-r-lg transition-colors"
          style={{
            clipPath: "polygon(0 0, 70% 0, 100% 50%, 70% 100%, 0 100%)",
          }}
        >
          <ChevronRight className="w-8 h-8 text-gray-700" />
        </button>
      </div>
    </div>
  );
}

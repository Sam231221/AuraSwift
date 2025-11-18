import {
  Calculator,
  ChevronRight,
  LayoutDashboard,
  RotateCcw,
  XCircle,
} from "lucide-react";
import React from "react";
import { useState } from "react";
// Quick Actions Carousel Component
interface QuickActionsCarouselProps {
  onRefund: () => void;
  onVoid: () => void;
  onCount: () => void;
  onDashboard: () => void;
  hasActiveShift?: boolean; // Enable buttons only when cashier has active shift
}

export const QuickActionsCarousel: React.FC<QuickActionsCarouselProps> = ({
  onRefund,
  onVoid,
  onCount,
  onDashboard,
  hasActiveShift = false,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dragStart, setDragStart] = useState(0);
  const [dragEnd, setDragEnd] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const items = [
    {
      icon: RotateCcw,
      title: "Refund",
      onClick: onRefund,
      hoverColor: "hover:bg-blue-50",
      disabled: !hasActiveShift,
      requiresShift: true,
    },
    {
      icon: XCircle,
      title: "Void",
      onClick: onVoid,
      hoverColor: "hover:bg-red-50",
      disabled: !hasActiveShift,
      requiresShift: true,
    },
    {
      icon: Calculator,
      title: "Count",
      onClick: onCount,
      hoverColor: "hover:bg-green-50",
      disabled: !hasActiveShift,
      requiresShift: true,
    },
    {
      icon: LayoutDashboard,
      title: "Dashboard",
      onClick: onDashboard,
      hoverColor: "hover:bg-purple-50",
      disabled: false, // Dashboard is always enabled
      requiresShift: false,
    },
  ];

  const itemsPerView = 4;
  const maxIndex = Math.max(0, items.length - itemsPerView);
  const minSwipeDistance = 50;

  const handlePrev = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(maxIndex, prev + 1));
  };

  // Touch events
  const onTouchStart = (e: React.TouchEvent) => {
    setDragEnd(0);
    setDragStart(e.targetTouches[0].clientX);
    setIsDragging(true);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setDragEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    handleDragEnd();
  };

  // Mouse events for trackpad/mouse support
  const onMouseDown = (e: React.MouseEvent) => {
    setDragEnd(0);
    setDragStart(e.clientX);
    setIsDragging(true);
    e.preventDefault(); // Prevent text selection
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setDragEnd(e.clientX);
  };

  const onMouseUp = () => {
    if (!isDragging) return;
    handleDragEnd();
  };

  const onMouseLeave = () => {
    if (!isDragging) return;
    handleDragEnd();
  };

  const handleDragEnd = () => {
    if (!dragStart || !dragEnd) {
      setIsDragging(false);
      return;
    }

    const distance = dragStart - dragEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe && currentIndex < maxIndex) {
      handleNext();
    }
    if (isRightSwipe && currentIndex > 0) {
      handlePrev();
    }

    setIsDragging(false);
    setDragStart(0);
    setDragEnd(0);
  };

  // Calculate exact transform based on container width
  const getTransform = () => {
    if (!containerRef.current) return "translateX(0)";

    const container = containerRef.current;
    const containerWidth = container.offsetWidth;

    // Each card takes up 1/3 of the container width (for 3 items view)
    // Plus we need to account for gaps between items
    const cardWidth = containerWidth / itemsPerView;
    const offset = currentIndex * cardWidth;

    return `translateX(-${offset}px)`;
  };

  return (
    <div className="mb-4 p-2 bg-white rounded-lg shadow-sm">
      <div className="flex items-center w-full gap-2">
        {/* Left Arrow */}
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0}
          className="shrink-0 w-8 h-16 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          style={{
            clipPath: "polygon(30% 0, 100% 0, 100% 100%, 30% 100%, 0 50%)",
          }}
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-gray-700 rotate-180" />
        </button>

        {/* Carousel Container */}
        <div
          ref={containerRef}
          className="overflow-hidden flex-1 cursor-grab active:cursor-grabbing select-none"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseLeave}
        >
          <div
            className="flex gap-2 transition-transform duration-300 ease-in-out"
            style={{
              transform: getTransform(),
              width: `${(items.length / itemsPerView) * 100}%`,
            }}
          >
            {items.map((item, index) => (
              <div
                key={index}
                className="shrink-0"
                style={{
                  width: `calc(${100 / items.length}% - ${
                    ((items.length - 1) * 0.5) / items.length
                  }rem)`,
                }}
              >
                <CarouselCard
                  icon={item.icon}
                  title={item.title}
                  onClick={item.onClick}
                  hoverColor={item.hoverColor}
                  disabled={item.disabled}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Right Arrow */}
        <button
          onClick={handleNext}
          disabled={currentIndex === maxIndex}
          className="shrink-0 w-8 h-16 bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
          style={{
            clipPath: "polygon(0 0, 70% 0, 100% 50%, 70% 100%, 0 100%)",
          }}
        >
          <ChevronRight className="w-5 h-5 md:w-6 md:h-6 text-gray-700" />
        </button>
      </div>
    </div>
  );
  // ...existing code...
};

const CarouselCard: React.FC<{
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  onClick: () => void;
  hoverColor: string;
  disabled?: boolean;
}> = ({ icon: Icon, title, onClick, hoverColor, disabled = false }) => (
  <button
    onClick={disabled ? undefined : onClick}
    disabled={disabled}
    className={`shrink-0 basis-1/3 w-16 h-16 p-2 rounded-lg flex flex-col items-center justify-center gap-1 transition-all ${
      disabled
        ? "bg-gray-100 opacity-50 cursor-not-allowed"
        : `bg-gray-100 hover:shadow-md ${hoverColor}`
    }`}
    style={{ minWidth: "0" }}
    title={
      disabled ? "Please start your shift to use this feature" : undefined
    }
  >
    <Icon className={`w-6 h-6 ${disabled ? "text-gray-400" : ""}`} />
    <span className={`text-sm ${disabled ? "text-gray-400" : ""}`}>
      {title}
    </span>
  </button>
);

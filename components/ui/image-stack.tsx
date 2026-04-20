"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { motion, PanInfo } from "framer-motion";

interface Card {
  id: number;
  src: string;
  zIndex: number;
}

interface ImgStackProps {
  images: string[];
}

export default function ImgStack({ images }: ImgStackProps) {
  const [cards, setCards] = useState<Card[]>(
    images.map((src, index) => ({
      id: index,
      src,
      zIndex: 50 - index * 10,
    })),
  );
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const dragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const minDragDistance: number = 50;

  const getCardStyles = (index: number) => {
    const baseRotation = 2;
    const rotationIncrement = 3;
    const offsetIncrement = -12;
    const verticalOffset = -8;

    return {
      x: index * offsetIncrement,
      y: index * verticalOffset,
      rotate: index === 0 ? 0 : -(baseRotation + index * rotationIncrement),
      scale: 1,
      transition: { duration: 0.5 },
    };
  };

  const handleDragStart = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    dragStartPos.current = { x: info.point.x, y: info.point.y };
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const dragDistance = Math.sqrt(
      Math.pow(info.point.x - dragStartPos.current.x, 2) +
        Math.pow(info.point.y - dragStartPos.current.y, 2),
    );

    if (isAnimating || dragDistance < minDragDistance) return;

    setIsAnimating(true);
    setCards((prevCards) => {
      const newCards = [...prevCards];
      const cardToMove = newCards.shift();
      if (cardToMove) newCards.push(cardToMove);

      return newCards.map((card, index) => ({
        ...card,
        zIndex: 50 - index * 10,
      }));
    });

    setTimeout(() => {
      setIsAnimating(false);
    }, 300);
  };

  return (
    <div className="relative my-12 flex h-96 w-96 items-center justify-center">
      {cards.map((card: Card, index: number) => {
        const isTopCard = index === 0;
        const cardStyles = getCardStyles(index);
        const canDrag = isTopCard && !isAnimating;

        return (
          <motion.div
            key={card.id}
            className="absolute w-64 origin-bottom-center cursor-grab overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl active:cursor-grabbing"
            style={{
              zIndex: card.zIndex,
              aspectRatio: "5/7",
            }}
            animate={cardStyles}
            drag={canDrag}
            dragElastic={0.2}
            dragConstraints={{ left: -150, right: 150, top: -150, bottom: 150 }}
            dragSnapToOrigin
            dragTransition={{ bounceStiffness: 600, bounceDamping: 10 }}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            whileHover={
              isTopCard
                ? {
                    scale: 1.05,
                    transition: { duration: 0.2 },
                  }
                : {}
            }
            whileDrag={{
              scale: 1.1,
              rotate: 0,
              zIndex: 100,
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
              transition: { duration: 0.1 },
            }}
          >
            <Image
              src={card.src}
              alt={`Card ${card.id + 1}`}
              fill
              className="pointer-events-none rounded-lg object-cover"
              sizes="(max-width: 768px) 100vw, 200px"
              draggable={false}
            />
          </motion.div>
        );
      })}
    </div>
  );
}

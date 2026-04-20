"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface ThreeDMarqueeProps {
  images?: string[];
  className?: string;
}

const robloxImages = [
  "https://tr.rbxcdn.com/180DAY-a77a525c91dbb43a7a5acb27785e840e/512/512/Image/Png/noFilter",
  "https://tr.rbxcdn.com/180DAY-bbf2cc210f0e691178157e5bc80d3eae/512/512/Image/Png/noFilter",
  "https://tr.rbxcdn.com/180DAY-15da122387e19fd90c9704ea1dd14023/512/512/Image/Png/noFilter",
];

const defaultImages = Array.from({ length: 18 }, (_, index) => robloxImages[index % robloxImages.length]);

const ThreeDMarquee = ({ images = defaultImages, className }: ThreeDMarqueeProps) => {
  const chunkSize = Math.ceil(images.length / 3);
  const chunks = Array.from({ length: 3 }, (_, colIndex) => {
    const start = colIndex * chunkSize;
    return images.slice(start, start + chunkSize);
  });

  return (
    <div className={cn("mx-auto block h-[34rem] w-full overflow-hidden rounded-[8px] max-xl:h-[30rem] max-sm:h-[24rem]", className)}>
      <div className="flex size-full items-center justify-center">
        <div className="aspect-square size-[44rem] shrink-0 scale-[1.22] max-xl:size-full max-xl:scale-110 max-sm:scale-[1.25]">
          <div
            style={{ transform: "rotateX(45deg) rotateY(0deg) rotateZ(45deg)", transformStyle: "preserve-3d" }}
            className="relative top-0 right-[-48%] grid size-full origin-top-left grid-cols-3 gap-5 max-xl:-top-24 max-xl:right-[-42%] max-sm:top-0 max-sm:gap-2"
          >
            {chunks.map((subarray, colIndex) => (
              <motion.figure
                animate={{ y: colIndex % 2 === 0 ? 60 : -60 }}
                transition={{
                  duration: colIndex % 2 === 0 ? 10 : 15,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
                key={`${colIndex}-marquee`}
                className="flex flex-col items-start gap-6 max-sm:gap-3"
              >
                {subarray.map((src, imageIndex) => (
                  <div className="relative" key={`${imageIndex}-${src}`}>
                    <img
                      className="aspect-[4/3] h-full w-full select-none rounded-lg border border-white/10 bg-neutral-900 object-cover shadow-[0_18px_60px_rgba(0,0,0,0.36)]"
                      src={src}
                      draggable={false}
                      loading="lazy"
                      decoding="async"
                      alt={`Roblox project image ${imageIndex + 1}`}
                    />
                  </div>
                ))}
              </motion.figure>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ThreeDMarquee;

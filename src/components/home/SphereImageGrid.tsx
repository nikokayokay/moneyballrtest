import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ImgSphere, { type ImageData } from "@/components/ui/img-sphere";
import type { SpherePlayer } from "@/src/services/impactPlayers";

type SphereImageGridProps = {
  players: SpherePlayer[];
  isLoading?: boolean;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function useElementSize() {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState(420);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const update = () => {
      const bounds = node.getBoundingClientRect();
      setSize(clamp(Math.floor(Math.min(bounds.width, window.innerHeight * 0.68)), 300, 620));
    };

    update();
    const observer = new ResizeObserver(update);
    observer.observe(node);
    window.addEventListener("resize", update);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, []);

  return { ref, size };
}

function toImageData(player: SpherePlayer): ImageData {
  return {
    id: String(player.id),
    src: player.src,
    alt: player.alt,
    title: player.title,
    description: `#${player.rank} | ${player.description} | Trend: ${player.trend}`,
  };
}

export function SphereImageGrid({ players, isLoading = false }: SphereImageGridProps) {
  const navigate = useNavigate();
  const { ref, size } = useElementSize();
  const images = useMemo(() => players.map(toImageData), [players]);
  const radius = Math.round(size * 0.34);

  return (
    <div ref={ref} className="relative flex min-h-[20rem] w-full items-center justify-center overflow-hidden bg-[#080d16] p-2 sm:min-h-[28rem]">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(8,13,22,0.12)_0%,rgba(8,13,22,0.28)_42%,rgba(0,0,0,0.72)_84%)]" />
      <div className="pointer-events-none absolute left-1/2 top-1/2 h-[76%] w-[76%] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/8 bg-[radial-gradient(circle_at_42%_38%,rgba(20,184,166,0.12),transparent_38%)]" />

      {isLoading ? (
        <div className="relative aspect-square w-full max-w-[38rem] animate-pulse rounded-full border border-white/8 bg-white/[0.03]" />
      ) : (
        <div className="relative z-10">
          <ImgSphere
            images={images}
            containerSize={size}
            sphereRadius={radius}
            dragSensitivity={0.7}
            momentumDecay={0.965}
            maxRotationSpeed={5}
            baseImageScale={0.13}
            hoverScale={1.28}
            perspective={1100}
            autoRotate
            autoRotateSpeed={0.12}
            className="max-w-full"
            onImageClick={(image) => navigate(`/player/${image.id}`)}
          />
        </div>
      )}
    </div>
  );
}

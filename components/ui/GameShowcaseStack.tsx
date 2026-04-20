"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion, PanInfo } from "framer-motion";
import { ArrowUpRight, Gamepad2, Heart, Users } from "lucide-react";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { Text_03 } from "@/components/ui/wave-text";
import { cn } from "@/lib/utils";

type LiveGame = {
  universeId: number;
  placeId: string;
  robloxUrl: string;
  name: string;
  description: string;
  playing: number;
  visits: number;
  favorites: number;
  maxPlayers: number;
  updated: string;
  creatorName: string;
  thumbnailUrl: string | null;
};

type RobloxGamesResponse = {
  games: LiveGame[];
  fetchedAt: string;
};

type StackCard = LiveGame & {
  zIndex: number;
};

const refreshInterval = 60_000;
const minDragDistance = 50;
const gameOrder = ["8540168650", "119144727737197", "9447079542"];

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: value >= 100_000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1_000_000 ? 1 : 0,
  }).format(value);
}

function useCountUp(value: number, keyValue: string) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const duration = 750;
    const startedAt = performance.now();
    let frame = requestAnimationFrame(function update(now) {
      const progress = Math.min((now - startedAt) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(Math.round(value * eased));

      if (progress < 1) {
        frame = requestAnimationFrame(update);
      }
    });

    return () => cancelAnimationFrame(frame);
  }, [keyValue, value]);

  return displayValue;
}

function GameMetric({
  label,
  value,
  icon: Icon,
  live,
}: {
  label: string;
  value: string;
  icon: typeof Users;
  live?: boolean;
}) {
  return (
    <div className="rounded-[8px] border border-white/10 bg-black/35 p-3 backdrop-blur-xl">
      <div className="flex items-center justify-between gap-2 text-white/42">
        <span className="text-[0.68rem] font-semibold uppercase">{label}</span>
        <Icon className={cn("h-3.5 w-3.5", live && "text-emerald-200")} />
      </div>
      <div className="mt-2 flex items-center gap-2">
        {live ? <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.95)] animate-pulse" /> : null}
        <Text_03 text={value} className={cn("w-auto text-left font-black text-white", live ? "text-xl text-emerald-50" : "text-lg")} />
      </div>
    </div>
  );
}

function GameCard({ game, active }: { game: LiveGame; active: boolean }) {
  const activeKey = active ? game.placeId : `${game.placeId}-inactive`;
  const playing = useCountUp(active ? game.playing : 0, activeKey);
  const visits = useCountUp(active ? game.visits : 0, activeKey);
  const favorites = useCountUp(active ? game.favorites : 0, activeKey);

  return (
    <div className="relative h-full overflow-hidden rounded-[8px] border border-white/12 bg-[#091018]/88 p-4 shadow-[0_32px_120px_rgba(0,0,0,0.46)] backdrop-blur-2xl">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_12%,rgba(125,211,252,0.14),transparent_28%),radial-gradient(circle_at_82%_70%,rgba(110,231,183,0.08),transparent_28%)]" />
      <div className="relative">
        <div className="relative overflow-hidden rounded-xl border border-white/12 bg-black/30">
          <div className="absolute inset-10 rounded-full bg-sky-300/16 blur-3xl" />
          {game.thumbnailUrl ? (
            <img
              src={game.thumbnailUrl}
              alt={`${game.name} Roblox game thumbnail`}
              loading="lazy"
              decoding="async"
              draggable={false}
              className="relative aspect-[16/9] w-full select-none object-cover"
            />
          ) : (
            <div className="relative flex aspect-[16/9] w-full items-center justify-center text-white/45">
              <Gamepad2 className="h-14 w-14" />
            </div>
          )}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-[8px] border border-emerald-200/20 bg-emerald-300/10 px-3 py-2 text-xs font-black uppercase text-emerald-100">
            <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.95)] animate-pulse" />
            Live
          </span>
        </div>

        <h3 className="mt-4 text-2xl font-black leading-tight text-white">{game.name}</h3>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <GameMetric label="Playing" value={formatNumber(playing)} icon={Users} live />
          <GameMetric label="Visits" value={formatNumber(visits)} icon={Gamepad2} />
          <GameMetric label="Favorites" value={formatNumber(favorites)} icon={Heart} />
        </div>

        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <LiquidButton href={game.robloxUrl} target="_blank" className="bg-white/18 shadow-[0_18px_70px_rgba(125,211,252,0.20),inset_0_1px_0_rgba(255,255,255,0.35)]">
            Play Now <ArrowUpRight className="h-4 w-4" />
          </LiquidButton>
          <p className="text-xs text-white/42">Live Roblox API data</p>
        </div>
      </div>
    </div>
  );
}

function LoadingStack() {
  return (
    <div className="relative mx-auto h-[34rem] w-full max-w-[32rem]">
      <div className="absolute inset-0 rounded-[8px] border border-white/10 bg-white/[0.05] p-4 backdrop-blur-xl">
        <div className="h-56 animate-pulse rounded-xl bg-white/10" />
        <div className="mt-5 h-9 w-3/4 animate-pulse rounded-[8px] bg-white/10" />
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="h-20 animate-pulse rounded-[8px] bg-white/10" />
          <div className="h-20 animate-pulse rounded-[8px] bg-white/10" />
          <div className="h-20 animate-pulse rounded-[8px] bg-white/10" />
        </div>
      </div>
    </div>
  );
}

export function GameShowcaseStack() {
  const [cards, setCards] = useState<StackCard[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });

  const activeCard = cards[0];
  const activeIndex = useMemo(() => {
    if (!activeCard) return 0;
    const originalIndex = gameOrder.indexOf(activeCard.placeId);
    return originalIndex === -1 ? 0 : originalIndex;
  }, [activeCard]);

  useEffect(() => {
    let isMounted = true;

    async function loadGames() {
      try {
        const response = await fetch("/api/roblox-games");
        if (!response.ok) throw new Error("Roblox game data could not be loaded.");

        const payload = (await response.json()) as RobloxGamesResponse;
        if (!isMounted) return;

        setCards((currentCards) => {
          const orderedPlaceIds = currentCards.map((card) => card.placeId);
          const nextCards = payload.games.map((game, index) => ({ ...game, zIndex: 50 - index * 10 }));

          if (orderedPlaceIds.length === 0) return nextCards;

          return orderedPlaceIds
            .map((placeId) => nextCards.find((game) => game.placeId === placeId))
            .filter((game): game is StackCard => Boolean(game))
            .concat(nextCards.filter((game) => !orderedPlaceIds.includes(game.placeId)))
            .map((game, index) => ({ ...game, zIndex: 50 - index * 10 }));
        });
        setError(null);
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Roblox game data could not be loaded.");
        }
      }
    }

    loadGames();
    const interval = window.setInterval(loadGames, refreshInterval);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  function rotateCards() {
    setIsAnimating(true);
    setCards((prevCards) => {
      const newCards = [...prevCards];
      const cardToMove = newCards.shift();
      if (cardToMove) newCards.push(cardToMove);
      return newCards.map((card, index) => ({ ...card, zIndex: 50 - index * 10 }));
    });
    setTimeout(() => setIsAnimating(false), 300);
  }

  function handleDragStart(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    dragStartPos.current = { x: info.point.x, y: info.point.y };
  }

  function handleDragEnd(_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) {
    const dragDistance = Math.sqrt(
      Math.pow(info.point.x - dragStartPos.current.x, 2) +
        Math.pow(info.point.y - dragStartPos.current.y, 2),
    );

    if (isAnimating || dragDistance < minDragDistance) return;
    rotateCards();
  }

  function getCardStyles(index: number) {
    return {
      x: index * 10,
      y: index * -10,
      rotate: index === 0 ? 0 : 2 + index * 1.5,
      scale: 1 - index * 0.055,
      opacity: Math.max(1 - index * 0.28, 0.34),
      filter: index === 0 ? "blur(0px)" : `blur(${Math.min(index * 2.2, 5)}px)`,
      transition: { type: "spring" as const, stiffness: 260, damping: 28 },
    };
  }

  return (
    <section id="live-projects" className="relative overflow-hidden px-5 py-24 sm:px-8 lg:px-12">
      <div className="absolute inset-x-0 top-1/2 h-[28rem] -translate-y-1/2 bg-[radial-gradient(ellipse_at_center,rgba(14,165,233,0.10),transparent_66%)]" />
      <div className="relative mx-auto max-w-7xl">
        <div className="mx-auto mb-12 max-w-3xl text-center">
          <p className="text-sm font-bold uppercase text-sky-200/60">Live Projects</p>
          <h2 className="mt-4 text-3xl font-black leading-tight sm:text-5xl">
            Active Roblox performance
          </h2>
          <p className="mt-4 text-sm text-white/45">Drag the top card to explore games.</p>
          {activeCard ? (
            <p className="mt-3 text-sm font-semibold text-white/42">
              {activeIndex + 1} / {cards.length}
            </p>
          ) : null}
          {error ? <p className="mt-5 rounded-[8px] border border-red-200/20 bg-red-500/10 p-4 text-sm text-red-100">{error}</p> : null}
        </div>

        <div className="relative mx-auto h-[35rem] w-full max-w-[32rem]">
          {!cards.length && !error ? <LoadingStack /> : null}
          {cards.map((card, index) => {
            const isTopCard = index === 0;
            const canDrag = isTopCard && !isAnimating;

            return (
              <motion.div
                key={card.placeId}
                className={cn("absolute inset-0 origin-bottom-center", canDrag && "cursor-grab active:cursor-grabbing")}
                style={{ zIndex: card.zIndex }}
                animate={getCardStyles(index)}
                drag={canDrag}
                dragElastic={0.18}
                dragConstraints={{ left: -160, right: 160, top: -140, bottom: 140 }}
                dragSnapToOrigin
                dragTransition={{ bounceStiffness: 600, bounceDamping: 12 }}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                whileHover={isTopCard ? { scale: 1.025 } : {}}
                whileDrag={{
                  scale: 1.06,
                  rotate: 0,
                  zIndex: 100,
                  filter: "blur(0px)",
                  transition: { duration: 0.1 },
                }}
              >
                <GameCard game={card} active={isTopCard} />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

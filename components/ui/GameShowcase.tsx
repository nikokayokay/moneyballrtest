"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, Gamepad2, RefreshCw, Signal, Users } from "lucide-react";
import { LiquidButton } from "@/components/ui/liquid-glass-button";
import { Text_03 } from "@/components/ui/wave-text";
import { cn } from "@/lib/utils";

type GameShowcaseData = {
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
  fetchedAt: string;
};

type GameShowcaseProps = {
  variant?: "hero" | "section";
};

const refreshInterval = 45_000;

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: value >= 100_000 ? "compact" : "standard",
    maximumFractionDigits: value >= 1_000_000 ? 1 : 0,
  }).format(value);
}

function useCountUp(value?: number) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (typeof value !== "number") {
      setDisplayValue(0);
      return;
    }

    const duration = 850;
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
  }, [value]);

  return displayValue;
}

function LoadingCard({ compact }: { compact: boolean }) {
  return (
    <div className={cn("rounded-[8px] border border-white/10 bg-white/[0.05] p-4 backdrop-blur-xl", !compact && "p-5 lg:p-8")}>
      <div className={cn("animate-pulse rounded-xl bg-white/10", compact ? "h-64" : "aspect-video")} />
      <div className="mt-5 h-8 w-3/4 animate-pulse rounded-[8px] bg-white/10" />
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="h-20 animate-pulse rounded-[8px] bg-white/10" />
        <div className="h-20 animate-pulse rounded-[8px] bg-white/10" />
      </div>
    </div>
  );
}

function StatBlock({ label, value, live }: { label: string; value: string; live?: boolean }) {
  return (
    <div className="rounded-[8px] border border-white/10 bg-black/25 p-4 backdrop-blur-xl">
      <p className="text-xs font-semibold uppercase text-white/44">{label}</p>
      <div className="mt-2 flex items-center gap-2">
        {live ? <span className="h-2.5 w-2.5 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.95)] animate-pulse" /> : null}
        <Text_03 text={value} className={cn("w-auto text-left font-black text-white", live ? "text-3xl text-emerald-50" : "text-2xl")} />
      </div>
    </div>
  );
}

export function GameShowcase({ variant = "section" }: GameShowcaseProps) {
  const [game, setGame] = useState<GameShowcaseData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const compact = variant === "hero";

  const livePlayers = useCountUp(game?.playing);
  const visits = useCountUp(game?.visits);

  const description = useMemo(() => {
    if (!game?.description) {
      return "Live Roblox performance data is loading from Roblox.";
    }

    return game.description.split("\n").filter(Boolean).slice(0, compact ? 1 : 2).join(" ");
  }, [compact, game?.description]);

  useEffect(() => {
    let isMounted = true;

    async function loadGame() {
      try {
        setIsRefreshing(true);
        const response = await fetch("/api/roblox-game");

        if (!response.ok) {
          throw new Error("Roblox game data could not be loaded.");
        }

        const payload = (await response.json()) as GameShowcaseData;

        if (isMounted) {
          setGame(payload);
          setError(null);
        }
      } catch (loadError) {
        if (isMounted) {
          setError(loadError instanceof Error ? loadError.message : "Roblox game data could not be loaded.");
        }
      } finally {
        if (isMounted) {
          setIsRefreshing(false);
        }
      }
    }

    loadGame();
    const interval = window.setInterval(loadGame, refreshInterval);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

  const card = !game && !error ? (
    <LoadingCard compact={compact} />
  ) : (
    <article className="group relative overflow-hidden rounded-[8px] border border-white/10 bg-white/[0.05] p-4 shadow-[0_28px_110px_rgba(0,0,0,0.4)] backdrop-blur-xl transition duration-300 hover:scale-[1.015] hover:border-sky-100/30 hover:shadow-[0_28px_130px_rgba(56,189,248,0.18)] sm:p-5">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_32%_18%,rgba(125,211,252,0.18),transparent_30%),radial-gradient(circle_at_80%_72%,rgba(110,231,183,0.12),transparent_24%)]" />

      {error ? (
        <div className="relative rounded-[8px] border border-red-200/20 bg-red-500/10 p-5 text-red-100">{error}</div>
      ) : null}

      {game ? (
        <div className="relative">
          <div className="relative overflow-hidden rounded-xl border border-white/12 bg-black/30">
            <div className="absolute inset-8 rounded-full bg-sky-300/20 blur-3xl transition duration-300 group-hover:bg-sky-200/30" />
            {game.thumbnailUrl ? (
              <img
                src={game.thumbnailUrl}
                alt={`${game.name} Roblox game thumbnail`}
                loading="lazy"
                decoding="async"
                className={cn("relative w-full object-cover transition duration-500 group-hover:scale-105", compact ? "aspect-[16/11]" : "aspect-video")}
              />
            ) : (
              <div className={cn("relative flex w-full items-center justify-center text-white/45", compact ? "aspect-[16/11]" : "aspect-video")}>
                <Gamepad2 className="h-14 w-14" />
              </div>
            )}
          </div>

          <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
            <span className="inline-flex items-center gap-2 rounded-[8px] border border-emerald-200/20 bg-emerald-300/10 px-3 py-2 text-xs font-black uppercase text-emerald-100">
              <Signal className="h-3.5 w-3.5" />
              Live
            </span>
            <span className="inline-flex items-center gap-2 rounded-[8px] border border-white/10 bg-black/20 px-3 py-2 text-xs font-semibold uppercase text-white/46">
              <RefreshCw className={cn("h-3.5 w-3.5", isRefreshing && "animate-spin")} />
              45s sync
            </span>
          </div>

          <h3 className="mt-4 text-2xl font-black leading-tight text-white sm:text-3xl">{game.name}</h3>
          {!compact ? <p className="mt-3 max-w-2xl text-base leading-8 text-white/56">{description}</p> : null}

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            <StatBlock label="Playing now" value={formatNumber(livePlayers)} live />
            <StatBlock label="Total visits" value={formatNumber(visits)} />
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <LiquidButton href={game.robloxUrl} target="_blank" className="bg-white/18 shadow-[0_18px_70px_rgba(125,211,252,0.20),inset_0_1px_0_rgba(255,255,255,0.35)]">
              Play Now <ArrowUpRight className="h-4 w-4" />
            </LiquidButton>
            <p className="text-xs text-white/42">Live Roblox API data</p>
          </div>
        </div>
      ) : null}
    </article>
  );

  if (compact) {
    return <div className="animate-float-in [animation-delay:260ms] [animation-fill-mode:both]">{card}</div>;
  }

  return (
    <section id="live-projects" className="px-5 py-24 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase text-sky-200/60">Live Projects</p>
            <h2 className="mt-4 max-w-3xl text-4xl font-black sm:text-6xl">
              Real-time performance across active Roblox experiences
            </h2>
          </div>
        </div>
        {card}
      </div>
    </section>
  );
}

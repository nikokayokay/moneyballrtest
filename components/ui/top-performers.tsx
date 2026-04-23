import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import SphereImageGrid, { type ImageData } from "@/components/ui/img-sphere";
import type { HomePerformer } from "@/src/data/home-discovery";
import { countryFlagUrl, nationalTeamLabel } from "@/lib/country-flags";

function teamLogo(teamId: number | null) {
  return teamId ? `https://www.mlbstatic.com/team-logos/${teamId}.svg` : "";
}

function CountryFlag({ country, className = "" }: { country: string; className?: string }) {
  const flag = countryFlagUrl(country);
  if (!flag) return null;
  return <img src={flag} alt={`${country} flag`} className={cn("rounded-[4px] object-cover", className)} loading="lazy" />;
}

export function TopPerformers({
  performers,
  selectedCountry,
  onClearCountry,
  isUpdating = false,
  sourceLabel,
  dateControl,
  signalType = "all",
  onSignalTypeChange,
  teamFilter = "all",
  onTeamFilterChange,
  positionFilter = "all",
  onPositionFilterChange,
}: {
  performers: HomePerformer[];
  selectedCountry: string | null;
  onClearCountry: () => void;
  isUpdating?: boolean;
  sourceLabel?: string;
  dateControl?: ReactNode;
  signalType?: HomePerformer["signalType"] | "all";
  onSignalTypeChange?: (value: HomePerformer["signalType"] | "all") => void;
  teamFilter?: string;
  onTeamFilterChange?: (value: string) => void;
  positionFilter?: string;
  onPositionFilterChange?: (value: string) => void;
}) {
  const sphereImages: ImageData[] = performers.map((player) => ({
    id: String(player.playerId),
    src: player.headshotUrl,
    alt: player.name,
    title: player.name,
    description: `${player.team} | ${player.keyStat} | ${player.statLine}`,
  }));

  const openPlayer = (image: ImageData) => {
    const performer = performers.find((player) => String(player.playerId) === image.id);
    if (performer) window.location.hash = performer.href;
  };
  const featured = performers[0];
  const nextFour = performers.slice(1, 5);
  const rail = performers.slice(5);
  const teams = Array.from(new Set(performers.map((player) => player.team).filter(Boolean))).sort();
  const positions = Array.from(new Set(performers.map((player) => player.position).filter(Boolean) as string[])).sort();

  return (
    <section className="overflow-hidden rounded-[32px] border border-white/10 bg-[#070d16]">
      <div className="border-b border-white/8 p-[20px] sm:p-[32px]">
        <div className="flex flex-wrap items-start justify-between gap-[20px]">
          <div>
            <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-emerald-300">Live discovery sphere</div>
            <h1 className="mt-[8px] font-['Bebas_Neue'] text-[clamp(32px,5vw,84px)] leading-none tracking-[0.055em] text-white">
              Today&apos;s Top Performers
            </h1>
            <p className="mt-[12px] max-w-[840px] text-[12px] leading-[20px] text-slate-400">
              Drag the player sphere, scan the impact board, and jump straight into the profile behind today&apos;s signal.
            </p>
            {sourceLabel ? (
              <div className="mt-[8px] font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] text-cyan-200">
                {sourceLabel}
              </div>
            ) : null}
          </div>
          <div className="flex max-w-full flex-col items-end gap-[12px]">
            <div className="flex flex-wrap justify-end gap-[12px]">
              {isUpdating ? (
                <div className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-[12px] py-[8px] font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] text-emerald-200">
                  Syncing MLB data
                </div>
              ) : null}
              {selectedCountry ? (
                <button
                  type="button"
                  onClick={onClearCountry}
                  className="rounded-full border border-cyan-300/25 bg-cyan-300/10 px-[12px] py-[8px] font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] text-cyan-200"
                >
                  Filter: {selectedCountry} - clear
                </button>
              ) : null}
            </div>
            {dateControl}
          </div>
        </div>
        <div className="mt-[20px] flex flex-wrap items-center gap-[8px]">
          {(["all", "clutch", "streak", "anomaly", "standard"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => onSignalTypeChange?.(value)}
              className={cn(
                "rounded-full border px-[12px] py-[8px] font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.14em] transition",
                signalType === value ? "border-emerald-300/35 bg-emerald-300/10 text-emerald-200" : "border-white/10 bg-white/[0.03] text-slate-400 hover:text-white",
              )}
            >
              {value === "all" ? "All signals" : value}
            </button>
          ))}
          <select
            value={teamFilter}
            onChange={(event) => onTeamFilterChange?.(event.target.value)}
            className="rounded-full border border-white/10 bg-[#08111d] px-[12px] py-[8px] font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.14em] text-slate-300 outline-none"
          >
            <option value="all">All teams</option>
            {teams.map((team) => <option key={team} value={team}>{team}</option>)}
          </select>
          <select
            value={positionFilter}
            onChange={(event) => onPositionFilterChange?.(event.target.value)}
            className="rounded-full border border-white/10 bg-[#08111d] px-[12px] py-[8px] font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.14em] text-slate-300 outline-none"
          >
            <option value="all">All positions</option>
            {positions.map((position) => <option key={position} value={position}>{position}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-px bg-white/8 xl:grid-cols-[.95fr_1.05fr]">
        <div className="relative min-h-[520px] bg-[#03060d] p-[20px]">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(52,211,153,.14),transparent_45%),radial-gradient(circle_at_50%_50%,rgba(103,232,249,.08),transparent_65%)]" />
          <div className="relative z-10 flex h-full items-center justify-center overflow-hidden rounded-[20px] border border-white/6 bg-black/20">
            {sphereImages.length ? (
              <SphereImageGrid
                images={sphereImages}
                containerSize={620}
                sphereRadius={235}
                dragSensitivity={0.55}
                momentumDecay={0.96}
                maxRotationSpeed={5}
                baseImageScale={0.092}
                hoverScale={1.14}
                perspective={1000}
                autoRotate
                autoRotateSpeed={0.08}
                className="max-w-full scale-[0.68] sm:scale-[0.82] lg:scale-95 2xl:scale-100"
                onImageClick={openPlayer}
              />
            ) : (
              <div className="rounded-[20px] border border-white/8 bg-white/[0.025] p-[20px] text-center">
                <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] text-cyan-200">
                  {isUpdating ? "Updating data..." : "No official performer signal"}
                </div>
                <p className="mt-[8px] max-w-[320px] text-[12px] leading-[20px] text-slate-500">
                  Moneyballr waits for official MLB box scores before ranking today&apos;s impact players.
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-[#080d16] p-[20px] sm:p-[32px]">
          {featured ? (
            <Link to={featured.href} className="group block rounded-[20px] border border-emerald-300/18 bg-emerald-300/[0.045] p-[20px] transition hover:border-emerald-300/35">
              <div className="flex items-start gap-[20px]">
                <div className="h-[84px] w-[84px] overflow-hidden rounded-[20px] bg-slate-900">
                  <img src={featured.headshotUrl} alt={featured.name} className="player-headshot h-full w-full" loading="eager" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] text-emerald-300">Top impact</div>
                  <div className="mt-[8px] font-['Barlow_Condensed'] text-[32px] font-semibold uppercase leading-none tracking-[0.08em] text-white">{featured.name}</div>
                  <div className="mt-[8px] flex flex-wrap items-center gap-[8px] text-[12px] text-slate-400">
                    <span>{featured.statLine}</span>
                    <span>-</span>
                    <CountryFlag country={featured.country} className="h-[12px] w-[20px]" />
                    <span>{featured.country}</span>
                    {nationalTeamLabel(featured.country) ? <span className="text-cyan-200">{nationalTeamLabel(featured.country)}</span> : null}
                  </div>
                  {featured.insight ? (
                    <p className="mt-[8px] max-w-[620px] text-[12px] leading-[20px] text-slate-400">{featured.insight.whyItMatters}</p>
                  ) : null}
                </div>
                <div className="text-right">
                  <div className="font-['Bebas_Neue'] text-[52px] leading-none tracking-[0.06em] text-emerald-300">{featured.keyStat}</div>
                  <div className="font-['JetBrains_Mono'] text-[9px] uppercase tracking-[0.14em] text-slate-600">{featured.signalType || "signal"} · score {featured.impactScore}</div>
                </div>
              </div>
            </Link>
          ) : null}

          <div className="mt-[20px] grid grid-cols-1 gap-[8px] sm:grid-cols-2">
            {nextFour.map((player, index) => (
              <Link key={player.playerId} to={player.href} className="rounded-[20px] border border-white/8 bg-white/[0.025] p-[12px] transition hover:-translate-y-0.5 hover:border-cyan-300/25">
                <div className="flex items-center gap-[12px]">
                  <div className="h-[52px] w-[52px] overflow-hidden rounded-[12px] bg-slate-900">
                    <img src={player.headshotUrl} alt={player.name} className="player-headshot h-full w-full" loading={index < 2 ? "eager" : "lazy"} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-['Barlow_Condensed'] text-[20px] font-semibold uppercase tracking-[0.08em] text-white">{player.name}</div>
                    <div className="mt-[4px] flex min-w-0 items-center gap-[6px] truncate text-xs text-slate-500">
                      <CountryFlag country={player.country} className="h-[10px] w-[16px]" />
                      <span className="truncate">{player.statLine}</span>
                    </div>
                    {player.insight ? <div className="mt-[4px] truncate text-[11px] text-slate-600">{player.insight.whatToWatch}</div> : null}
                  </div>
                  <div className="font-['Bebas_Neue'] text-[32px] leading-none text-cyan-200">{player.keyStat}</div>
                </div>
              </Link>
            ))}
          </div>

          <div className="mt-[20px] flex items-end justify-between gap-[20px]">
            <div>
              <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-cyan-200">Impact rail</div>
              <div className="mt-[8px] font-['Bebas_Neue'] text-[32px] leading-none tracking-[0.06em] text-white">Top signals</div>
            </div>
            <div className="text-xs text-slate-500">{rail.length} more</div>
          </div>

          <div className="mt-[20px] max-h-[520px] space-y-[8px] overflow-y-auto pr-[4px] scrollbar-thin">
            {rail.map((player, index) => (
              <motion.div
                key={player.playerId}
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: Math.min(index * 0.025, 0.18) }}
              >
                <Link
                  to={player.href}
                  className={cn(
                    "group grid grid-cols-[52px_1fr_auto] items-center gap-[12px] rounded-[20px] border border-white/8 bg-white/[0.025] p-[8px] transition",
                    "hover:-translate-y-0.5 hover:border-emerald-300/25 hover:bg-white/[0.045]",
                  )}
                >
                  <div className="relative h-[52px] w-[52px] overflow-hidden rounded-[12px] bg-slate-900">
                    <img src={player.headshotUrl} alt={player.name} className="player-headshot h-full w-full" loading={index < 4 ? "eager" : "lazy"} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-[8px]">
                      <div className="truncate font-['Barlow_Condensed'] text-[20px] font-semibold uppercase tracking-[0.08em] text-white">{player.name}</div>
                      {teamLogo(player.teamId) ? <img src={teamLogo(player.teamId)} alt={`${player.team} logo`} className="h-4 w-4 object-contain" loading="lazy" /> : null}
                    </div>
                    <div className="mt-[4px] flex min-w-0 items-center gap-[6px] truncate text-xs text-slate-500">
                      <span className="truncate">{player.statLine}</span>
                      <span>-</span>
                      <CountryFlag country={player.country} className="h-[10px] w-[16px]" />
                      <span className="truncate">{player.country}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-['Bebas_Neue'] text-[32px] leading-none tracking-[0.06em] text-emerald-300">{player.keyStat}</div>
                    <div className="font-['JetBrains_Mono'] text-[8px] uppercase tracking-[0.14em] text-slate-600">{player.signalType || "signal"} · {player.contextTag || "context"}</div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

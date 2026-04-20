import Image from "next/image";
import { ArrowUpRight, BadgeCheck, Gem, LineChart, Palette, Rocket, Shield, Sparkles, Users } from "lucide-react";
import { CountUp } from "@/components/ui/CountUp";
import { GameShowcase } from "@/components/ui/GameShowcase";
import { GameShowcaseStack } from "@/components/ui/GameShowcaseStack";
import { LiquidButton } from "@/components/ui/liquid-glass-button";

const roles = [
  { title: "Game Producer", icon: Rocket, text: "Guiding Roblox concepts from early direction into player-ready experiences." },
  { title: "Manager", icon: Users, text: "Coordinating creative work, communication, and execution across studio goals." },
  { title: "Investor", icon: LineChart, text: "Backing the ideas and teams with the strongest potential for growth." },
  { title: "Designer", icon: Palette, text: "Shaping worlds, systems, and brand moments with a polished creator eye." },
  { title: "Marketer", icon: Sparkles, text: "Positioning launches and updates so the right players find the work." },
  { title: "Creator", icon: Gem, text: "Building with taste, range, and a clear sense of what Roblox communities value." },
];

function XIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M18.244 2H21.5l-7.11 8.13L22.75 22h-6.545l-5.126-6.7L5.214 22H1.956l7.603-8.69L1.54 2h6.711l4.633 6.126L18.244 2Zm-1.143 17.91h1.804L7.27 3.98H5.334L17.101 19.91Z" />
    </svg>
  );
}

function DiscordIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M20.317 4.369A19.79 19.79 0 0 0 15.36 2.84a13.54 13.54 0 0 0-.635 1.312 18.44 18.44 0 0 0-5.45 0A13.25 13.25 0 0 0 8.64 2.84a19.73 19.73 0 0 0-4.96 1.533C.543 9.055-.309 13.62.116 18.12a19.9 19.9 0 0 0 6.08 3.04 14.7 14.7 0 0 0 1.303-2.106 12.9 12.9 0 0 1-2.053-.982c.172-.126.34-.257.503-.393a14.15 14.15 0 0 0 12.102 0c.165.136.333.267.504.393-.653.386-1.34.715-2.057.984.373.735.81 1.439 1.304 2.104a19.84 19.84 0 0 0 6.082-3.04c.5-5.222-.853-9.745-3.567-13.751ZM8.02 15.33c-1.184 0-2.157-1.088-2.157-2.425 0-1.337.955-2.425 2.157-2.425 1.21 0 2.176 1.097 2.157 2.425 0 1.337-.955 2.425-2.157 2.425Zm7.96 0c-1.184 0-2.157-1.088-2.157-2.425 0-1.337.955-2.425 2.157-2.425 1.21 0 2.176 1.097 2.157 2.425 0 1.337-.947 2.425-2.157 2.425Z" />
    </svg>
  );
}

function RobloxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true" fill="currentColor">
      <path d="M5.164 1.22 22.78 5.164 18.836 22.78 1.22 18.836 5.164 1.22Zm6.22 8.126-1.21 5.4 5.4 1.21 1.21-5.4-5.4-1.21Z" />
    </svg>
  );
}

const socialLinks = [
  { label: "X", href: "https://x.com/ZaiWinning", icon: XIcon },
  { label: "Discord", href: "https://discord.com/invite/NHWNqdBRFE", icon: DiscordIcon },
  { label: "Roblox", href: "https://www.roblox.com/users/1029137081/profile", icon: RobloxIcon },
];

export default function Home() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#05070b] text-white">
      <section className="relative isolate min-h-screen px-5 py-6 sm:px-8 lg:px-12">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_42%,rgba(14,165,233,0.16),transparent_32%),radial-gradient(circle_at_88%_20%,rgba(52,211,153,0.10),transparent_22%),linear-gradient(180deg,#070911_0%,#05070b_58%,#030406_100%)]" />
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:72px_72px] opacity-[0.07] [mask-image:radial-gradient(circle_at_center,black,transparent_78%)]" />

        <nav className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 rounded-[8px] border border-white/10 bg-[#080c12]/72 px-3 py-2 shadow-[0_18px_70px_rgba(0,0,0,0.24),inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl sm:px-4">
          <a href="#top" className="group flex items-center gap-3 rounded-[8px] px-2 py-1.5 transition hover:bg-white/[0.05]">
            <Image src="/zai-studios-logo.webp" alt="Zai Studios logo" width={30} height={30} className="h-[30px] w-[30px] rounded-[8px] border border-white/15 object-cover brightness-110 contrast-125 transition group-hover:border-white/28" priority />
            <span className="text-sm font-black text-white">Zai Studios</span>
          </a>
          <div className="hidden items-center gap-1 rounded-[8px] border border-white/8 bg-black/20 p-1 text-sm font-semibold text-white/48 md:flex">
            <a className="rounded-[8px] px-3 py-2 transition hover:bg-white/[0.07] hover:text-white" href="#live-projects">Projects</a>
            <a className="rounded-[8px] px-3 py-2 transition hover:bg-white/[0.07] hover:text-white" href="#about">About</a>
            <a className="rounded-[8px] px-3 py-2 transition hover:bg-white/[0.07] hover:text-white" href="#expertise">Expertise</a>
            <a className="rounded-[8px] bg-white/[0.06] px-3 py-2 text-white/72 transition hover:bg-white/[0.1] hover:text-white" href="#contact">Contact</a>
          </div>
        </nav>

        <div id="top" className="mx-auto grid min-h-[calc(100vh-96px)] w-full max-w-7xl grid-cols-1 items-center gap-12 py-14 lg:grid-cols-2 lg:py-8">
          <div className="animate-float-in">
            <div className="mb-7 inline-flex items-center gap-3 rounded-[8px] border border-white/12 bg-white/[0.05] px-4 py-2 text-xs font-semibold uppercase text-white/62 backdrop-blur-xl [animation-delay:80ms]">
              <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_18px_rgba(110,231,183,0.95)]" />
              Roblox creator brand
            </div>

            <h1 className="max-w-3xl text-6xl font-black leading-[0.86] text-white sm:text-7xl lg:text-8xl">
              Zai Studios
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-white/62 sm:text-xl">
              A premium Roblox studio identity spanning production, design, marketing, management, investing, and creator-led execution.
            </p>

            <div className="mt-8 flex max-w-xl flex-wrap items-center gap-3">
              <div className="glass-surface rounded-[8px] px-5 py-4">
                <p className="text-xs font-semibold uppercase text-white/42">Instrumental in achieving</p>
                <p className="mt-1 text-3xl font-black text-white">
                  <CountUp value={353} suffix="M+" /> visits
                </p>
              </div>
              <div className="rounded-[8px] border border-white/10 bg-black/20 px-5 py-4 text-sm leading-6 text-white/55 backdrop-blur-xl">
                Game Producer / Manager / Investor / Designer / Marketer / Creator
              </div>
            </div>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <LiquidButton href="#contact" className="bg-white/22 shadow-[0_20px_80px_rgba(125,211,252,0.24),inset_0_1px_0_rgba(255,255,255,0.38)] hover:scale-[1.03]">
                Start a conversation <ArrowUpRight className="h-4 w-4" />
              </LiquidButton>
              <LiquidButton href="#impact" className="bg-white/6 shadow-[0_14px_50px_rgba(0,0,0,0.28),inset_0_1px_0_rgba(255,255,255,0.22)]">
                See the impact <LineChart className="h-4 w-4" />
              </LiquidButton>
            </div>
          </div>

          <GameShowcase variant="hero" />
        </div>
      </section>

      <GameShowcaseStack />

      <section id="about" className="px-5 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr_1.2fr]">
          <p className="text-sm font-bold uppercase text-sky-200/60">About</p>
          <div className="max-w-4xl">
            <h2 className="text-4xl font-black sm:text-6xl">Built for polished Roblox growth.</h2>
            <p className="mt-6 text-lg leading-8 text-white/58">
              Zai Studios is a Roblox creator brand focused on sharp creative direction, organized production, thoughtful design, and player-facing momentum. The work is grounded in creator instinct, brand clarity, and practical execution.
            </p>
          </div>
        </div>
      </section>

      <section id="expertise" className="px-5 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-bold uppercase text-emerald-200/60">Roles / Expertise</p>
              <h2 className="mt-4 text-4xl font-black sm:text-6xl">One brand, several levers.</h2>
            </div>
            <p className="max-w-md text-base leading-7 text-white/50">A compact mix of production, creative, operational, and growth roles for Roblox projects.</p>
          </div>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {roles.map(({ title, icon: Icon, text }) => (
              <article key={title} className="group rounded-[8px] border border-white/10 bg-white/[0.035] p-6 backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-white/22 hover:bg-white/[0.07]">
                <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-[8px] border border-white/12 bg-white/[0.07] text-sky-100">
                  <Icon className="h-5 w-5 transition duration-300 group-hover:scale-110" />
                </div>
                <h3 className="text-xl font-black">{title}</h3>
                <p className="mt-3 leading-7 text-white/52">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="impact" className="px-5 py-24 sm:px-8 lg:px-12">
        <div className="glass-surface mx-auto grid max-w-7xl gap-10 rounded-[8px] p-8 sm:p-12 lg:grid-cols-[1fr_0.8fr] lg:p-16">
          <div>
            <p className="text-sm font-bold uppercase text-white/46">Impact</p>
            <h2 className="mt-5 text-6xl font-black leading-none sm:text-8xl">353M+</h2>
            <p className="mt-6 max-w-2xl text-xl leading-9 text-white/62">
              Instrumental in achieving 353+ million visits across Roblox work.
            </p>
          </div>
          <div className="grid content-end gap-4">
            {["Production leadership", "Creative direction", "Growth positioning"].map((item) => (
              <div key={item} className="flex items-center gap-3 rounded-[8px] border border-white/10 bg-black/20 p-4 text-white/70">
                <BadgeCheck className="h-5 w-5 text-emerald-200" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="contact" className="px-5 py-24 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-4xl text-center">
          <Shield className="mx-auto h-9 w-9 text-sky-100/70" />
          <h2 className="mt-5 text-4xl font-black sm:text-6xl">Contact Zai Studios</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-white/58">
            Check my primary group if you&apos;d like to contact me.
          </p>
          <div className="mt-9 flex justify-center gap-3">
            {socialLinks.map(({ label, href, icon: Icon }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={`${label} profile`}
                title={label}
                className="group flex h-12 w-12 items-center justify-center rounded-[8px] border border-white/10 bg-white/[0.04] text-white/70 backdrop-blur-2xl transition duration-300 hover:-translate-y-1 hover:border-white/24 hover:bg-white/[0.08] hover:text-white"
              >
                <Icon className="h-5 w-5 transition duration-300 group-hover:scale-110" />
              </a>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

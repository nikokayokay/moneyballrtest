import { ArrowRightIcon, PhoneCallIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameShowcase } from "@/components/ui/GameShowcase";
import { cn } from "@/lib/utils";

export function HeroSection() {
  return (
    <section className="relative mx-auto w-full max-w-7xl overflow-hidden pt-16">
      <div aria-hidden="true" className="absolute inset-0 size-full overflow-hidden">
        <div
          className={cn(
            "absolute inset-0 isolate -z-10",
            "bg-[radial-gradient(20%_80%_at_20%_0%,rgba(255,255,255,0.08),transparent)]",
          )}
        />
      </div>
      <div className="grid grid-cols-1 items-center gap-12 px-4 lg:grid-cols-2">
        <div className="relative z-10 flex max-w-xl flex-col gap-5">
          <a
            className={cn(
              "group flex w-fit items-center gap-3 rounded-sm border border-white/10 bg-white/[0.05] p-1 shadow-xs",
              "animate-float-in fill-mode-backwards transition-all delay-500 duration-500 ease-out",
            )}
            href="#live-projects"
          >
            <div className="rounded-xs border border-white/10 bg-black/25 px-1.5 py-0.5 shadow-sm">
              <p className="font-mono text-xs">LIVE</p>
            </div>

            <span className="text-xs text-white/70">active Roblox projects</span>
            <span className="block h-5 border-l border-white/10" />

            <div className="pr-1">
              <ArrowRightIcon className="size-3 -translate-x-0.5 duration-150 ease-out group-hover:translate-x-0.5" />
            </div>
          </a>

          <h1 className="text-balance text-5xl font-black leading-[0.9] text-white md:text-7xl">
            Zai Studios builds Roblox experiences that move culture.
          </h1>

          <p className="max-w-xl text-sm text-white/62 sm:text-lg md:text-xl">
            Production, design, marketing, management, investing, and creator-led execution for active Roblox communities.
          </p>

          <div className="flex w-fit items-center justify-center gap-3 pt-2">
            <Button variant="outline" asChild>
              <a href="#contact">
                <PhoneCallIcon className="mr-2 size-4" data-icon="inline-start" /> Contact
              </a>
            </Button>
            <Button asChild>
              <a href="#live-projects">
                View live work <ArrowRightIcon className="ml-2 size-4" data-icon="inline-end" />
              </a>
            </Button>
          </div>
        </div>
        <GameShowcase variant="hero" />
      </div>
    </section>
  );
}

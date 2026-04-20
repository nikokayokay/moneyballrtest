"use client";

import React from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import {
  BarChart,
  CodeIcon,
  FileText,
  Gamepad2,
  GlobeIcon,
  Handshake,
  HelpCircle,
  LayersIcon,
  Leaf,
  PlugIcon,
  RotateCcw,
  Shield,
  Star,
  UserPlusIcon,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MenuToggleIcon } from "@/components/ui/menu-toggle-icon";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import { cn } from "@/lib/utils";

type LinkItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description?: string;
};

export function Header() {
  const [open, setOpen] = React.useState(false);
  const scrolled = useScroll(10);

  React.useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={cn("sticky top-0 z-50 w-full border-b border-transparent", {
        "border-white/10 bg-[#05070b]/75 backdrop-blur-lg": scrolled,
      })}
    >
      <nav className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4">
        <div className="flex items-center gap-5">
          <a href="#top" className="flex items-center gap-3 rounded-md p-2 hover:bg-white/[0.06]">
            <Image src="/zai-studios-logo.webp" alt="Zai Studios logo" width={30} height={30} className="h-[30px] w-[30px] rounded-[8px] border border-white/15 object-cover" />
            <span className="text-sm font-black text-white">ZAI STUDIOS</span>
          </a>
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Projects</NavigationMenuTrigger>
                <NavigationMenuContent className="bg-[#070911] p-1 pr-1.5">
                  <ul className="grid w-[34rem] grid-cols-2 gap-2 rounded-md border border-white/10 bg-white/[0.04] p-2 shadow">
                    {productLinks.map((item) => (
                      <li key={item.title}>
                        <ListItem {...item} />
                      </li>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuTrigger>Studio</NavigationMenuTrigger>
                <NavigationMenuContent className="bg-[#070911] p-1 pr-1.5 pb-1.5">
                  <div className="grid w-[34rem] grid-cols-2 gap-2">
                    <ul className="space-y-2 rounded-md border border-white/10 bg-white/[0.04] p-2 shadow">
                      {companyLinks.map((item) => (
                        <li key={item.title}>
                          <ListItem {...item} />
                        </li>
                      ))}
                    </ul>
                    <ul className="space-y-2 p-3">
                      {companyLinks2.map((item) => (
                        <li key={item.title}>
                          <NavigationMenuLink
                            href={item.href}
                            className="flex flex-row items-center gap-x-2 rounded-md p-2 text-white/70 hover:bg-white/[0.08] hover:text-white"
                          >
                            <item.icon className="size-4 text-white" />
                            <span className="font-medium">{item.title}</span>
                          </NavigationMenuLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                </NavigationMenuContent>
              </NavigationMenuItem>
              <NavigationMenuLink className="px-4" asChild>
                <a href="#contact" className="rounded-md p-2 text-white/70 hover:bg-white/[0.08] hover:text-white">
                  Contact
                </a>
              </NavigationMenuLink>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <Button variant="outline" asChild>
            <a href="#impact">Impact</a>
          </Button>
          <Button asChild>
            <a href="#contact">Get in touch</a>
          </Button>
        </div>
        <Button
          size="icon"
          variant="outline"
          onClick={() => setOpen(!open)}
          className="md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label="Toggle menu"
        >
          <MenuToggleIcon open={open} className="size-5" duration={300} />
        </Button>
      </nav>
      <MobileMenu open={open} className="flex flex-col justify-between gap-2 overflow-y-auto">
        <NavigationMenu className="max-w-full">
          <div className="flex w-full flex-col gap-y-2">
            <span className="text-sm text-white/55">Projects</span>
            {productLinks.map((link) => (
              <ListItem key={link.title} {...link} />
            ))}
            <span className="pt-4 text-sm text-white/55">Studio</span>
            {companyLinks.map((link) => (
              <ListItem key={link.title} {...link} />
            ))}
            {companyLinks2.map((link) => (
              <ListItem key={link.title} {...link} />
            ))}
          </div>
        </NavigationMenu>
        <div className="flex flex-col gap-2">
          <Button variant="outline" className="w-full bg-transparent" asChild>
            <a href="#impact">Impact</a>
          </Button>
          <Button className="w-full" asChild>
            <a href="#contact">Get in touch</a>
          </Button>
        </div>
      </MobileMenu>
    </header>
  );
}

type MobileMenuProps = React.ComponentProps<"div"> & {
  open: boolean;
};

function MobileMenu({ open, children, className, ...props }: MobileMenuProps) {
  if (!open || typeof window === "undefined") return null;

  return createPortal(
    <div
      id="mobile-menu"
      className={cn(
        "fixed bottom-0 left-0 right-0 top-16 z-40 flex flex-col overflow-hidden border-y border-white/10 bg-[#05070b]/90 backdrop-blur-lg md:hidden",
      )}
    >
      <div data-slot={open ? "open" : "closed"} className={cn("size-full p-4", className)} {...props}>
        {children}
      </div>
    </div>,
    document.body,
  );
}

function ListItem({
  title,
  description,
  icon: Icon,
  className,
  href,
  ...props
}: React.ComponentProps<typeof NavigationMenuLink> & LinkItem) {
  return (
    <NavigationMenuLink
      className={cn("flex w-full flex-row gap-x-2 rounded-sm p-2 text-white/70 hover:bg-white/[0.08] hover:text-white focus:bg-white/[0.08] focus:text-white", className)}
      {...props}
      asChild
    >
      <a href={href}>
        <div className="flex aspect-square size-12 items-center justify-center rounded-md border border-white/10 bg-black/25 shadow-sm">
          <Icon className="size-5 text-white" />
        </div>
        <div className="flex flex-col items-start justify-center">
          <span className="font-medium">{title}</span>
          <span className="text-xs text-white/45">{description}</span>
        </div>
      </a>
    </NavigationMenuLink>
  );
}

const productLinks: LinkItem[] = [
  {
    title: "Stand Upright",
    href: "https://www.roblox.com/games/8540168650/Stand-Upright-Rebooted",
    description: "Live Roblox fighting experience",
    icon: Gamepad2,
  },
  {
    title: "More Aura",
    href: "https://www.roblox.com/games/119144727737197/More-Aura",
    description: "Roblox project showcase",
    icon: GlobeIcon,
  },
  {
    title: "Project Mugetsu",
    href: "https://www.roblox.com/games/9447079542/Project-Mugetsu",
    description: "Anime-inspired Roblox experience",
    icon: LayersIcon,
  },
  {
    title: "Analytics",
    href: "#impact",
    description: "Performance and visit momentum",
    icon: BarChart,
  },
  {
    title: "Integrations",
    href: "#live-projects",
    description: "Live Roblox API data",
    icon: PlugIcon,
  },
  {
    title: "Production",
    href: "#expertise",
    description: "Direction across teams and launches",
    icon: CodeIcon,
  },
];

const companyLinks: LinkItem[] = [
  {
    title: "About Zai",
    href: "#about",
    description: "Creator brand and studio direction",
    icon: Users,
  },
  {
    title: "Impact",
    href: "#impact",
    description: "353M+ visits across Roblox work",
    icon: Star,
  },
  {
    title: "Partnerships",
    href: "#contact",
    icon: Handshake,
    description: "Contact through the primary group",
  },
];

const companyLinks2: LinkItem[] = [
  { title: "Contact", href: "#contact", icon: FileText },
  { title: "Roblox", href: "https://www.roblox.com/users/1029137081/profile", icon: Shield },
  { title: "Discord", href: "https://discord.com/invite/NHWNqdBRFE", icon: RotateCcw },
  { title: "X", href: "https://x.com/ZaiWinning", icon: Leaf },
  { title: "Live Projects", href: "#live-projects", icon: HelpCircle },
];

function useScroll(threshold: number) {
  const [scrolled, setScrolled] = React.useState(false);

  const onScroll = React.useCallback(() => {
    setScrolled(window.scrollY > threshold);
  }, [threshold]);

  React.useEffect(() => {
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [onScroll]);

  React.useEffect(() => {
    onScroll();
  }, [onScroll]);

  return scrolled;
}

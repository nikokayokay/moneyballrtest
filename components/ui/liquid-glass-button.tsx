import * as React from "react";
import { cn } from "@/lib/utils";

type LiquidButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  href?: string;
  target?: string;
  rel?: string;
};

export const LiquidButton = React.forwardRef<HTMLButtonElement | HTMLAnchorElement, LiquidButtonProps>(
  ({ className, children, href, target, rel, type = "button", ...props }, ref) => {
    const classes = cn(
      "group relative inline-flex min-h-12 items-center justify-center overflow-hidden rounded-[8px] border border-white/25 px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_55px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.35)] outline-none transition duration-300 hover:-translate-y-0.5 hover:border-white/40 hover:bg-white/18 focus-visible:ring-2 focus-visible:ring-sky-200/70 active:translate-y-0",
      "before:absolute before:inset-x-3 before:top-0 before:h-px before:bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.85),transparent)] before:content-['']",
      "after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.48),transparent_26%),linear-gradient(135deg,rgba(255,255,255,0.30),rgba(255,255,255,0.04)_42%,rgba(125,211,252,0.18))] after:opacity-70 after:transition-opacity after:duration-300 after:content-[''] group-hover:after:opacity-95",
      className,
    );

    const content = <span className="relative z-10 flex items-center gap-2 whitespace-nowrap">{children}</span>;

    if (href) {
      return (
        <a
          ref={ref as React.ForwardedRef<HTMLAnchorElement>}
          className={classes}
          href={href}
          target={target}
          rel={rel ?? (target === "_blank" ? "noreferrer" : undefined)}
        >
          {content}
        </a>
      );
    }

    return (
      <button ref={ref as React.ForwardedRef<HTMLButtonElement>} className={classes} type={type} {...props}>
        {content}
      </button>
    );
  },
);

LiquidButton.displayName = "LiquidButton";

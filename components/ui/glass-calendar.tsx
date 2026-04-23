import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { addMonths, format, getDate, getDaysInMonth, isSameDay, isToday, startOfMonth, subMonths } from "date-fns";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type Day = {
  date: Date;
  isToday: boolean;
  isSelected: boolean;
  isFuture: boolean;
};

interface GlassCalendarProps extends React.HTMLAttributes<HTMLDivElement> {
  selectedDate?: Date;
  onDateSelect?: (date: Date) => void;
}

function sameMonth(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

function seasonMonths(year: number) {
  return [2, 3, 4, 5, 6, 7, 8, 9, 10].map((month) => new Date(year, month, 1));
}

function monthIndex(date: Date) {
  return date.getMonth();
}

const ScrollbarHide = () => (
  <style>{`
    .scrollbar-hide::-webkit-scrollbar { display: none; }
    .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
  `}</style>
);

export const GlassCalendar = React.forwardRef<HTMLDivElement, GlassCalendarProps>(
  ({ className, selectedDate: propSelectedDate, onDateSelect, ...props }, ref) => {
    const [currentMonth, setCurrentMonth] = React.useState(propSelectedDate || new Date());
    const selectedDate = propSelectedDate || new Date();
    const today = React.useMemo(() => new Date(), []);
    const selectedDayRef = React.useRef<HTMLButtonElement | null>(null);
    const months = React.useMemo(() => seasonMonths(currentMonth.getFullYear()), [currentMonth]);
    const canGoPrev = monthIndex(currentMonth) > 2;
    const canGoNext = monthIndex(currentMonth) < 10;

    React.useEffect(() => {
      if (propSelectedDate && !sameMonth(propSelectedDate, currentMonth)) {
        setCurrentMonth(propSelectedDate);
      }
    }, [currentMonth, propSelectedDate]);

    const monthDays = React.useMemo(() => {
      const start = startOfMonth(currentMonth);
      const totalDays = getDaysInMonth(currentMonth);
      const days: Day[] = [];
      for (let i = 0; i < totalDays; i += 1) {
        const date = new Date(start.getFullYear(), start.getMonth(), i + 1);
        days.push({
          date,
          isToday: isToday(date),
          isSelected: isSameDay(date, selectedDate),
          isFuture: date > today,
        });
      }
      return days;
    }, [currentMonth, selectedDate, today]);

    const handleDateClick = (date: Date) => {
      if (date > today) return;
      onDateSelect?.(date);
    };

    React.useEffect(() => {
      selectedDayRef.current?.scrollIntoView({ inline: "center", block: "nearest", behavior: "smooth" });
    }, [selectedDate, currentMonth]);

    return (
      <div
        ref={ref}
        className={cn(
          "w-full max-w-[520px] overflow-hidden rounded-[32px] border border-cyan-300/15 bg-[#07111b]/88 p-[20px] text-white shadow-2xl shadow-black/30 backdrop-blur-xl",
          className,
        )}
        {...props}
      >
        <ScrollbarHide />
        <div className="flex items-center justify-between gap-[12px]">
          <div>
            <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.18em] text-cyan-200">Game date</div>
            <motion.p
              key={format(currentMonth, "MMMM-yyyy")}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className="mt-[4px] font-['Bebas_Neue'] text-[32px] leading-none tracking-[0.06em] text-white"
            >
              {format(currentMonth, "MMMM yyyy")}
            </motion.p>
          </div>
          <div className="flex items-center gap-[8px]">
            <button
              type="button"
              onClick={() => canGoPrev && setCurrentMonth(subMonths(currentMonth, 1))}
              className="rounded-full border border-white/10 bg-white/[0.035] p-[8px] text-white/70 transition hover:border-cyan-300/30 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Previous month"
              disabled={!canGoPrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => canGoNext && setCurrentMonth(addMonths(currentMonth, 1))}
              className="rounded-full border border-white/10 bg-white/[0.035] p-[8px] text-white/70 transition hover:border-cyan-300/30 hover:text-cyan-100 disabled:cursor-not-allowed disabled:opacity-35"
              aria-label="Next month"
              disabled={!canGoNext}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="-mx-[20px] mt-[20px] overflow-x-auto border-y border-white/10 px-[20px] py-[12px] scrollbar-hide">
          <div className="flex gap-[8px]">
            {months.map((month) => {
              const isActive = sameMonth(month, currentMonth);
              return (
                <button
                  key={month.toISOString()}
                  type="button"
                  onClick={() => setCurrentMonth(month)}
                  className={cn(
                    "shrink-0 rounded-full border px-[12px] py-[8px] font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.14em] transition",
                    isActive && "border-emerald-300/35 bg-emerald-300/10 text-emerald-200",
                    !isActive && "border-white/10 bg-white/[0.025] text-slate-400 hover:border-cyan-300/25 hover:text-cyan-100",
                  )}
                >
                  {format(month, "MMM")}
                </button>
              );
            })}
          </div>
        </div>

        <div className="-mx-[20px] mt-[12px] overflow-x-auto px-[20px] scrollbar-hide">
          <div className="flex min-w-max gap-[12px]">
            {monthDays.map((day) => (
              <div key={format(day.date, "yyyy-MM-dd")} className="flex shrink-0 flex-col items-center gap-[8px]">
                <span className="font-['JetBrains_Mono'] text-[9px] uppercase tracking-[0.12em] text-slate-500">
                  {format(day.date, "EEE").slice(0, 1)}
                </span>
                <button
                  ref={day.isSelected ? selectedDayRef : null}
                  type="button"
                  onClick={() => handleDateClick(day.date)}
                  disabled={day.isFuture}
                  className={cn(
                    "relative flex h-[32px] w-[32px] items-center justify-center rounded-full text-[12px] font-semibold transition",
                    day.isSelected && "bg-emerald-300 text-[#03120d] shadow-[0_0_20px_rgba(52,211,153,.22)]",
                    !day.isSelected && !day.isFuture && "text-slate-200 hover:bg-white/10 hover:text-white",
                    day.isFuture && "cursor-not-allowed text-slate-700",
                  )}
                >
                  {day.isToday && !day.isSelected ? <span className="absolute bottom-[4px] h-[4px] w-[4px] rounded-full bg-cyan-300" /> : null}
                  {getDate(day.date)}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-[20px] border-t border-white/10 pt-[12px] font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.14em] text-slate-500">
          Selected: <span className="text-cyan-200">{format(selectedDate, "MMM d, yyyy")}</span>
        </div>
      </div>
    );
  },
);

GlassCalendar.displayName = "GlassCalendar";

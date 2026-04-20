type LiveGame = {
  game: string;
  score: string;
  performer: string;
};

type LiveGameTickerProps = {
  games: LiveGame[];
};

export function LiveGameTicker({ games }: LiveGameTickerProps) {
  return (
    <section className="border-y border-white/8 bg-[#090f19]">
      <div className="flex gap-3 overflow-x-auto px-4 py-3 scrollbar-thin">
        {games.map((game) => (
          <div key={game.game} className="min-w-[17rem] border-r border-white/8 pr-4">
            <div className="flex items-center justify-between gap-3">
              <div className="font-['JetBrains_Mono'] text-[10px] uppercase tracking-[0.16em] text-cyan-200">{game.game}</div>
              <div className="font-['Bebas_Neue'] text-2xl tracking-[0.06em] text-white">{game.score}</div>
            </div>
            <div className="mt-1 truncate text-sm text-slate-400">{game.performer}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

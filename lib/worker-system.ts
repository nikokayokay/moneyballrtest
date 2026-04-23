export type WorkerTask<TInput, TOutput> = (input: TInput) => TOutput;

export async function runBackgroundTask<TInput, TOutput>(task: WorkerTask<TInput, TOutput>, input: TInput): Promise<TOutput> {
  if (typeof window === "undefined" || typeof Worker === "undefined") return task(input);
  return new Promise((resolve) => {
    window.setTimeout(() => resolve(task(input)), 0);
  });
}

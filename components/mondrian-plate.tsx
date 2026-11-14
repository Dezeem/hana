import { cn } from "@/lib/utils";

/**
 * A static De Stijl composition used as the home page's counterweight to the
 * headline: black rules, three primaries, asymmetric planes.
 */
export function MondrianPlate({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "grid aspect-square w-full max-w-[420px] grid-cols-6 grid-rows-6 border border-line bg-paper",
        className,
      )}
      aria-hidden
    >
      <div className="col-span-4 row-span-3 border-b border-r border-line bg-[var(--c-movie)]" />
      <div className="col-span-2 row-span-2 border-b border-line bg-paper" />
      <div className="col-span-2 row-span-1 border-b border-line bg-[var(--c-book)]" />
      <div className="col-span-2 row-span-3 border-b border-r border-line bg-[var(--c-series)]" />
      <div className="col-span-3 row-span-3 bg-paper" />
      <div className="col-span-3 row-span-3 border-t border-l border-line bg-ink" />
    </div>
  );
}

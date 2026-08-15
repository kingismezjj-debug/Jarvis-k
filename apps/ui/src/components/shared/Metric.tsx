import { cn } from "@/lib/utils";

export function Metric({
  label,
  tone,
  value,
}: {
  label: string;
  tone?: "success" | "warning" | "accent";
  value: string;
}) {
  return (
    <div className="flex h-[42px] items-center justify-between gap-3">
      <dt className="shrink-0 text-muted-foreground">{label}</dt>
      <dd
        className={cn(
          "min-w-0 truncate text-right font-medium uppercase",
          tone === "success" && "text-success",
          tone === "warning" && "text-warning",
          tone === "accent" && "text-accent",
        )}
      >
        {value}
      </dd>
    </div>
  );
}

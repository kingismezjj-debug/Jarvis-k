import { Badge } from "@/components/ui/badge";
import { Metric } from "@/components/shared/Metric";
import type { MemoryBoundaryViewModel } from "./memory-boundary-view-model";

export function MemoryBoundaryPanel({
  viewModel,
}: {
  viewModel: MemoryBoundaryViewModel;
}) {
  return (
    <section className="min-w-0">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Memory boundary</h3>
        <Badge className="rounded-md text-[10px]" variant="outline">
          {viewModel.badge}
        </Badge>
      </div>
      <dl
        className="divide-y divide-border border-y text-[11px]"
        data-testid="user-controlled-memory-boundary"
      >
        {viewModel.metrics.map((item) => (
          <Metric
            key={item.label}
            label={item.label}
            tone={item.tone}
            value={item.value}
          />
        ))}
      </dl>
      <p className="mt-3 text-[11px] leading-5 text-muted-foreground">
        {viewModel.footer}
      </p>
    </section>
  );
}

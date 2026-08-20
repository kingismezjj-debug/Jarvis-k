import { RefreshCw } from "lucide-react";
import type { ModelOperationSnapshot } from "@jarvis-k/contracts";

import type { uiCopy } from "@/app/copy";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

type Copy = (typeof uiCopy)["en"];

export type ModelOperationListViewModel = {
  operations: ModelOperationSnapshot[];
};

export type ModelOperationListActions = {
  refresh(): void;
};

export function ModelOperationList({
  actions,
  copy,
  sending,
  viewModel,
}: {
  actions: ModelOperationListActions;
  copy: Copy;
  sending: boolean;
  viewModel: ModelOperationListViewModel;
}) {
  return (
    <section className="min-w-0" data-testid="model-operation-list">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">Model Operations</h3>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              aria-label="Refresh model governance from tasks"
              className="size-8 rounded-md"
              data-testid="tasks-refresh-model-governance"
              disabled={sending}
              onClick={actions.refresh}
              size="icon-sm"
              type="button"
              variant="ghost"
            >
              <RefreshCw
                className={cn("size-3.5", sending && "animate-spin")}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Refresh model governance</TooltipContent>
        </Tooltip>
      </div>
      <div className="divide-y divide-border border-y">
        {viewModel.operations.length === 0 ? (
          <div className="py-5 text-xs text-muted-foreground">
            {copy.label.noModelOperations}
          </div>
        ) : (
          viewModel.operations.slice(0, 8).map((operation) => (
            <div className="py-3 text-xs" key={operation.operationId}>
              <div className="flex items-center justify-between gap-3">
                <span className="truncate font-medium">{operation.modelId}</span>
                <Badge className="rounded-md text-[10px]" variant="outline">
                  {operation.phase}
                </Badge>
              </div>
              <p className="mt-1 truncate text-[10px] text-muted-foreground">
                {operation.capability} / {operation.reasons[0] ?? "no reason"}
              </p>
            </div>
          ))
        )}
      </div>
    </section>
  );
}

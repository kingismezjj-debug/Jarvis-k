import { Play, X } from "lucide-react";
import type { Task } from "@jarvis-k/contracts";

import type { uiCopy } from "@/app/copy";
import {
  formatEventTime,
  isTaskApprovalEligible,
  isTaskCancellationEligible,
} from "@/app/formatters";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type Copy = (typeof uiCopy)["en"];

export type TaskTimelineViewModel = {
  tasks: Task[];
};

export type TaskTimelineActions = {
  approveTask(taskId: string, title: string): void;
  cancelTask(taskId: string, title: string): void;
};

export function TaskTimeline({
  actions,
  copy,
  sending,
  viewModel,
}: {
  actions: TaskTimelineActions;
  copy: Copy;
  sending: boolean;
  viewModel: TaskTimelineViewModel;
}) {
  return (
    <section className="min-w-0">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{copy.view.tasks}</h3>
        <Badge className="rounded-md text-[10px]" variant="outline">
          {viewModel.tasks.length} TRACKED
        </Badge>
      </div>
      <div className="grid gap-3">
        {viewModel.tasks.length === 0 ? (
          <div className="border-y py-5 text-xs text-muted-foreground">
            {copy.label.noCoreTasks}
          </div>
        ) : (
          viewModel.tasks.map((task) => (
            <article
              className="rounded-md border bg-card/40 p-3 text-xs"
              data-testid="task-card"
              key={task.id}
            >
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">{task.title}</div>
                  <div className="mt-1 flex flex-wrap gap-2 text-[10px] text-muted-foreground">
                    <span>{task.routeSource}</span>
                    {task.intent ? <span>{task.intent}</span> : null}
                    {task.verificationSummary ? (
                      <span>{task.verificationSummary}</span>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="text-right">
                    <Badge className="rounded-md text-[10px]" variant="outline">
                      {task.state}
                    </Badge>
                    <time className="mt-1 block text-[10px] text-muted-foreground">
                      {formatEventTime(task.updatedAt)}
                    </time>
                  </div>
                  {isTaskApprovalEligible(task.state) ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          aria-label={`Approve ${task.title}`}
                          className="size-7 rounded-md"
                          data-testid="task-approve"
                          disabled={sending}
                          onClick={() => actions.approveTask(task.id, task.title)}
                          size="icon-sm"
                          type="button"
                          variant="ghost"
                        >
                          <Play className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        Approve and execute planner draft
                      </TooltipContent>
                    </Tooltip>
                  ) : null}
                  {isTaskCancellationEligible(task.state) ? (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          aria-label={`Cancel ${task.title}`}
                          className="size-7 rounded-md"
                          data-testid="task-cancel"
                          disabled={sending}
                          onClick={() => actions.cancelTask(task.id, task.title)}
                          size="icon-sm"
                          type="button"
                          variant="ghost"
                        >
                          <X className="size-3.5" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>Cancel pending task</TooltipContent>
                    </Tooltip>
                  ) : null}
                </div>
              </div>

              {task.steps.length > 0 ? (
                <div className="mt-3 grid gap-2 border-t pt-3">
                  {task.steps.map((step) => (
                    <div
                      className="grid grid-cols-[minmax(0,1fr)_110px_130px] items-center gap-2"
                      data-testid="task-step"
                      key={step.id}
                    >
                      <span className="truncate">{step.title}</span>
                      <span className="truncate text-muted-foreground">
                        {step.state}
                      </span>
                      <span className="truncate text-right text-muted-foreground">
                        {step.verificationStatus}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}

              {task.events.length > 0 ? (
                <div className="mt-3 grid gap-1 border-t pt-3">
                  {task.events.slice(-5).map((event) => (
                    <div
                      className="grid grid-cols-[76px_minmax(0,1fr)] gap-2 text-[10px] text-muted-foreground"
                      data-testid="task-event"
                      key={event.id}
                    >
                      <time>{formatEventTime(event.createdAt)}</time>
                      <span className="truncate">
                        {event.type}: {event.message}
                      </span>
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          ))
        )}
      </div>
    </section>
  );
}

import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { ActiveView, NavItem } from "@/app/types";

export function NavigationButton({
  active,
  item,
  label,
  onSelect,
}: {
  active: boolean;
  item: NavItem;
  label: string;
  onSelect: (view: ActiveView) => void;
}) {
  const Icon = item.icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          aria-label={label}
          aria-pressed={active}
          className={cn(
            "relative size-10 rounded-md text-muted-foreground",
            active && "bg-secondary text-primary hover:bg-secondary",
          )}
          data-testid={`nav-${item.id}`}
          onClick={() => onSelect(item.id)}
          size="icon-lg"
          type="button"
          variant="ghost"
        >
          {active && (
            <span className="absolute -left-[17px] h-5 w-0.5 rounded-r bg-primary" />
          )}
          <Icon className="size-[18px]" />
        </Button>
      </TooltipTrigger>
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

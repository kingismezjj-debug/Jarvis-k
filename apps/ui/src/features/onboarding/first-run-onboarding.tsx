import { Check, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ONBOARDING_STEPS = [
  {
    title: "Welcome to Jarvis-K",
    body:
      "Jarvis-K is an Alpha desktop assistant for text, voice, read-only plugins, and safe desktop task routing.",
    bullets: [
      "Text mode works without any provider setup.",
      "Desktop actions stay behind policy checks.",
      "Alpha builds are intended for careful daily testing.",
    ],
  },
  {
    title: "Privacy and Safety",
    body:
      "Jarvis-K keeps sensitive capabilities off until you explicitly enable them.",
    bullets: [
      "The microphone is not started automatically.",
      "Voice Regression is off by default and does not save raw audio.",
      "The close button minimizes to tray by default; use Tray Quit for full exit.",
    ],
  },
  {
    title: "Basic Setup",
    body:
      "You can configure providers later. Credentials use the desktop secure store and are never shown back in normal UI.",
    bullets: [
      "Choose language and appearance from Settings.",
      "Chat and voice providers are optional.",
      "Developer and evaluation surfaces remain hidden unless enabled.",
    ],
  },
  {
    title: "Ready",
    body:
      "Start from Conversation, return from the tray when hidden, and use Settings to adjust local behavior.",
    bullets: [
      "Use the sidebar to open product areas.",
      "Close hides to tray; Settings can change this to quit.",
      "Advanced diagnostics are available later if you opt in.",
    ],
  },
] as const;

export function FirstRunOnboarding({
  onComplete,
  onSkip,
}: {
  onComplete: () => void;
  onSkip: () => void;
}) {
  const [stepIndex, setStepIndex] = useState(0);
  const step = ONBOARDING_STEPS[stepIndex];
  const isLastStep = stepIndex === ONBOARDING_STEPS.length - 1;

  return (
    <section
      aria-label="First-run onboarding"
      className="border-t bg-background px-5 py-4"
      data-testid="first-run-onboarding"
      role="region"
    >
      <div className="mx-auto w-full max-w-5xl">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Badge className="mb-3 rounded-md text-[10px]" variant="outline">
              Alpha
            </Badge>
            <h2 className="text-base font-semibold">{step.title}</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              {step.body}
            </p>
          </div>
          <Button
            aria-label="Skip onboarding"
            className="size-8 rounded-md p-0"
            data-testid="first-run-skip-icon"
            onClick={onSkip}
            type="button"
            variant="ghost"
          >
            <X className="size-4" />
          </Button>
        </div>
        <ul className="mt-4 space-y-2 text-sm">
          {step.bullets.map((item) => (
            <li className="flex gap-2" key={item}>
              <Check className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
        <div className="mt-5 flex items-center justify-between gap-3">
          <div className="flex gap-1">
            {ONBOARDING_STEPS.map((item, index) => (
              <span
                aria-label={`${item.title} step`}
                className={
                  index === stepIndex
                    ? "h-1.5 w-6 rounded-full bg-primary"
                    : "h-1.5 w-2 rounded-full bg-muted"
                }
                key={item.title}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <Button
              className="h-8 rounded-md px-2.5 text-xs"
              data-testid="first-run-skip"
              onClick={onSkip}
              type="button"
              variant="ghost"
            >
              Skip
            </Button>
            <Button
              className="h-8 rounded-md px-2.5 text-xs"
              data-testid="first-run-back"
              disabled={stepIndex === 0}
              onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
              type="button"
              variant="outline"
            >
              <ChevronLeft className="size-3.5" />
              Back
            </Button>
            <Button
              className="h-8 rounded-md px-2.5 text-xs"
              data-testid={isLastStep ? "first-run-finish" : "first-run-next"}
              onClick={() => {
                if (isLastStep) {
                  onComplete();
                  return;
                }
                setStepIndex((current) =>
                  Math.min(ONBOARDING_STEPS.length - 1, current + 1),
                );
              }}
              type="button"
            >
              {isLastStep ? "Start using Jarvis-K" : "Next"}
              {!isLastStep ? <ChevronRight className="size-3.5" /> : null}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}

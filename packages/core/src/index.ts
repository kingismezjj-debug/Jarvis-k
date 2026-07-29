import {
  CoreInboundMessageSchema,
  CoreOutboundMessage
} from "@jarvis-k/contracts";
import { CoreRuntime } from "./runtime";

function send(message: CoreOutboundMessage): void {
  if (process.send) {
    process.send(message);
  }
}

const runtime = new CoreRuntime((event) => {
  send({
    kind: "event",
    envelope: event
  });
});

process.on("message", (rawMessage: unknown) => {
  const parsed = CoreInboundMessageSchema.safeParse(rawMessage);
  if (!parsed.success) {
    console.error("[core] Rejected invalid supervisor message.");
    return;
  }

  try {
    const result = runtime.handle(parsed.data.envelope);
    send({
      kind: "result",
      envelope: result
    });
  } catch (error) {
    console.error(
      "[core] Command handling failed:",
      error instanceof Error ? error.message : "unknown error"
    );
  }
});

process.on("uncaughtException", (error) => {
  console.error("[core] Uncaught exception:", error.message);
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  console.error(
    "[core] Unhandled rejection:",
    reason instanceof Error ? reason.message : "unknown reason"
  );
  process.exit(1);
});

runtime.announceReady();

export { CoreRuntime } from "./runtime";

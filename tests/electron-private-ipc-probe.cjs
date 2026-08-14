const { app } = require("electron");

let settled = false;

process.once("message", (message) => {
  const received =
    isRecord(message) &&
    message.kind === "fixture-private-ipc-probe" &&
    message.payload === "fixture-value";
  settled = true;
  console.log(
    JSON.stringify({
      status: received ? "passed" : "failed",
      payloadExposed: false
    })
  );
  app.exit(received ? 0 : 1);
});

void app.whenReady().then(() => {
  setTimeout(() => {
    if (settled) {
      return;
    }
    console.log(
      JSON.stringify({
        status: "failed",
        payloadExposed: false
      })
    );
    app.exit(1);
  }, 1_000);
});

function isRecord(value) {
  return typeof value === "object" && value !== null;
}

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"

import App from "./App"
import { ErrorBoundary } from "./ErrorBoundary"
import { TooltipProvider } from "@/components/ui/tooltip"
import "./index.css"

document.documentElement.classList.add("dark")

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ErrorBoundary>
      <TooltipProvider delayDuration={250}>
        <App />
      </TooltipProvider>
    </ErrorBoundary>
  </StrictMode>
)

import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import ActivityEditorApp from "./ActivityEditorApp"
import "./editor.css"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ActivityEditorApp />
  </StrictMode>
)


import { StrictMode, useState } from "react"
import { createRoot } from "react-dom/client"
import ActivityEditorApp from "./ActivityEditorApp"
import ResourceEditorApp from "./ResourceEditorApp"
import { RESOURCE_DOCUMENT_KEYS, RESOURCE_EDITOR_DOCUMENTS } from "./resourceEditorSchema"
import "./editor.css"

function EditorWorkspace() {
  const [active, setActive] = useState<string>("activities")
  const tabs = [
    { key: "activities", label: "Activities" },
    ...RESOURCE_DOCUMENT_KEYS.map(key => ({ key, label: RESOURCE_EDITOR_DOCUMENTS[key].label })),
  ]

  return <>
    <nav className="workspace-tabs" aria-label="YAML 文件切换">
      {tabs.map(tab => <button type="button" key={tab.key} className={tab.key === active ? "active" : ""}
        aria-current={tab.key === active ? "page" : undefined} onClick={() => setActive(tab.key)}>{tab.label}</button>)}
    </nav>
    <div hidden={active !== "activities"}><ActivityEditorApp /></div>
    {RESOURCE_DOCUMENT_KEYS.map(key => <div key={key} hidden={active !== key}><ResourceEditorApp documentKey={key} active={active === key} /></div>)}
  </>
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <EditorWorkspace />
  </StrictMode>
)

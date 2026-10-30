import { useState, type ReactNode } from "react"
import { ChevronDown } from "lucide-react"
import type { LocalizedText } from "../types"
import { ACTIVITY_RESOURCE_TITLE_PRESETS } from "./activityResourceTitles"

export default function ActivityResourceTitleEditor({ value, onChange, children }: {
  value: unknown
  onChange: (value: LocalizedText) => void
  children: ReactNode
}) {
  const [custom, setCustom] = useState(false)
  const title = value && typeof value === "object" ? value as Partial<LocalizedText> : undefined
  const preset = ACTIVITY_RESOURCE_TITLE_PRESETS.find(item => item.title.ja === title?.ja && item.title.en === title?.en)
  const mode = custom ? "other" : preset?.id ?? (title?.ja || title?.en ? "other" : "")

  return <div className="resource-title-field">
    <label className="form-field">
      <span>title preset <em className="required">required</em></span>
      <span className="select-wrap"><select value={mode} onChange={event => {
        if (event.target.value === "other") { setCustom(true); return }
        const next = ACTIVITY_RESOURCE_TITLE_PRESETS.find(item => item.id === event.target.value)
        if (next) { setCustom(false); onChange({ ...next.title }) }
      }}>
        <option value="" disabled>Select a title preset</option>
        {ACTIVITY_RESOURCE_TITLE_PRESETS.map(item => <option key={item.id} value={item.id}>{item.title.ja} — {item.title.en}</option>)}
        <option value="other">other</option>
      </select><ChevronDown aria-hidden="true" /></span>
      <small>选择预设会同时填写 title.ja 和 title.en；other 可自定义输入。</small>
    </label>
    {mode === "other" && children}
  </div>
}

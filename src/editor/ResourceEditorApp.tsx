import { useEffect, useMemo, useState } from "react"
import { AlertCircle, ChevronDown, ChevronUp, Copy, FileCode2, Plus, RefreshCw, Save, Search, Trash2 } from "lucide-react"
import { stringify } from "yaml"
import {
  RESOURCE_EDITOR_DOCUMENTS,
  type EditorField,
  type ResourceDocumentKey,
} from "./resourceEditorSchema"
import { validateResourceDocument } from "./resourceValidation"

type RecordValue = Record<string, unknown>
type ResourceResponse = {
  entries: RecordValue[]
  revision: string
  activityIds?: string[]
  error?: string
}

const AUTO_REFRESH_INTERVAL_MS = 15_000

function isRecord(value: unknown): value is RecordValue {
  return value !== null && typeof value === "object" && !Array.isArray(value)
}

function localizedLabel(value: unknown): string {
  if (typeof value === "string") return value
  if (isRecord(value)) return String(value.ja || value.en || "")
  return ""
}

function unknownFieldNames(record: RecordValue, fields: readonly EditorField[], path = ""): string[] {
  const known = new Set(fields.flatMap(field => field.kind === "resourceTarget" ? ["url", "links"] : [field.key]))
  const unknown = Object.keys(record).filter(key => !known.has(key)).map(key => `${path}${key}`)
  for (const field of fields) {
    const value = record[field.key]
    if (field.kind === "object" && isRecord(value)) {
      unknown.push(...unknownFieldNames(value, field.fields ?? [], `${path}${field.key}.`))
    }
    if (field.kind === "array" && Array.isArray(value) && field.item?.kind === "object") {
      value.forEach((item, index) => {
        if (isRecord(item)) unknown.push(...unknownFieldNames(item, field.item?.fields ?? [], `${path}${field.key}[${index}].`))
      })
    }
  }
  return unknown
}

function createFieldValue(field: EditorField): unknown {
  if (field.kind === "array") return []
  if (field.kind === "resourceTarget") return { url: "" }
  if (field.kind === "resourceLink") return ""
  if (field.kind === "localized") return { ja: "", en: "" }
  if (field.kind === "object") {
    const value: RecordValue = {}
    for (const child of field.fields ?? []) {
      if (child.required && child.kind !== "resourceTarget") value[child.key] = createFieldValue(child)
      if (child.kind === "resourceTarget") value.url = ""
    }
    return value
  }
  return field.kind === "select" ? field.options?.[0] ?? "" : ""
}

function FieldEditor({ field, path, record, onChange, activityIds }: {
  field: EditorField
  path: string
  record: RecordValue
  onChange: (next: RecordValue) => void
  activityIds?: string[]
}) {
  const value = field.kind === "resourceTarget" ? record : record[field.key]
  const name = field.kind === "resourceTarget"
    ? `${path ? `${path}.` : ""}url / links`
    : `${path ? `${path}.` : ""}${field.key}`
  const change = (next: unknown) => {
    const updated = { ...record }
    if (next === undefined || (next === "" && !field.required)) delete updated[field.key]
    else updated[field.key] = next
    onChange(updated)
  }
  const label = <span>{name} <em className={field.required ? "required" : "optional"}>{field.required ? "required" : "optional"}</em></span>

  if (field.kind === "resourceTarget") {
    const many = Array.isArray(record.links)
    const target = many ? record.links : record.url
    return <div className="resource-complex-field">
      <div className="resource-field-heading"><strong>{label}</strong>
        <span className="resource-mode-buttons">
          <button type="button" className={!many ? "selected" : ""} onClick={() => {
            const next = { ...record }
            delete next.links
            next.url = Array.isArray(target) ? (typeof target[0] === "string" ? target[0] : isRecord(target[0]) ? target[0].url ?? "" : "") : target ?? ""
            onChange(next)
          }}>url</button>
          <button type="button" className={many ? "selected" : ""} onClick={() => {
            const next = { ...record }
            delete next.url
            next.links = Array.isArray(target) ? target : target ? [target] : []
            onChange(next)
          }}>links[]</button>
        </span>
      </div>
      {many ? <FieldEditor field={{ key: "links", kind: "array", required: true, item: { key: "links[]", kind: "resourceLink" } }} path={path} record={record} onChange={onChange} />
        : <label className="form-field"><span>{path ? `${path}.` : ""}url <em className="required">required</em></span><input type="url" value={typeof record.url === "string" ? record.url : ""} onChange={event => onChange({ ...record, url: event.target.value })} /></label>}
    </div>
  }

  if (field.kind === "array") {
    const items = Array.isArray(value) ? value : []
    return <div className="resource-complex-field">
      <div className="resource-field-heading"><strong>{label}</strong>
        <button type="button" className="quiet-button" onClick={() => change([...items, createFieldValue(field.item!)])}><Plus /> 添加</button>
      </div>
      {items.length === 0 && <p className="empty-copy">尚无项目</p>}
      <div className="card-stack">{items.map((item, index) => <div className="item-card" key={index}>
        <div className="item-toolbar"><strong>{name}[{index}]</strong><span>
          <button type="button" disabled={index === 0} aria-label="向上移动" onClick={() => { const next = [...items]; [next[index - 1], next[index]] = [next[index], next[index - 1]]; change(next) }}><ChevronUp /></button>
          <button type="button" disabled={index === items.length - 1} aria-label="向下移动" onClick={() => { const next = [...items]; [next[index + 1], next[index]] = [next[index], next[index + 1]]; change(next) }}><ChevronDown /></button>
          <button type="button" className="danger-icon" aria-label="删除" onClick={() => change(items.length === 1 && !field.required ? undefined : items.filter((_, itemIndex) => index !== itemIndex))}><Trash2 /></button>
        </span></div>
        {field.item?.kind === "resourceLink" ? <ResourceLinkEditor value={item} path={`${name}[${index}]`} onChange={nextValue => change(items.map((current, itemIndex) => itemIndex === index ? nextValue : current))} />
          : field.item?.kind === "object" ? <div className="resource-fields">{field.item.fields?.map(child => <FieldEditor key={child.key} field={child} path={`${name}[${index}]`} record={isRecord(item) ? item : {}} onChange={nextValue => change(items.map((current, itemIndex) => itemIndex === index ? nextValue : current))} />)}</div> : null}
      </div>)}</div>
    </div>
  }

  if (field.kind === "object") {
    return <div className="resource-complex-field">
      <div className="resource-field-heading"><strong>{label}</strong>
        {value === undefined ? <button type="button" className="quiet-button" onClick={() => change(createFieldValue(field))}><Plus /> 添加</button>
          : !field.required && <button type="button" className="quiet-button" onClick={() => change(undefined)}><Trash2 /> 移除</button>}
      </div>
      {value !== undefined && <div className="nested-card resource-fields">{field.fields?.map(child => <FieldEditor key={child.key} field={child} path={name} record={isRecord(value) ? value : {}} onChange={change} />)}</div>}
    </div>
  }

  if (field.kind === "localized" || field.kind === "archiveText") {
    const plain = field.kind === "archiveText" && (typeof value === "string" || value === undefined)
    const localized = isRecord(value) ? value : {}
    return <fieldset className="localized-field resource-localized-field"><legend>{label}</legend>
      {field.kind === "archiveText" && <div className="resource-mode-buttons resource-text-mode">
        <button type="button" className={plain ? "selected" : ""} onClick={() => change(localizedLabel(value))}>single text</button>
        <button type="button" className={!plain ? "selected" : ""} onClick={() => change(typeof value === "string" ? { ja: value, en: "" } : value ?? { ja: "", en: "" })}>ja / en</button>
      </div>}
      {plain ? <textarea rows={field.multiline ? 3 : 1} className="resource-text-input" value={typeof value === "string" ? value : ""} onChange={event => change(event.target.value)} />
        : <div className="localized-inputs">{(["ja", "en"] as const).map(lang => <label key={lang}><span>{name}.{lang}</span>
          {field.multiline ? <textarea rows={3} value={typeof localized[lang] === "string" ? localized[lang] : ""} onChange={event => {
            const next = { ...localized, [lang]: event.target.value }
            change(!field.required && !next.ja && !next.en ? undefined : next)
          }} /> : <input value={typeof localized[lang] === "string" ? localized[lang] : ""} onChange={event => {
            const next = { ...localized, [lang]: event.target.value }
            change(!field.required && !next.ja && !next.en ? undefined : next)
          }} />}
        </label>)}</div>}
    </fieldset>
  }

  return <label className="form-field">{label}
    {field.kind === "select" ? <span className="select-wrap"><select value={typeof value === "string" ? value : ""} onChange={event => change(event.target.value)}>
      {!field.required && <option value="">(omit)</option>}
      {field.options?.map(option => <option key={option} value={option}>{option}</option>)}
    </select><ChevronDown /></span>
      : field.key === "activityId" && activityIds ? <><input list="activity-ids" value={typeof value === "string" ? value : ""} placeholder={field.placeholder} onChange={event => change(event.target.value)} /></>
      : field.multiline ? <textarea rows={3} value={typeof value === "string" ? value : ""} onChange={event => change(event.target.value)} />
        : <input type={field.kind === "url" ? "url" : "text"} placeholder={field.placeholder} value={typeof value === "string" ? value : ""} onChange={event => change(event.target.value)} />}
  </label>
}

function ResourceLinkEditor({ value, path, onChange }: { value: unknown; path: string; onChange: (next: unknown) => void }) {
  const objectMode = isRecord(value)
  const details = objectMode ? value : { url: typeof value === "string" ? value : "" }
  return <div className="resource-link-editor">
    <div className="resource-mode-buttons resource-text-mode">
      <button type="button" className={!objectMode ? "selected" : ""} onClick={() => onChange(String(details.url ?? ""))}>URL only</button>
      <button type="button" className={objectMode ? "selected" : ""} onClick={() => onChange(details)}>URL + details</button>
    </div>
    {objectMode ? <div className="resource-fields">{[
      { key: "url", kind: "url", required: true },
      { key: "date", kind: "text", format: "date", placeholder: "YYYY-MM-DD" },
      { key: "label", kind: "archiveText" },
      { key: "platform", kind: "select", options: ["x", "instagram", "youtube", "web", "other"] },
      { key: "status", kind: "select", options: ["available", "expired"] },
    ].map(field => <FieldEditor key={field.key} field={field as EditorField} path={path} record={details} onChange={onChange} />)}</div>
      : <label className="form-field"><span>{path} <em className="required">required</em></span><input type="url" value={typeof value === "string" ? value : ""} onChange={event => onChange(event.target.value)} /></label>}
  </div>
}

async function fetchEntries(key: ResourceDocumentKey): Promise<ResourceResponse> {
  const response = await fetch(`/__activity-editor/data/${key}`, { cache: "no-store" })
  const result = await response.json() as ResourceResponse
  if (!response.ok) throw new Error(result.error ?? "读取失败")
  return result
}

export default function ResourceEditorApp({ documentKey, active }: { documentKey: ResourceDocumentKey; active: boolean }) {
  const schema = RESOURCE_EDITOR_DOCUMENTS[documentKey]
  const [entries, setEntries] = useState<RecordValue[]>([])
  const [savedEntries, setSavedEntries] = useState<RecordValue[]>([])
  const [revision, setRevision] = useState("")
  const [activityIds, setActivityIds] = useState<string[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [showYaml, setShowYaml] = useState(false)
  const dirty = JSON.stringify(entries) !== JSON.stringify(savedEntries)
  const selected = entries[selectedIndex]
  const unknownFields = selected ? unknownFieldNames(selected, schema.fields) : []
  const issues = useMemo(() => validateResourceDocument(documentKey, entries, documentKey === "activity-resources" ? new Set(activityIds) : undefined), [documentKey, entries, activityIds])
  const selectedIssues = issues.filter(issue => issue.path === `${documentKey}[${selectedIndex}]` || issue.path.startsWith(`${documentKey}[${selectedIndex}].`))
  const visibleEntries = entries.map((entry, index) => ({ entry, index })).filter(({ entry }) =>
    [localizedLabel(entry.title), String(entry.id ?? ""), String(entry.activityId ?? ""), String(entry.date ?? entry.publicationDate ?? "")]
      .join(" ").toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()))

  useEffect(() => {
    let cancelled = false
    void fetchEntries(documentKey).then(payload => {
      if (cancelled) return
      setEntries(payload.entries)
      setSavedEntries(structuredClone(payload.entries))
      setRevision(payload.revision)
      setActivityIds(payload.activityIds ?? [])
      setSelectedIndex(0)
    }).catch(error => { if (!cancelled) setMessage(error instanceof Error ? error.message : "读取失败") })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [documentKey])

  useEffect(() => {
    if (dirty || loading || saving || !revision) return
    let cancelled = false
    const refresh = async () => {
      try {
        const payload = await fetchEntries(documentKey)
        if (!cancelled) setActivityIds(payload.activityIds ?? [])
        if (cancelled || payload.revision === revision) return
        setEntries(payload.entries)
        setSavedEntries(structuredClone(payload.entries))
        setRevision(payload.revision)
        setActivityIds(payload.activityIds ?? [])
        setSelectedIndex(index => Math.min(index, Math.max(0, payload.entries.length - 1)))
        setMessage("磁盘内容已更新，自动载入最新版本。")
      } catch { /* Manual reload and save surface errors. */ }
    }
    const onVisible = () => { if (document.visibilityState === "visible") void refresh() }
    const interval = window.setInterval(() => void refresh(), AUTO_REFRESH_INTERVAL_MS)
    window.addEventListener("focus", refresh)
    document.addEventListener("visibilitychange", onVisible)
    return () => { cancelled = true; window.clearInterval(interval); window.removeEventListener("focus", refresh); document.removeEventListener("visibilitychange", onVisible) }
  }, [documentKey, dirty, loading, revision, saving])

  useEffect(() => {
    if (!active || loading || !revision) return
    let cancelled = false
    void fetchEntries(documentKey).then(payload => {
      if (cancelled) return
      setActivityIds(payload.activityIds ?? [])
      if (dirty || payload.revision === revision) return
      setEntries(payload.entries)
      setSavedEntries(structuredClone(payload.entries))
      setRevision(payload.revision)
      setSelectedIndex(index => Math.min(index, Math.max(0, payload.entries.length - 1)))
      setMessage("磁盘内容已更新，自动载入最新版本。")
    }).catch(() => { /* Save or manual reload surfaces errors. */ })
    return () => { cancelled = true }
  }, [active, documentKey])

  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault() }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  const load = async () => {
    if (dirty && !window.confirm("放弃尚未保存的修改并载入磁盘版本吗？")) return
    setLoading(true)
    try {
      const payload = await fetchEntries(documentKey)
      setEntries(payload.entries)
      setSavedEntries(structuredClone(payload.entries))
      setRevision(payload.revision)
      setActivityIds(payload.activityIds ?? [])
      setSelectedIndex(index => Math.min(index, Math.max(0, payload.entries.length - 1)))
      setMessage("")
    } catch (error) { setMessage(error instanceof Error ? error.message : "读取失败") }
    finally { setLoading(false) }
  }

  const save = async () => {
    if (issues.length) return
    setSaving(true)
    try {
      const latest = await fetchEntries(documentKey)
      if (latest.revision !== revision) throw new Error("磁盘文件在编辑期间发生变化。当前输入仍在表单中；请先比较差异，确认后再重新载入，避免覆盖他人的修改。")
      const response = await fetch(`/__activity-editor/data/${documentKey}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries, revision: latest.revision }),
      })
      const payload = await response.json() as { revision?: string; error?: string }
      if (!response.ok || !payload.revision) throw new Error(payload.error ?? "保存失败")
      setRevision(payload.revision)
      setSavedEntries(structuredClone(entries))
      setMessage(`已安全写入 src/data/${schema.filename}`)
    } catch (error) { setMessage(error instanceof Error ? error.message : "保存失败") }
    finally { setSaving(false) }
  }

  const updateSelected = (next: RecordValue) => {
    setMessage("")
    setEntries(current => current.map((entry, index) => index === selectedIndex ? next : entry))
  }
  const add = () => { setEntries(current => [...current, schema.create()]); setSelectedIndex(entries.length); setMessage("") }
  const duplicate = () => { if (!selected) return; setEntries(current => [...current.slice(0, selectedIndex + 1), structuredClone(selected), ...current.slice(selectedIndex + 1)]); setSelectedIndex(selectedIndex + 1); setMessage("") }
  const remove = () => {
    if (!selected || !window.confirm("删除当前条目吗？保存前可重新载入撤销。")) return
    setEntries(current => current.filter((_, index) => index !== selectedIndex))
    setSelectedIndex(Math.min(selectedIndex, entries.length - 2))
    setMessage("")
  }

  return <div className="editor-shell">
    <header className="editor-header"><div><p>LOCAL CONTENT TOOL</p><h1>{schema.label} YAML 编辑器</h1><span>{schema.description}</span></div>
      <div className="header-actions">
        <button type="button" className="reload-button" disabled={loading} onClick={() => void load()}><RefreshCw /> 载入磁盘最新版本</button>
        <button type="button" className="primary-button" disabled={!dirty || saving || issues.length > 0} onClick={() => void save()}><Save /> {saving ? "保存中…" : "保存 YAML"}</button>
      </div>
    </header>
    <div className="status-bar"><span className={dirty ? "dirty" : "saved"}>{dirty ? "有未保存修改" : "内容已同步"}</span><span className={issues.length ? "errors" : "valid"}>{issues.length ? `${issues.length} 个错误` : "校验通过"}</span><strong>src/data/{schema.filename}</strong></div>
    <main className="editor-layout"><aside className="activity-sidebar">
      <div className="sidebar-tools"><label className="search-field"><Search /><input value={query} placeholder="搜索标题、ID 或日期" onChange={event => setQuery(event.target.value)} /></label></div>
      <div className="sidebar-title"><span>{visibleEntries.length} / {entries.length} 条记录</span><button type="button" disabled={loading} onClick={add}><Plus /> 新建</button></div>
      <nav className="activity-list" aria-label="记录列表">{visibleEntries.map(({ entry, index }) => <button type="button" key={index} className={index === selectedIndex ? "active" : ""} onClick={() => setSelectedIndex(index)}>
        <span><strong>{localizedLabel(entry.title) || "未命名记录"}</strong><small>{String(entry.activityId ?? entry.id ?? entry.date ?? entry.publicationDate ?? `#${index + 1}`)}</small></span>
        {issues.some(issue => issue.path.startsWith(`${documentKey}[${index}]`)) && <AlertCircle className="error-icon" />}
      </button>)}</nav>
    </aside><section className="editor-content">
      {loading ? <div className="center-state"><RefreshCw className="spin" /> 正在读取 YAML…</div> : selected ? <>
        <div className="record-heading"><div><span>{schema.label}</span><h2>{localizedLabel(selected.title) || "未命名记录"}</h2><code>{String(selected.id ?? selected.activityId ?? `#${selectedIndex + 1}`)}</code></div>
          <div><button type="button" className="secondary-button" onClick={duplicate}><Copy /> 复制</button><button type="button" className="danger-button" onClick={remove}><Trash2 /> 删除</button></div>
        </div>
        <section className="editor-section"><div className="section-heading"><div><h2>记录字段</h2><p>字段名称对应 YAML；optional 留空时会省略。嵌套项目可添加、删除和调整顺序。</p></div></div>
          {documentKey === "activity-resources" && <datalist id="activity-ids">{activityIds.map(id => <option value={id} key={id} />)}</datalist>}
          <div className="resource-fields">{schema.fields.map(field => <FieldEditor key={field.key} field={field} path="" record={selected} onChange={updateSelected} activityIds={activityIds} />)}</div>
        </section>
        {unknownFields.length > 0 && <section className="editor-section warning-section"><h2>尚未配置的字段</h2><p>这些字段会原样保留，但尚无专用输入框：{unknownFields.join(", ")}</p></section>}
        <section className="editor-section yaml-section"><button type="button" className="yaml-toggle" onClick={() => setShowYaml(value => !value)}><FileCode2 /> YAML 预览 {showYaml ? <ChevronUp /> : <ChevronDown />}</button>{showYaml && <pre>{stringify(selected, { lineWidth: 0, defaultStringType: "QUOTE_DOUBLE" })}</pre>}</section>
      </> : <div className="center-state">请选择或新建一条记录</div>}
    </section></main>
    {(message || selectedIssues.length > 0) && <aside className="notification-stack" aria-live="polite" aria-label="编辑器通知">
      {message && <div className="message-toast">{message}</div>}
      {selectedIssues.length > 0 && <div className="issue-panel"><div className="issue-panel-heading"><AlertCircle /><strong>当前条目有 {selectedIssues.length} 条校验提示</strong></div><div className="issue-list">{selectedIssues.map((issue, index) => <div className="error" key={`${issue.path}-${index}`}><AlertCircle /><span><strong>{issue.path.replace(`${documentKey}[${selectedIndex}].`, "")}</strong>{issue.message}</span></div>)}</div></div>}
    </aside>}
  </div>
}

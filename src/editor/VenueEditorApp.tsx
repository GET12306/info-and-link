import { useEffect, useMemo, useRef, useState } from "react"
import { AlertCircle, Copy, ExternalLink, Plus, RefreshCw, Save, Search, Trash2 } from "lucide-react"
import { parseDocument, stringify } from "yaml"
import { isRecord } from "../utils/contentValidation"
import { useEditorAutoRefresh, useUnsavedChanges } from "./useEditorAutoRefresh"
import { validateVenues } from "./venueValidation"

type VenueRecord = Record<string, unknown>

interface VenueResponse {
  venues: VenueRecord[]
  defaults?: Record<string, unknown>
  lastVerified?: string
  revision: string
  modifiedAt: string
  path: string
  error?: string
}

const API_PATH = "/__activity-editor/venues"

function venueYaml(venue: VenueRecord | undefined) {
  return venue
    ? stringify(venue, { lineWidth: 0, defaultKeyType: "PLAIN", defaultStringType: "QUOTE_DOUBLE" })
    : ""
}

function localizedName(value: unknown) {
  if (!isRecord(value)) return ""
  return typeof value.ja === "string" && value.ja
    ? value.ja
    : typeof value.en === "string" ? value.en : ""
}

function searchableText(venue: VenueRecord) {
  const values: string[] = [typeof venue.id === "string" ? venue.id : ""]
  for (const key of ["name", "formalName", "formerName", "aliases"] as const) {
    const value = venue[key]
    if (!isRecord(value)) continue
    for (const item of Object.values(value)) {
      if (typeof item === "string") values.push(item)
      if (Array.isArray(item)) values.push(...item.filter((alias): alias is string => typeof alias === "string"))
    }
  }
  return values.join(" ").toLocaleLowerCase()
}

function nextUniqueId(baseId: string, venues: VenueRecord[]) {
  const normalized = baseId.replace(/-copy(?:-\d+)?$/, "") || "new-venue"
  const used = new Set(venues.map(venue => String(venue.id ?? "")))
  let candidate = `${normalized}-copy`
  let suffix = 2
  while (used.has(candidate)) candidate = `${normalized}-copy-${suffix++}`
  return candidate
}

function createVenue(id = "new-venue"): VenueRecord {
  return {
    id,
    name: { ja: "", en: "" },
    address: {
      region: { ja: "", en: "" },
      locality: { ja: "", en: "" },
      street: { ja: "", en: "" },
    },
    officialUrl: "",
    sources: [{ label: "", url: "", covers: ["name", "address"] }],
  }
}

async function fetchVenues() {
  const response = await fetch(API_PATH, { cache: "no-store" })
  const payload = await response.json() as VenueResponse
  if (!response.ok) throw new Error(payload.error ?? "读取失败")
  return payload
}

export default function VenueEditorApp({ active = true }: { active?: boolean }) {
  const [venues, setVenues] = useState<VenueRecord[]>([])
  const [savedVenues, setSavedVenues] = useState<VenueRecord[]>([])
  const [defaults, setDefaults] = useState<Record<string, unknown>>({})
  const [lastVerified, setLastVerified] = useState("")
  const [revision, setRevision] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [query, setQuery] = useState("")
  const [yamlDraft, setYamlDraft] = useState("")
  const [yamlError, setYamlError] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const savingRef = useRef(false)

  const selectedVenue = venues[selectedIndex]
  const issues = useMemo(() => validateVenues(venues), [venues])
  const selectedIssues = issues.filter(issue =>
    issue.path === `venues[${selectedIndex}]` || issue.path.startsWith(`venues[${selectedIndex}].`)
  )
  const errorCount = issues.filter(issue => issue.severity === "error").length + (yamlError ? 1 : 0)
  const dirty = JSON.stringify(venues) !== JSON.stringify(savedVenues) || Boolean(yamlError)
  const visibleVenues = venues.map((venue, index) => ({ venue, index })).filter(({ venue }) =>
    searchableText(venue).includes(query.trim().toLocaleLowerCase()))

  const applyPayload = (payload: VenueResponse, messageText = "") => {
    const nextIndex = Math.min(selectedIndex, Math.max(0, payload.venues.length - 1))
    setVenues(payload.venues)
    setSavedVenues(structuredClone(payload.venues))
    setDefaults(payload.defaults ?? {})
    setLastVerified(payload.lastVerified ?? "")
    setRevision(payload.revision)
    setSelectedIndex(nextIndex)
    setYamlDraft(venueYaml(payload.venues[nextIndex]))
    setYamlError("")
    setMessage(messageText)
  }

  const load = async (confirmDirty = false) => {
    if (savingRef.current) return
    if (confirmDirty && dirty && !window.confirm("放弃尚未保存的场馆修改并重新载入吗？")) return
    setLoading(true)
    try {
      applyPayload(await fetchVenues())
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "读取失败")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])
  useEditorAutoRefresh({
    documentKey: "venues", active, dirty, loading, saving, revision,
    fetchLatest: fetchVenues,
    onRefresh: (payload) => {
      if (payload.revision === revision) return
      applyPayload(payload, "检测到磁盘内容更新，已自动载入最新版本。")
    },
  })
  useUnsavedChanges(dirty)

  const selectVenue = (index: number) => {
    if (yamlError && !window.confirm("当前场馆的 YAML 尚未解析成功。切换后会丢弃这段无效输入，仍要继续吗？")) return
    setSelectedIndex(index)
    setYamlDraft(venueYaml(venues[index]))
    setYamlError("")
    setMessage("")
  }

  const updateYaml = (draft: string) => {
    setYamlDraft(draft)
    setMessage("")
    try {
      const document = parseDocument(draft)
      if (document.errors.length) throw new Error(document.errors[0].message)
      const next = document.toJS() as unknown
      if (!isRecord(next)) throw new Error("单个场馆必须是 YAML 对象")
      setVenues(current => current.map((venue, index) => index === selectedIndex ? next : venue))
      setYamlError("")
    } catch (error) {
      setYamlError(error instanceof Error ? error.message : "YAML 无法解析")
    }
  }

  const save = async () => {
    if (savingRef.current || loading || errorCount > 0) return
    savingRef.current = true
    setSaving(true)
    setMessage("")
    try {
      const latest = await fetchVenues()
      if (latest.revision !== revision) {
        throw new Error("venues.yaml 在编辑期间发生变化。当前输入仍在编辑器中；请重新载入后再保存，避免覆盖其他修改。")
      }
      const response = await fetch(API_PATH, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venues, revision: latest.revision }),
      })
      const payload = await response.json() as { revision?: string; error?: string }
      if (!response.ok || !payload.revision) throw new Error(payload.error ?? "保存失败")
      setRevision(payload.revision)
      setSavedVenues(structuredClone(venues))
      setMessage("已安全写入 src/data/venues.yaml")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败")
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  const addVenue = () => {
    const id = venues.some(venue => venue.id === "new-venue") ? nextUniqueId("new-venue", venues) : "new-venue"
    const next = createVenue(id)
    setVenues(current => [...current, next])
    setSelectedIndex(venues.length)
    setYamlDraft(venueYaml(next))
    setYamlError("")
    setMessage("")
  }

  const duplicateVenue = () => {
    if (!selectedVenue) return
    const next = structuredClone({
      ...selectedVenue,
      id: nextUniqueId(String(selectedVenue.id ?? "new-venue"), venues),
    })
    setVenues(current => [
      ...current.slice(0, selectedIndex + 1),
      next,
      ...current.slice(selectedIndex + 1),
    ])
    setSelectedIndex(selectedIndex + 1)
    setYamlDraft(venueYaml(next))
    setYamlError("")
    setMessage("")
  }

  const removeVenue = () => {
    if (!selectedVenue || !window.confirm(`删除“${localizedName(selectedVenue.name) || selectedVenue.id || "当前场馆"}”吗？保存前仍可重新载入撤销。`)) return
    const nextVenues = venues.filter((_, index) => index !== selectedIndex)
    const nextIndex = Math.min(selectedIndex, Math.max(0, nextVenues.length - 1))
    setVenues(nextVenues)
    setSelectedIndex(nextIndex)
    setYamlDraft(venueYaml(nextVenues[nextIndex]))
    setYamlError("")
    setMessage("")
  }

  const defaultSummary = [defaults.countryCode, defaults.timeZone].filter(Boolean).join(" · ")
  const officialUrl = typeof selectedVenue?.officialUrl === "string" ? selectedVenue.officialUrl : ""

  return <div className="editor-shell">
    <header className="editor-header">
      <div><p>LOCAL CONTENT TOOL</p><h1>场馆 YAML 编辑器</h1><span>浏览、搜索并维护所有场馆资料</span></div>
      <div className="header-actions">
        {officialUrl && <a href={officialUrl} target="_blank" rel="noreferrer"><ExternalLink /> 场馆官网</a>}
        <button type="button" className="reload-button" onClick={() => void load(true)} disabled={loading || saving}><RefreshCw /> 载入磁盘最新版本</button>
        <button type="button" className="primary-button" onClick={() => void save()} disabled={loading || !dirty || saving || errorCount > 0}><Save /> {saving ? "保存中…" : "保存 YAML"}</button>
      </div>
    </header>

    <div className="status-bar">
      <span className={dirty ? "dirty" : "saved"}>{dirty ? "有未保存修改" : "内容已同步"}</span>
      <span className={errorCount ? "errors" : "valid"}>{errorCount ? `${errorCount} 个错误` : "校验通过"}</span>
      {defaultSummary && <strong>默认值：{defaultSummary}</strong>}
      {lastVerified && <strong>资料核对：{lastVerified}</strong>}
    </div>

    <main className="editor-layout">
      <aside className="activity-sidebar">
        <div className="sidebar-tools">
          <label className="search-field"><Search /><input value={query} placeholder="按名称、别名或 ID 搜索" onChange={event => setQuery(event.target.value)} /></label>
        </div>
        <div className="sidebar-title"><span>{visibleVenues.length} / {venues.length} 个场馆</span><button type="button" onClick={addVenue}><Plus /> 新建</button></div>
        <nav className="activity-list" aria-label="场馆列表">
          {visibleVenues.map(({ venue, index }) => {
            const hasError = issues.some(issue => issue.severity === "error" && issue.path.startsWith(`venues[${index}]`))
            return <button type="button" key={`${String(venue.id)}-${index}`} className={index === selectedIndex ? "active" : ""} onClick={() => selectVenue(index)}>
              <span><strong>{localizedName(venue.name) || "未命名场馆"}</strong><small>{String(venue.id ?? "缺少 ID")}</small></span>
              {hasError && <AlertCircle className="error-icon" />}
            </button>
          })}
        </nav>
      </aside>

      <section className="editor-content">
        {loading ? <div className="center-state"><RefreshCw className="spin" /> 正在读取 YAML…</div> : !selectedVenue ? (
          <div className="center-state">请选择或新建一个场馆</div>
        ) : <>
          <div className="record-heading">
            <div><span>Venue</span><h2>{localizedName(selectedVenue.name) || "未命名场馆"}</h2><code>{String(selectedVenue.id ?? "缺少 ID")}</code></div>
            <div>
              <button type="button" className="secondary-button" onClick={duplicateVenue}><Copy /> 复制</button>
              <button type="button" className="danger-button" onClick={removeVenue}><Trash2 /> 删除</button>
            </div>
          </div>

          <section className="editor-section venue-yaml-section">
            <div className="section-heading"><div><h2>场馆记录</h2><p>可编辑该场馆的全部字段。日本场馆通常无需重复填写 countryCode 与 timeZone；字符串、数组和嵌套对象均使用 YAML 语法。</p></div></div>
            <label className="form-field">
              <span>单个场馆的 YAML <em className="required">required</em></span>
              <textarea className="venue-yaml-input" spellCheck={false} value={yamlDraft} onChange={event => updateYaml(event.target.value)} />
              <small>至少需要 id、name、address、officialUrl 和 sources。此处用于编辑数据，新增注释或只调整排版不会写入文件。</small>
            </label>
            {yamlError && <p className="inline-error"><AlertCircle /> {yamlError}</p>}
          </section>
        </>}
      </section>
    </main>

    {(message || selectedIssues.length > 0) && <aside className="notification-stack" aria-live="polite" aria-label="编辑器通知">
      {message && <div className="message-toast">{message}</div>}
      {selectedIssues.length > 0 && <div className="issue-panel">
        <div className="issue-panel-heading"><AlertCircle /><strong>当前场馆有 {selectedIssues.length} 条校验提示</strong></div>
        <div className="issue-list">{selectedIssues.map((issue, index) => <div key={`${issue.path}-${index}`} className={issue.severity}>
          <AlertCircle /><span><strong>{issue.path.replace(`venues[${selectedIndex}].`, "")}</strong>{issue.message}</span>
        </div>)}</div>
      </div>}
    </aside>}
  </div>
}

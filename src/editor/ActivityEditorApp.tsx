import { useEffect, useMemo, useRef, useState } from "react"
import { AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Copy, ExternalLink, FileCode2, Plus, RefreshCw, Save, Search, Trash2 } from "lucide-react"
import { stringify } from "yaml"
import type { LocalizedText } from "../types"
import { ACTIVITY_EDITOR_KNOWN_FIELDS, ACTIVITY_EDITOR_SECTIONS, type ActivityEditorScalarKey } from "./activityEditorSchema"
import { validateActivities } from "./activityValidation"
import { mergeActivityDraft } from "./activityDraftMerge"
import { VENUES_BY_ID } from "../data/venues"
import { useEditorAutoRefresh, useUnsavedChanges } from "./useEditorAutoRefresh"
import { EMPTY_LOCALIZED_TEXT, setOptional, type EditorActivity } from "./activityEditorValues"
import { LocalizedEditor, ScalarField, VenueEditor } from "./ActivityEditorFields"
import { PerformanceEditor, RecurrenceEditor } from "./ActivityScheduleEditor"
import { TicketEditor } from "./ActivityTicketEditor"

interface EditorResponse {
  activities: EditorActivity[]
  revision: string
  modifiedAt: string
  path: string
}

const API_PATH = "/__activity-editor/activities"
const VENUE_IDS = new Set(VENUES_BY_ID.keys())

async function fetchEditorData() {
  const response = await fetch(API_PATH, { cache: "no-store" })
  const payload = await response.json() as EditorResponse & { error?: string }
  if (!response.ok) throw new Error(payload.error ?? "读取失败")
  return payload
}

function nextUniqueId(baseId: string, activities: EditorActivity[]) {
  const normalized = baseId.replace(/-copy(?:-\d+)?$/, "") || "new-activity"
  const used = new Set(activities.map((activity) => activity.id))
  let candidate = `${normalized}-copy`
  let suffix = 2
  while (used.has(candidate)) candidate = `${normalized}-copy-${suffix++}`
  return candidate
}

export default function ActivityEditorApp({ active = true }: { active?: boolean }) {
  const [activities, setActivities] = useState<EditorActivity[]>([])
  const [savedActivities, setSavedActivities] = useState<EditorActivity[]>([])
  const [revision, setRevision] = useState("")
  const [selectedId, setSelectedId] = useState("")
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const savingRef = useRef(false)
  const loadRequest = useRef(0)
  const [message, setMessage] = useState("")
  const [showYaml, setShowYaml] = useState(false)

  const dirty = JSON.stringify(activities) !== JSON.stringify(savedActivities)
  const selectedIndex = activities.findIndex((activity) => activity.id === selectedId)
  const selectedActivity = activities[selectedIndex]
  const issues = useMemo(() => validateActivities(activities, VENUE_IDS), [activities])
  const errorCount = issues.filter((issue) => issue.severity === "error").length
  const selectedIssues = selectedIndex < 0 ? [] : issues.filter((issue) =>
    issue.path === `activities[${selectedIndex}]` || issue.path.startsWith(`activities[${selectedIndex}].`)
  )

  const filteredActivities = activities.filter((activity) => {
    const normalizedQuery = query.trim().toLowerCase()
    const matchesQuery = !normalizedQuery || [activity.id, activity.title?.ja, activity.title?.en]
      .some((value) => value?.toLowerCase().includes(normalizedQuery))
    return matchesQuery && (!category || activity.category === category)
  })

  const load = async (confirmDirty = false) => {
    if (savingRef.current) return
    if (confirmDirty && dirty && !window.confirm("放弃尚未保存的修改并重新载入吗？")) return
    const request = ++loadRequest.current
    setLoading(true)
    setMessage("")
    try {
      const payload = await fetchEditorData()
      if (request !== loadRequest.current) return
      setActivities(payload.activities)
      setSavedActivities(structuredClone(payload.activities))
      setRevision(payload.revision)
      setSelectedId((current) => payload.activities.some((activity) => activity.id === current)
        ? current
        : payload.activities[0]?.id ?? "")
    } catch (error) {
      if (request === loadRequest.current) setMessage(error instanceof Error ? error.message : "读取失败")
    } finally {
      if (request === loadRequest.current) setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    return () => { loadRequest.current += 1 }
  }, [])
  useEditorAutoRefresh({
    documentKey: "activities", active, dirty, loading, saving, revision,
    fetchLatest: fetchEditorData,
    onRefresh: (payload) => {
      if (payload.revision === revision) return
      setActivities(payload.activities)
      setSavedActivities(structuredClone(payload.activities))
      setRevision(payload.revision)
      setSelectedId((current) => payload.activities.some(activity => activity.id === current)
        ? current : payload.activities[0]?.id ?? "")
      setMessage("检测到磁盘内容更新，已自动载入最新版本。")
    },
  })
  useUnsavedChanges(dirty)

  const updateSelected = (activity: EditorActivity) => {
    setMessage("")
    setActivities((current) => current.map((item, index) => index === selectedIndex ? activity : item))
    if (activity.id !== selectedId) setSelectedId(activity.id)
  }

  const updateScalar = (key: ActivityEditorScalarKey, value: unknown) => {
    if (!selectedActivity) return
    const required = key === "id" || key === "category" || key === "scheduleLabel" || key === "link"
    updateSelected(required
      ? { ...selectedActivity, [key]: value }
      : setOptional(selectedActivity, key, value) as EditorActivity)
  }

  const updateLocalized = (
    key: "title" | "venueNote" | "description",
    value: LocalizedText | undefined
  ) => {
    if (!selectedActivity) return
    updateSelected(key === "title"
      ? { ...selectedActivity, title: value ?? EMPTY_LOCALIZED_TEXT }
      : setOptional(selectedActivity, key, value) as EditorActivity)
  }

  const save = async () => {
    if (savingRef.current || loading) return
    if (errorCount > 0) {
      setMessage(`还有 ${errorCount} 个错误，请修正后再保存。`)
      return
    }
    savingRef.current = true
    setSaving(true)
    setMessage("")
    try {
      const latest = await fetchEditorData()
      const sourceChanged = latest.revision !== revision
      const merged = sourceChanged
        ? mergeActivityDraft(savedActivities, activities, latest.activities)
        : { activities, conflicts: [] }

      if (merged.conflicts.length > 0) {
        const paths = merged.conflicts.slice(0, 3).join(", ")
        const remaining = merged.conflicts.length > 3
          ? ` 等 ${merged.conflicts.length} 处`
          : ""
        throw new Error(`磁盘与当前表单同时修改了 ${paths}${remaining}。当前输入已保留，请先处理这些冲突。`)
      }

      const response = await fetch(API_PATH, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activities: merged.activities,
          revision: latest.revision,
        }),
      })
      const payload = await response.json() as { revision?: string; error?: string }
      if (!response.ok || !payload.revision) throw new Error(payload.error ?? "保存失败")
      setRevision(payload.revision)
      // Reapply edits made while the request was pending onto the saved result.
      setActivities(current => mergeActivityDraft(activities, current, merged.activities).activities)
      setSavedActivities(structuredClone(merged.activities))
      setMessage(sourceChanged
        ? "已合并磁盘最新内容并安全写入 src/data/activities.yaml"
        : "已安全写入 src/data/activities.yaml")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败")
    } finally {
      savingRef.current = false
      setSaving(false)
    }
  }

  const addActivity = () => {
    const id = nextUniqueId("new-activity", activities)
    const activity: EditorActivity = {
      id,
      category: "Event",
      scheduleLabel: "",
      title: { ja: "", en: "" },
      link: "",
    }
    setActivities((current) => [...current, activity])
    setSelectedId(id)
  }

  const duplicateActivity = () => {
    if (!selectedActivity) return
    const id = nextUniqueId(selectedActivity.id, activities)
    const duplicate = structuredClone({ ...selectedActivity, id })
    setActivities((current) => {
      const next = [...current]
      next.splice(selectedIndex + 1, 0, duplicate)
      return next
    })
    setSelectedId(id)
  }

  const removeActivity = () => {
    if (!selectedActivity || !window.confirm(`删除“${selectedActivity.title.ja || selectedActivity.id}”吗？保存前仍可重新载入撤销。`)) return
    const nextActivities = activities.filter((_, index) => index !== selectedIndex)
    setActivities(nextActivities)
    setSelectedId(nextActivities[Math.min(selectedIndex, nextActivities.length - 1)]?.id ?? "")
  }

  const unknownFields = selectedActivity
    ? Object.keys(selectedActivity).filter((key) => !ACTIVITY_EDITOR_KNOWN_FIELDS.has(key))
    : []

  return (
    <div className="editor-shell">
      <header className="editor-header">
        <div>
          <p>LOCAL CONTENT TOOL</p>
          <h1>活动 YAML 编辑器</h1>
          <span>Schema 驱动的基础字段 + 活动领域编辑组件</span>
        </div>
        <div className="header-actions">
          <a href="/#/activities" target="_blank" rel="noreferrer"><ExternalLink /> 网站预览</a>
          <button type="button" className="reload-button" onClick={() => void load(true)} disabled={loading || saving}>
            <RefreshCw /> 载入磁盘最新版本
          </button>
          <button type="button" className="primary-button" onClick={() => void save()} disabled={loading || !dirty || saving || errorCount > 0}>
            <Save /> {saving ? "保存中…" : "保存 YAML"}
          </button>
        </div>
      </header>

      <div className="status-bar">
        <span className={dirty ? "dirty" : "saved"}>{dirty ? "有未保存修改" : "内容已同步"}</span>
        <span className={errorCount ? "errors" : "valid"}>{errorCount ? `${errorCount} 个错误` : "校验通过"}</span>
      </div>

      <main className="editor-layout">
        <aside className="activity-sidebar">
          <div className="sidebar-tools">
            <label className="search-field"><Search /><input value={query} placeholder="搜索标题或 ID" onChange={(event) => setQuery(event.target.value)} /></label>
            <span className="select-wrap">
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="">全部类别</option>
                {["Live", "Musical", "Stage", "Reading", "Event", "Program", "Other"].map((value) => <option key={value}>{value}</option>)}
              </select>
              <ChevronDown aria-hidden="true" />
            </span>
          </div>
          <div className="sidebar-title"><span>{filteredActivities.length} / {activities.length} 条活动</span><button type="button" onClick={addActivity}><Plus /> 新建</button></div>
          <nav className="activity-list" aria-label="活动列表">
            {filteredActivities.map((activity) => {
              const index = activities.indexOf(activity)
              const hasError = issues.some((issue) => issue.severity === "error" && issue.path.startsWith(`activities[${index}]`))
              return (
                <button type="button" key={activity.id} className={activity.id === selectedId ? "active" : ""} onClick={() => setSelectedId(activity.id)}>
                  <span><strong>{activity.title?.ja || "未命名活动"}</strong><small>{activity.id}</small></span>
                  {hasError && <AlertCircle className="error-icon" />}
                </button>
              )
            })}
          </nav>
        </aside>

        <section className="editor-content">
          {loading ? <div className="center-state"><RefreshCw className="spin" /> 正在读取 YAML…</div> : !selectedActivity ? (
            <div className="center-state">请选择或新建一个活动</div>
          ) : (
            <>
              <div className="record-heading">
                <div><span>{selectedActivity.category}</span><h2>{selectedActivity.title.ja || "未命名活动"}</h2><code>{selectedActivity.id}</code></div>
                <div>
                  <button type="button" className="secondary-button" onClick={duplicateActivity}><Copy /> 复制</button>
                  <button type="button" className="danger-button" onClick={removeActivity}><Trash2 /> 删除</button>
                </div>
              </div>

              {ACTIVITY_EDITOR_SECTIONS.slice(0, 1).map((section) => (
                <section className="editor-section" key={section.id}>
                  <div className="section-heading"><div><h2>{section.title}</h2><p>{section.description}</p></div></div>
                  <div className="field-grid">
                    {section.fields.map((field) => <ScalarField key={field.key} field={field} activity={selectedActivity} onChange={updateScalar} />)}
                  </div>
                  <LocalizedEditor label="title" value={selectedActivity.title} required onChange={(value) => updateLocalized("title", value)} />
                  <VenueEditor
                    value={selectedActivity.venueIds}
                    onChange={(value) => updateSelected(setOptional(selectedActivity, "venueIds", value) as EditorActivity)}
                  />
                  <LocalizedEditor label="venueNote" value={selectedActivity.venueNote} onChange={(value) => updateLocalized("venueNote", value)} />
                  <LocalizedEditor label="description" value={selectedActivity.description} multiline onChange={(value) => updateLocalized("description", value)} />
                </section>
              ))}

              {ACTIVITY_EDITOR_SECTIONS.slice(1).map((section) => (
                <section className="editor-section" key={section.id}>
                  <div className="section-heading"><div><h2>{section.title}</h2><p>{section.description}</p></div></div>
                  <div className="field-grid">
                    {section.fields.map((field) => <ScalarField key={field.key} field={field} activity={selectedActivity} onChange={updateScalar} />)}
                  </div>
                </section>
              ))}

              <RecurrenceEditor
                recurrence={selectedActivity.recurrence}
                onChange={(recurrence) => {
                  let next = setOptional(selectedActivity, "recurrence", recurrence) as EditorActivity
                  if (recurrence?.type === "weekly") {
                    next = setOptional(next, "performances", undefined) as EditorActivity
                    next = setOptional(next, "startDate", undefined) as EditorActivity
                    next = setOptional(next, "endDate", undefined) as EditorActivity
                  }
                  updateSelected(next)
                }}
              />
              <PerformanceEditor
                performances={selectedActivity.performances}
                recurrenceType={selectedActivity.recurrence?.type}
                onChange={(performances) => updateSelected(setOptional(selectedActivity, "performances", performances) as EditorActivity)}
              />
              <TicketEditor activity={selectedActivity} onChange={updateSelected} />

              {unknownFields.length > 0 && (
                <section className="editor-section warning-section">
                  <h2>尚未配置的字段</h2>
                  <p>以下字段会原样保留，但当前版本没有专用表单：{unknownFields.join(", ")}</p>
                </section>
              )}

              <section className="editor-section yaml-section">
                <button type="button" className="yaml-toggle" onClick={() => setShowYaml((value) => !value)}>
                  <FileCode2 /> YAML 预览 {showYaml ? <ChevronUp /> : <ChevronDown />}
                </button>
                {showYaml && <pre>{stringify(selectedActivity, { lineWidth: 0, defaultStringType: "QUOTE_DOUBLE" })}</pre>}
              </section>
            </>
          )}
        </section>
      </main>

      {(message || selectedIssues.length > 0) && (
        <aside className="notification-stack" aria-live="polite" aria-label="编辑器通知">
          {message && <div className="message-toast">{message}</div>}
          {selectedIssues.length > 0 && (
            <div className="issue-panel">
              <div className="issue-panel-heading">
                <AlertCircle />
                <strong>当前条目有 {selectedIssues.length} 条校验提示</strong>
              </div>
              <div className="issue-list">
                {selectedIssues.map((issue, index) => (
                  <div key={`${issue.path}-${index}`} className={issue.severity}>
                    {issue.severity === "error" ? <AlertCircle /> : <CheckCircle2 />}
                    <span><strong>{issue.path.replace(`activities[${selectedIndex}].`, "")}</strong>{issue.message}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </aside>
      )}
    </div>
  )
}

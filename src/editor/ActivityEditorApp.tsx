import { useEffect, useMemo, useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  FileCode2,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
} from "lucide-react"
import { stringify } from "yaml"
import type {
  Activity,
  ActivityMilestone,
  ActivityPerformance,
  ActivityRecurrence,
  Language,
  LocalizedText,
  TicketEntry,
  WeeklyActivityRecurrence,
  WeeklyActivityRecurrenceOverride,
} from "../types"
import {
  ACTIVITY_EDITOR_KNOWN_FIELDS,
  ACTIVITY_EDITOR_SECTIONS,
  type ActivityEditorField,
  type ActivityEditorScalarKey,
} from "./activityEditorSchema"
import {
  validateActivities,
  type ActivityValidationIssue,
} from "./activityValidation"
import { mergeActivityDraft } from "./activityDraftMerge"

type EditorActivity = Activity & Record<string, unknown>
type EditorPerformance = ActivityPerformance & Record<string, unknown>
type EditorMilestone = ActivityMilestone & Record<string, unknown>
type EditorTicketEntry = TicketEntry & Record<string, unknown>
type EditorWeeklyOverride = WeeklyActivityRecurrenceOverride & Record<string, unknown>

interface EditorResponse {
  activities: EditorActivity[]
  revision: string
  modifiedAt: string
  path: string
}

const API_PATH = "/__activity-editor/activities"
const EMPTY_LOCALIZED_TEXT: LocalizedText = { ja: "", en: "" }
const AUTO_REFRESH_INTERVAL_MS = 15_000

async function fetchEditorData() {
  const response = await fetch(API_PATH, { cache: "no-store" })
  const payload = await response.json() as EditorResponse & { error?: string }
  if (!response.ok) throw new Error(payload.error ?? "读取失败")
  return payload
}

function setOptional<T extends Record<string, unknown>>(
  value: T,
  key: string,
  nextValue: unknown
) {
  const next: Record<string, unknown> = { ...value }
  if (nextValue === "" || nextValue === undefined || nextValue === false) {
    delete next[key]
  } else {
    next[key] = nextValue
  }
  return next as T
}

function nextUniqueId(baseId: string, activities: EditorActivity[]) {
  const normalized = baseId.replace(/-copy(?:-\d+)?$/, "") || "new-activity"
  const used = new Set(activities.map((activity) => activity.id))
  let candidate = `${normalized}-copy`
  let suffix = 2
  while (used.has(candidate)) candidate = `${normalized}-copy-${suffix++}`
  return candidate
}

function LocalizedEditor({
  label,
  value,
  required = false,
  multiline = false,
  onChange,
}: {
  label: string
  value?: LocalizedText
  required?: boolean
  multiline?: boolean
  onChange: (value: LocalizedText | undefined) => void
}) {
  const current = value ?? EMPTY_LOCALIZED_TEXT
  const update = (language: Language, text: string) => {
    const next = { ...current, [language]: text }
    onChange(!required && !next.ja && !next.en ? undefined : next)
  }

  return (
    <fieldset className="localized-field">
      <legend>
        {label} <span className={required ? "required" : "optional"}>{required ? "required" : "optional"}</span>
      </legend>
      <div className="localized-inputs">
        {(["ja", "en"] as const).map((language) => (
          <label key={language}>
            <span>{label}.{language}</span>
            {multiline ? (
              <textarea
                rows={3}
                value={current[language]}
                onChange={(event) => update(language, event.target.value)}
              />
            ) : (
              <input
                value={current[language]}
                onChange={(event) => update(language, event.target.value)}
              />
            )}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function ScalarField({
  field,
  activity,
  onChange,
}: {
  field: ActivityEditorField
  activity: EditorActivity
  onChange: (key: ActivityEditorScalarKey, value: unknown) => void
}) {
  if (field.input === "checkbox") {
    return (
      <label className="checkbox-field">
        <input
          type="checkbox"
          checked={Boolean(activity[field.key])}
          onChange={(event) => onChange(field.key, event.target.checked)}
        />
        <span>
          <strong>{field.label} <em className={field.required ? "required" : "optional"}>{field.required ? "required" : "optional"}</em></strong>
          {field.description && <small>{field.description}</small>}
        </span>
      </label>
    )
  }

  const value = activity[field.key] ?? ""
  return (
    <label className="form-field">
      <span>
        {field.label} <em className={field.required ? "required" : "optional"}>{field.required ? "required" : "optional"}</em>
      </span>
      {field.input === "select" ? (
        <span className="select-wrap">
          <select
            value={String(value)}
            onChange={(event) => onChange(field.key, event.target.value)}
          >
            {field.options?.map((option) => (
              <option key={option.value || "default"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden="true" />
        </span>
      ) : (
        <input
          type={field.input}
          min={field.input === "number" ? 1 : undefined}
          value={String(value)}
          placeholder={field.placeholder}
          onChange={(event) => onChange(
            field.key,
            field.input === "number"
              ? event.target.value === "" ? "" : Number(event.target.value)
              : event.target.value
          )}
        />
      )}
      {field.description && <small>{field.description}</small>}
    </label>
  )
}

function ItemToolbar({
  label,
  index,
  count,
  onMove,
  onRemove,
}: {
  label: string
  index: number
  count: number
  onMove: (direction: -1 | 1) => void
  onRemove: () => void
}) {
  return (
    <div className="item-toolbar">
      <strong>{label} {index + 1}</strong>
      <span>
        <button type="button" disabled={index === 0} onClick={() => onMove(-1)} aria-label="向上移动">
          <ChevronUp />
        </button>
        <button type="button" disabled={index === count - 1} onClick={() => onMove(1)} aria-label="向下移动">
          <ChevronDown />
        </button>
        <button type="button" className="danger-icon" onClick={onRemove} aria-label="删除">
          <Trash2 />
        </button>
      </span>
    </div>
  )
}

function MilestoneEditor({
  milestones,
  onChange,
}: {
  milestones?: ActivityMilestone[]
  onChange: (milestones: ActivityMilestone[] | undefined) => void
}) {
  const items = (milestones ?? []) as EditorMilestone[]
  const update = (index: number, value: EditorMilestone) => {
    onChange(items.map((item, itemIndex) => itemIndex === index ? value : item))
  }

  return (
    <div className="nested-section">
      <div className="nested-heading">
        <span>performances[].milestones[]（同一场次当天的 HH:mm）</span>
        <button type="button" className="quiet-button" onClick={() => onChange([
          ...items,
          { kind: "doors", at: "" },
        ])}>
          <Plus /> 添加时刻
        </button>
      </div>
      {items.map((milestone, index) => (
        <div className="nested-card" key={index}>
          <ItemToolbar
            label="performances[].milestones[]"
            index={index}
            count={items.length}
            onMove={(direction) => {
              const next = [...items]
              const target = index + direction
              ;[next[index], next[target]] = [next[target], next[index]]
              onChange(next)
            }}
            onRemove={() => {
              const next = items.filter((_, itemIndex) => itemIndex !== index)
              onChange(next.length ? next : undefined)
            }}
          />
          <div className="field-grid three">
            <label className="form-field">
              <span>performances[].milestones[].kind <em className="required">required</em></span>
              <span className="select-wrap">
                <select
                  value={milestone.kind}
                  onChange={(event) => update(index, { ...milestone, kind: event.target.value as ActivityMilestone["kind"] })}
                >
                  <option value="update">update — 内容更新/公开</option>
                  <option value="merch">merch — 物贩</option>
                  <option value="doors">doors — 开场/开放入场</option>
                  <option value="other">other — 其他（需名称）</option>
                </select>
                <ChevronDown aria-hidden="true" />
              </span>
            </label>
            <label className="form-field">
              <span>performances[].milestones[].at <em className="required">required</em></span>
              <input type="text" placeholder="HH:mm" value={milestone.at} onChange={(event) => update(index, { ...milestone, at: event.target.value })} />
            </label>
            <label className="form-field">
              <span>performances[].milestones[].until <em className="optional">optional</em></span>
              <input
                type="text"
                placeholder="HH:mm"
                value={milestone.until ?? ""}
                onChange={(event) => update(index, setOptional(milestone, "until", event.target.value) as EditorMilestone)}
              />
            </label>
          </div>
          <LocalizedEditor
            label="performances[].milestones[].label"
            value={milestone.label}
            required={milestone.kind === "other"}
            onChange={(value) => update(index, setOptional(milestone, "label", value) as EditorMilestone)}
          />
        </div>
      ))}
    </div>
  )
}

const WEEKDAY_OPTIONS = [
  ["monday", "星期一"],
  ["tuesday", "星期二"],
  ["wednesday", "星期三"],
  ["thursday", "星期四"],
  ["friday", "星期五"],
  ["saturday", "星期六"],
  ["sunday", "星期日"],
] as const

function RecurrenceEditor({
  recurrence,
  onChange,
}: {
  recurrence?: ActivityRecurrence
  onChange: (recurrence: ActivityRecurrence | undefined) => void
}) {
  const mode = recurrence?.type ?? "none"
  const weekly = recurrence?.type === "weekly" ? recurrence : undefined
  const overrides = (weekly?.overrides ?? []) as EditorWeeklyOverride[]
  const updateWeekly = (next: WeeklyActivityRecurrence) => onChange(next)

  return (
    <section className="editor-section">
      <div className="section-heading">
        <div>
          <h2>经常性节目</h2>
          <p>每周固定节目按有限范围自动生成；月更或不定期节目只使用手动场次。</p>
        </div>
      </div>
      <div className="field-grid">
        <label className="form-field">
          <span>recurrence.type <em className="optional">optional</em></span>
          <span className="select-wrap">
            <select
              value={mode}
              onChange={(event) => {
                if (event.target.value === "none") onChange(undefined)
                else if (event.target.value === "manual") onChange({ type: "manual" })
                else onChange({
                  type: "weekly",
                  startOn: "",
                  endOn: "",
                  weekday: "friday",
                  startTime: "22:00",
                })
              }}
            >
              <option value="none">(omit) — 非经常性活动</option>
              <option value="manual">manual — 月更/不定期（手动添加日期）</option>
              <option value="weekly">weekly — 每周固定（范围内自动生成）</option>
            </select>
            <ChevronDown aria-hidden="true" />
          </span>
        </label>
      </div>

      {weekly && (
        <>
          <div className="field-grid four recurrence-fields">
            <label className="form-field">
              <span>recurrence.startOn <em className="required">required</em></span>
              <input type="text" placeholder="YYYY-MM-DD" value={weekly.startOn} onChange={(event) => updateWeekly({ ...weekly, startOn: event.target.value })} />
            </label>
            <label className="form-field">
              <span>recurrence.endOn <em className="required">required</em></span>
              <input type="text" placeholder="YYYY-MM-DD" value={weekly.endOn} onChange={(event) => updateWeekly({ ...weekly, endOn: event.target.value })} />
            </label>
            <label className="form-field">
              <span>recurrence.weekday <em className="required">required</em></span>
              <span className="select-wrap">
                <select value={weekly.weekday} onChange={(event) => updateWeekly({
                  ...weekly,
                  weekday: event.target.value as WeeklyActivityRecurrence["weekday"],
                })}>
                  {WEEKDAY_OPTIONS.map(([value, label]) => <option value={value} key={value}>{value} — {label}</option>)}
                </select>
                <ChevronDown aria-hidden="true" />
              </span>
            </label>
            <label className="form-field">
              <span>recurrence.startTime <em className="required">required</em></span>
              <input type="text" placeholder="HH:mm" value={weekly.startTime} onChange={(event) => updateWeekly({ ...weekly, startTime: event.target.value })} />
            </label>
          </div>
          <div className="nested-heading ticket-heading">
            <span>recurrence.overrides[]（仅在改时或取消时添加）</span>
            <button type="button" className="quiet-button" onClick={() => updateWeekly({
              ...weekly,
              overrides: [...overrides, { date: "" }],
            })}>
              <Plus /> 添加覆盖
            </button>
          </div>
          {overrides.length === 0 && <p className="empty-copy">当前没有例外，将全部使用默认星期和时间。</p>}
          <div className="card-stack">
            {overrides.map((override, index) => (
              <div className="nested-card" key={index}>
                <ItemToolbar
                  label="recurrence.overrides[]"
                  index={index}
                  count={overrides.length}
                  onMove={(direction) => {
                    const next = [...overrides]
                    const target = index + direction
                    ;[next[index], next[target]] = [next[target], next[index]]
                    updateWeekly({ ...weekly, overrides: next })
                  }}
                  onRemove={() => {
                    const next = overrides.filter((_, itemIndex) => itemIndex !== index)
                    updateWeekly(setOptional(weekly as WeeklyActivityRecurrence & Record<string, unknown>, "overrides", next.length ? next : undefined))
                  }}
                />
                <div className="field-grid three">
                  <label className="form-field">
                    <span>recurrence.overrides[].date <em className="required">required</em></span>
                    <input type="text" placeholder="YYYY-MM-DD" value={override.date} onChange={(event) => {
                      const next = overrides.map((item, itemIndex) => itemIndex === index
                        ? { ...item, date: event.target.value }
                        : item)
                      updateWeekly({ ...weekly, overrides: next })
                    }} />
                  </label>
                  <label className="form-field">
                    <span>recurrence.overrides[].startTime <em className="optional">optional</em></span>
                    <input type="text" placeholder="HH:mm" disabled={override.cancelled} value={override.startTime ?? ""} onChange={(event) => {
                      const next = overrides.map((item, itemIndex) => itemIndex === index
                        ? setOptional(item, "startTime", event.target.value)
                        : item)
                      updateWeekly({ ...weekly, overrides: next })
                    }} />
                  </label>
                  <label className="checkbox-field recurrence-cancelled">
                    <input type="checkbox" checked={Boolean(override.cancelled)} onChange={(event) => {
                      const next = overrides.map((item, itemIndex) => {
                        if (itemIndex !== index) return item
                        const changed = setOptional(item, "cancelled", event.target.checked)
                        return event.target.checked
                          ? setOptional(changed, "startTime", undefined)
                          : changed
                      })
                      updateWeekly({ ...weekly, overrides: next })
                    }} />
                    <span><strong>recurrence.overrides[].cancelled <em className="optional">optional</em></strong></span>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}

function PerformanceEditor({
  performances,
  recurrenceType,
  onChange,
}: {
  performances?: ActivityPerformance[]
  recurrenceType?: ActivityRecurrence["type"]
  onChange: (performances: ActivityPerformance[] | undefined) => void
}) {
  const items = (performances ?? []) as EditorPerformance[]
  const update = (index: number, value: EditorPerformance) => {
    onChange(items.map((item, itemIndex) => itemIndex === index ? value : item))
  }

  if (recurrenceType === "weekly") {
    return (
      <section className="editor-section compact-section">
        <div className="section-heading">
          <div><h2>场次</h2><p>当前场次由每周规则自动生成；特殊情况请使用上方的例外覆盖。</p></div>
        </div>
      </section>
    )
  }

  return (
    <section className="editor-section">
      <div className="section-heading">
        <div>
          <h2>场次</h2>
          <p>精确时间和仅日期场次使用互斥结构；拖动的替代方式是上下移动按钮。</p>
        </div>
        <button type="button" className="secondary-button" onClick={() => onChange([
          ...items,
          { startAt: "" },
        ])}>
          <Plus /> 添加场次
        </button>
      </div>
      {items.length === 0 && <p className="empty-copy">{recurrenceType === "manual" ? "请手动添加已确认的更新日期。" : "没有独立场次，将使用上方连续日期。"}</p>}
      <div className="card-stack">
        {items.map((performance, index) => {
          const dateOnly = "occursOn" in performance
          return (
            <div className="item-card" key={index}>
              <ItemToolbar
                label="performances[]"
                index={index}
                count={items.length}
                onMove={(direction) => {
                  const next = [...items]
                  const target = index + direction
                  ;[next[index], next[target]] = [next[target], next[index]]
                  onChange(next)
                }}
                onRemove={() => {
                  const next = items.filter((_, itemIndex) => itemIndex !== index)
                  onChange(next.length ? next : undefined)
                }}
              />
              <div className="field-grid three">
                <label className="form-field">
                  <span>performances[].startAt / occursOn <em className="required">required</em></span>
                  <span className="select-wrap">
                    <select
                      value={dateOnly ? "date" : "timed"}
                      onChange={(event) => {
                        const shared = {
                          ...(performance.label ? { label: performance.label } : {}),
                          ...(performance.milestones ? { milestones: performance.milestones } : {}),
                        }
                        update(index, event.target.value === "date"
                          ? { ...shared, occursOn: "" } as EditorPerformance
                          : { ...shared, startAt: "" } as EditorPerformance)
                      }}
                    >
                      <option value="timed">startAt — YYYY-MM-DDTHH:mm</option>
                      <option value="date">occursOn — YYYY-MM-DD</option>
                    </select>
                    <ChevronDown aria-hidden="true" />
                  </span>
                </label>
                {dateOnly ? (
                  <label className="form-field wide-two">
                    <span>performances[].occursOn <em className="required">required</em></span>
                    <input
                      type="text"
                      placeholder="YYYY-MM-DD"
                      value={performance.occursOn}
                      onChange={(event) => update(index, {
                        ...(performance as Record<string, unknown>),
                        occursOn: event.target.value,
                      } as EditorPerformance)}
                    />
                  </label>
                ) : (
                  <>
                    <label className="form-field">
                      <span>performances[].startAt <em className="required">required</em></span>
                      <input
                        type="text"
                        placeholder="YYYY-MM-DDTHH:mm"
                        value={performance.startAt}
                        onChange={(event) => update(index, { ...performance, startAt: event.target.value })}
                      />
                    </label>
                    <label className="form-field">
                      <span>performances[].endAt <em className="optional">optional</em></span>
                      <input
                        type="text"
                        placeholder="YYYY-MM-DDTHH:mm"
                        value={performance.endAt ?? ""}
                        onChange={(event) => update(index, setOptional(performance, "endAt", event.target.value) as EditorPerformance)}
                      />
                    </label>
                  </>
                )}
              </div>
              <LocalizedEditor
                label="performances[].label"
                value={performance.label}
                onChange={(value) => update(index, setOptional(performance, "label", value) as EditorPerformance)}
              />
              <MilestoneEditor
                milestones={performance.milestones}
                onChange={(value) => update(index, setOptional(performance, "milestones", value) as EditorPerformance)}
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}

function TicketEditor({
  activity,
  onChange,
}: {
  activity: EditorActivity
  onChange: (activity: EditorActivity) => void
}) {
  const ticketInfo = activity.ticketInfo
  if (!ticketInfo) {
    return (
      <section className="editor-section compact-section">
        <div className="section-heading">
          <div>
            <h2>票务信息</h2>
            <p>当前活动没有票务信息。</p>
          </div>
          <button type="button" className="secondary-button" onClick={() => onChange({
            ...activity,
            ticketInfo: { entries: [] },
          })}>
            <Plus /> 添加票务信息
          </button>
        </div>
      </section>
    )
  }

  const entries = ticketInfo.entries as EditorTicketEntry[]
  const updateInfo = (nextInfo: Activity["ticketInfo"]) => onChange({ ...activity, ticketInfo: nextInfo })
  const updateEntry = (index: number, entry: EditorTicketEntry) => updateInfo({
    ...ticketInfo,
    entries: entries.map((item, itemIndex) => itemIndex === index ? entry : item),
  })

  return (
    <section className="editor-section">
      <div className="section-heading">
        <div>
          <h2>票务信息</h2>
          <p>条目链接和价格为空时，页面会依次回退到票务总览和活动信息。</p>
        </div>
        <button type="button" className="danger-button" onClick={() => {
          const next = { ...activity }
          delete next.ticketInfo
          onChange(next)
        }}>
          <Trash2 /> 移除票务
        </button>
      </div>
      <div className="field-grid">
        <label className="form-field">
          <span>ticketInfo.link <em className="optional">optional</em></span>
          <input
            type="url"
            value={ticketInfo.link ?? ""}
            onChange={(event) => updateInfo(setOptional(ticketInfo as TicketInfoRecord, "link", event.target.value) as Activity["ticketInfo"])}
          />
        </label>
      </div>
      <LocalizedEditor
        label="ticketInfo.price"
        value={ticketInfo.price}
        onChange={(value) => updateInfo(setOptional(ticketInfo as TicketInfoRecord, "price", value) as Activity["ticketInfo"])}
      />
      <div className="nested-heading ticket-heading">
        <span>ticketInfo.entries[]</span>
        <button type="button" className="quiet-button" onClick={() => updateInfo({
          ...ticketInfo,
          entries: [...entries, {
            type: { ja: "", en: "" },
            scheduleLabel: "",
          }],
        })}>
          <Plus /> 添加条目
        </button>
      </div>
      <div className="card-stack">
        {entries.map((entry, index) => (
          <div className="item-card" key={index}>
            <ItemToolbar
              label="ticketInfo.entries[]"
              index={index}
              count={entries.length}
              onMove={(direction) => {
                const next = [...entries]
                const target = index + direction
                ;[next[index], next[target]] = [next[target], next[index]]
                updateInfo({ ...ticketInfo, entries: next })
              }}
              onRemove={() => updateInfo({
                ...ticketInfo,
                entries: entries.filter((_, itemIndex) => itemIndex !== index),
              })}
            />
            <LocalizedEditor
              label="ticketInfo.entries[].type"
              value={entry.type}
              required
              onChange={(value) => updateEntry(index, { ...entry, type: value ?? EMPTY_LOCALIZED_TEXT })}
            />
            <div className="field-grid">
              <label className="form-field">
                <span>ticketInfo.entries[].scheduleLabel <em className="required">required</em></span>
                <input value={entry.scheduleLabel} onChange={(event) => updateEntry(index, { ...entry, scheduleLabel: event.target.value })} />
              </label>
              <label className="form-field">
                <span>ticketInfo.entries[].link <em className="optional">optional</em></span>
                <input type="url" value={entry.link ?? ""} onChange={(event) => updateEntry(index, setOptional(entry, "link", event.target.value) as EditorTicketEntry)} />
              </label>
            </div>
            <div className="field-grid">
              {(["startAt", "endAt"] as const).map((key) => (
                <label className="form-field" key={key}>
                  <span>ticketInfo.entries[].{key} <em className="optional">optional</em></span>
                  <input
                    type="text"
                    placeholder="YYYY-MM-DD or YYYY-MM-DDTHH:mm"
                    value={entry[key] ?? ""}
                    onChange={(event) => updateEntry(index, setOptional(entry, key, event.target.value) as EditorTicketEntry)}
                  />
                </label>
              ))}
            </div>
            <LocalizedEditor label="ticketInfo.entries[].price" value={entry.price} onChange={(value) => updateEntry(index, setOptional(entry, "price", value) as EditorTicketEntry)} />
            <LocalizedEditor label="ticketInfo.entries[].description" value={entry.description} multiline onChange={(value) => updateEntry(index, setOptional(entry, "description", value) as EditorTicketEntry)} />
          </div>
        ))}
      </div>
    </section>
  )
}

type TicketInfoRecord = NonNullable<Activity["ticketInfo"]> & Record<string, unknown>

export default function ActivityEditorApp() {
  const [activities, setActivities] = useState<EditorActivity[]>([])
  const [savedActivities, setSavedActivities] = useState<EditorActivity[]>([])
  const [revision, setRevision] = useState("")
  const [selectedId, setSelectedId] = useState("")
  const [query, setQuery] = useState("")
  const [category, setCategory] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")
  const [showYaml, setShowYaml] = useState(false)

  const dirty = JSON.stringify(activities) !== JSON.stringify(savedActivities)
  const selectedIndex = activities.findIndex((activity) => activity.id === selectedId)
  const selectedActivity = activities[selectedIndex]
  const issues = useMemo(() => validateActivities(activities), [activities])
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
    if (confirmDirty && dirty && !window.confirm("放弃尚未保存的修改并重新载入吗？")) return
    setLoading(true)
    setMessage("")
    try {
      const payload = await fetchEditorData()
      setActivities(payload.activities)
      setSavedActivities(structuredClone(payload.activities))
      setRevision(payload.revision)
      setSelectedId((current) => payload.activities.some((activity) => activity.id === current)
        ? current
        : payload.activities[0]?.id ?? "")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "读取失败")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void load() }, [])
  useEffect(() => {
    if (dirty || loading || saving || !revision) return
    let cancelled = false

    const refreshIfChanged = async () => {
      try {
        const payload = await fetchEditorData()
        if (cancelled || payload.revision === revision) return
        setActivities(payload.activities)
        setSavedActivities(structuredClone(payload.activities))
        setRevision(payload.revision)
        setSelectedId((current) => payload.activities.some((activity) => activity.id === current)
          ? current
          : payload.activities[0]?.id ?? "")
        setMessage("检测到磁盘内容更新，已自动载入最新版本。")
      } catch {
        // A manual reload or save will surface connection/read errors.
      }
    }

    const refreshOnVisible = () => {
      if (document.visibilityState === "visible") void refreshIfChanged()
    }
    const interval = window.setInterval(() => void refreshIfChanged(), AUTO_REFRESH_INTERVAL_MS)
    window.addEventListener("focus", refreshIfChanged)
    document.addEventListener("visibilitychange", refreshOnVisible)
    return () => {
      cancelled = true
      window.clearInterval(interval)
      window.removeEventListener("focus", refreshIfChanged)
      document.removeEventListener("visibilitychange", refreshOnVisible)
    }
  }, [dirty, loading, revision, saving])
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (!dirty) return
      event.preventDefault()
    }
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

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
    key: "title" | "venue" | "description",
    value: LocalizedText | undefined
  ) => {
    if (!selectedActivity) return
    updateSelected(key === "title"
      ? { ...selectedActivity, title: value ?? EMPTY_LOCALIZED_TEXT }
      : setOptional(selectedActivity, key, value) as EditorActivity)
  }

  const save = async () => {
    if (errorCount > 0) {
      setMessage(`还有 ${errorCount} 个错误，请修正后再保存。`)
      return
    }
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
      setActivities(merged.activities)
      setSavedActivities(structuredClone(merged.activities))
      setMessage(sourceChanged
        ? "已合并磁盘最新内容并安全写入 src/data/activities.yaml"
        : "已安全写入 src/data/activities.yaml")
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败")
    } finally {
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
          <button type="button" className="reload-button" onClick={() => void load(true)} disabled={loading}>
            <RefreshCw /> 载入磁盘最新版本
          </button>
          <button type="button" className="primary-button" onClick={() => void save()} disabled={!dirty || saving || errorCount > 0}>
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
                  <LocalizedEditor label="venue" value={selectedActivity.venue} onChange={(value) => updateLocalized("venue", value)} />
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

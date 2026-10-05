import { ChevronDown, Plus } from "lucide-react"
import type { ActivityMilestone, ActivityPerformance, ActivityRecurrence, WeeklyActivityRecurrence } from "../types"
import { ItemToolbar, LocalizedEditor } from "./ActivityEditorFields"
import { setOptional, type EditorMilestone, type EditorPerformance, type EditorWeeklyOverride } from "./activityEditorValues"

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
      <div className="list-append-action">
        <button type="button" className="secondary-button" onClick={() => onChange([
          ...items,
          { kind: "doors", at: "" },
        ])}>
          <Plus /> 添加时刻
        </button>
      </div>
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

export function RecurrenceEditor({
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
          <div className="list-append-action">
            <button type="button" className="secondary-button" onClick={() => updateWeekly({
              ...weekly,
              overrides: [...overrides, { date: "" }],
            })}>
              <Plus /> 添加覆盖
            </button>
          </div>
        </>
      )}
    </section>
  )
}

export function PerformanceEditor({
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
      <div className="list-append-action">
        <button type="button" className="secondary-button" onClick={() => onChange([
          ...items,
          { startAt: "" },
        ])}>
          <Plus /> 添加场次
        </button>
      </div>
    </section>
  )
}

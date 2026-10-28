import { ChevronDown, Plus } from "lucide-react"
import { useState } from "react"
import type { ActivityMilestone, ActivityPerformance, ActivityRecurrence, WeeklyActivityRecurrence } from "../types"
import { ItemToolbar, LocalizedEditor } from "./ActivityEditorFields"
import { setOptional, type EditorMilestone, type EditorPerformance, type EditorWeeklyOverride } from "./activityEditorValues"
import { PROGRAM_EPISODE_PAGE_SIZE } from "../utils/programEpisodes"
import MonthlyRecurrenceFields from "./MonthlyRecurrenceFields"

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
          <p>每周或每月固定节目按规则生成；不固定日期的节目使用手动场次。</p>
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
                else if (event.target.value === "monthly") onChange({ type: "monthly", startOn: "", weekday: "thursday", weekOfMonth: 1, updateTime: "12:00", firstEpisode: 1 })
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
              <option value="monthly">monthly — 每月第几个星期几（自动生成）</option>
            </select>
            <ChevronDown aria-hidden="true" />
          </span>
        </label>
      </div>

      {recurrence?.type === "monthly" && <MonthlyRecurrenceFields rule={recurrence} onChange={onChange} />}
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
          <div className="field-grid">
            <label className="form-field">
              <span>recurrence.firstEpisode <em className="optional">optional</em></span>
              <input type="number" min="0" step="1" value={weekly.firstEpisode ?? ""} onChange={event => updateWeekly(setOptional(weekly as WeeklyActivityRecurrence & Record<string, unknown>, "firstEpisode", event.target.value === "" ? undefined : Number(event.target.value)))} />
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
  episodeMode = false,
  sourceFile,
  onChange,
}: {
  performances?: ActivityPerformance[]
  recurrenceType?: ActivityRecurrence["type"]
  episodeMode?: boolean
  sourceFile?: string
  onChange: (performances: ActivityPerformance[] | undefined) => void
}) {
  const items = (performances ?? []) as EditorPerformance[]
  const [page, setPage] = useState(0)
  const pageSize = episodeMode ? PROGRAM_EPISODE_PAGE_SIZE : Math.max(items.length, 1)
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const currentPage = Math.min(page, pageCount - 1)
  const startIndex = currentPage * pageSize
  const update = (index: number, value: EditorPerformance) => {
    onChange(items.map((item, itemIndex) => itemIndex === index ? value : item))
  }

  const generated = recurrenceType === "monthly" || recurrenceType === "weekly"

  return (
    <section className="editor-section">
      <div className="section-heading">
        <div>
          <h2>{generated ? "单期补充信息 / 特别回" : "场次"}</h2>
          <p>精确时间和仅日期场次使用互斥结构；拖动的替代方式是上下移动按钮。</p>
          {recurrenceType === "monthly" && <p>普通回数由月更规则生成。此处只需补充原定日期对应的单期链接、说明或特殊时刻；改期与取消请使用上方月更例外。</p>}
          {recurrenceType === "weekly" && <p>普通回数由每周规则生成。此处可补充该回的实际 startAt、标题、回数或说明，不会重复生成；上方例外中的改时优先，取消时请移除对应补充资料。</p>}
          {sourceFile && <p>数据文件：src/data/{sourceFile}。点击顶部“保存 YAML”会自动保存到这个子文件。</p>}
        </div>
        {episodeMode && <button type="button" className="secondary-button" onClick={() => {
          onChange([{ startAt: "" }, ...items])
          setPage(0)
        }}><Plus /> 添加回数</button>}
      </div>
      {pageCount > 1 && <nav className="performance-pagination" aria-label="场次分页">
        <button type="button" className="secondary-button" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)}>上一页</button>
        <span aria-live="polite">{currentPage + 1} / {pageCount} 页 · 共 {items.length} 条，每页 {pageSize} 条</span>
        <button type="button" className="secondary-button" disabled={currentPage === pageCount - 1} onClick={() => setPage(currentPage + 1)}>下一页</button>
      </nav>}
      {items.length === 0 && <p className="empty-copy">{generated ? "常规回数自动生成，无需重复添加；只在补充单期链接、备注或特别回时添加。" : recurrenceType === "manual" ? "请手动添加已确认的更新日期。" : "没有独立场次，将使用上方连续日期。"}</p>}
      <div className="card-stack">
        {items.slice(startIndex, startIndex + pageSize).map((performance, offset) => {
          const index = startIndex + offset
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
                        // Changing precision must not discard links, episode numbers or notes.
                        const shared = { ...performance } as Record<string, unknown>
                        delete shared.startAt
                        delete shared.endAt
                        delete shared.occursOn
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
              <div className="field-grid three">
                <label className="form-field">
                  <span>performances[].episode <em className="optional">optional</em></span>
                  <input type="text" placeholder="200 / SP" value={performance.episode ?? ""} onChange={event => update(index, setOptional(performance, "episode", event.target.value) as EditorPerformance)} />
                </label>
                <label className="form-field">
                  <span>performances[].link <em className="optional">optional</em></span>
                  <input type="url" placeholder="https://example.com/episode" value={performance.link ?? ""} onChange={event => update(index, setOptional(performance, "link", event.target.value) as EditorPerformance)} />
                </label>
                <label className="form-field">
                  <span>performances[].status <em className="optional">optional</em></span>
                  <span className="select-wrap"><select value={performance.status ?? ""} onChange={event => update(index, setOptional(performance, "status", event.target.value) as EditorPerformance)}>
                    <option value="">(omit) — 正常</option>
                    <option value="available">available — 可访问</option>
                    <option value="expired">expired — 链接失效</option>
                  </select><ChevronDown aria-hidden="true" /></span>
                </label>
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
              <LocalizedEditor label="performances[].description" multiline value={performance.description} onChange={value => update(index, setOptional(performance, "description", value) as EditorPerformance)} />
            </div>
          )
        })}
      </div>
      {!episodeMode && <div className="list-append-action">
        <button type="button" className="secondary-button" onClick={() => onChange([
          ...items,
          { startAt: "" },
        ])}>
          <Plus /> 添加场次
        </button>
      </div>}
    </section>
  )
}

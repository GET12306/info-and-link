import { Plus } from "lucide-react"
import type { ActivityWeekday, MonthlyActivityRecurrence, MonthlyActivityRecurrenceOverride } from "../types"
import { ItemToolbar } from "./ActivityEditorFields"
import { setOptional } from "./activityEditorValues"

const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"] as const
const LABELS = ["星期日", "星期一", "星期二", "星期三", "星期四", "星期五", "星期六"]
type Override = MonthlyActivityRecurrenceOverride & Record<string, unknown>

export default function MonthlyRecurrenceFields({ rule, onChange }: { rule: MonthlyActivityRecurrence; onChange: (rule: MonthlyActivityRecurrence) => void }) {
  const overrides = (rule.overrides ?? []) as Override[]
  const updateOverrides = (items: Override[]) => onChange(setOptional({ ...rule }, "overrides", items.length ? items : undefined))
  const update = (index: number, item: Override) => updateOverrides(overrides.map((current, itemIndex) => itemIndex === index ? item : current))
  return <>
    <p className="empty-copy">每月按规则自动生成全天场次，更新时间作为辅助时刻显示。只把已经到更新时间的回数加入博物馆；通常不需要逐期新增场次。</p>
    <div className="field-grid three recurrence-fields">
      <label className="form-field"><span>recurrence.startOn <em className="required">required</em></span>
        <input type="text" placeholder="YYYY-MM-DD" value={rule.startOn} onChange={event => onChange({ ...rule, startOn: event.target.value })} />
      </label>
      <label className="form-field"><span>recurrence.weekOfMonth <em className="required">required</em></span>
        <select value={rule.weekOfMonth} onChange={event => onChange({ ...rule, weekOfMonth: Number(event.target.value) })}>
          {[1, 2, 3, 4, 5].map(value => <option key={value} value={value}>每月第 {value} 个</option>)}
        </select>
      </label>
      <label className="form-field"><span>recurrence.weekday <em className="required">required</em></span>
        <select value={rule.weekday} onChange={event => onChange({ ...rule, weekday: event.target.value as ActivityWeekday })}>
          {WEEKDAYS.map((value, index) => <option key={value} value={value}>{value} — {LABELS[index]}</option>)}
        </select>
      </label>
      <label className="form-field"><span>recurrence.updateTime <em className="optional">optional</em></span>
        <input type="text" placeholder="HH:mm" value={rule.updateTime ?? ""} onChange={event => onChange(setOptional({ ...rule }, "updateTime", event.target.value))} />
      </label>
      <label className="form-field"><span>recurrence.firstEpisode <em className="optional">optional</em></span>
        <input type="number" min="1" placeholder="首月的回数，如 1" value={rule.firstEpisode ?? ""} onChange={event => onChange(setOptional({ ...rule }, "firstEpisode", event.target.value ? Number(event.target.value) : undefined))} />
      </label>
    </div>
    <div className="nested-heading"><span>recurrence.overrides[]（改期、改时或取消）</span></div>
    <p className="empty-copy">date 始终填写原定日期；改期后保持原回数。补充单期链接/说明时，可在下方通用场次中填写该回的原定日期。</p>
    <div className="card-stack">
      {overrides.map((override, index) => <div className="nested-card" key={index}>
        <ItemToolbar label="recurrence.overrides[]" index={index} count={overrides.length}
          onMove={direction => { const next = [...overrides]; [next[index], next[index + direction]] = [next[index + direction], next[index]]; updateOverrides(next) }}
          onRemove={() => updateOverrides(overrides.filter((_, itemIndex) => itemIndex !== index))} />
        <div className="field-grid three">
          <label className="form-field"><span>recurrence.overrides[].date <em className="required">required</em></span>
            <input type="text" placeholder="原定 YYYY-MM-DD" value={override.date} onChange={event => update(index, { ...override, date: event.target.value })} />
          </label>
          <label className="form-field"><span>recurrence.overrides[].occursOn <em className="optional">optional</em></span>
            <input type="text" placeholder="改期后 YYYY-MM-DD" disabled={override.cancelled} value={override.occursOn ?? ""} onChange={event => update(index, setOptional(override, "occursOn", event.target.value))} />
          </label>
          <label className="form-field"><span>recurrence.overrides[].updateTime <em className="optional">optional</em></span>
            <input type="text" placeholder="HH:mm" disabled={override.cancelled} value={override.updateTime ?? ""} onChange={event => update(index, setOptional(override, "updateTime", event.target.value))} />
          </label>
          <label className="checkbox-field"><input type="checkbox" checked={Boolean(override.cancelled)} onChange={event => {
            let changed = setOptional(override, "cancelled", event.target.checked)
            if (event.target.checked) changed = setOptional(setOptional(changed, "occursOn", undefined), "updateTime", undefined)
            update(index, changed)
          }} /><span>recurrence.overrides[].cancelled — 取消本回更新</span></label>
        </div>
      </div>)}
    </div>
    <div className="list-append-action"><button type="button" className="secondary-button" onClick={() => updateOverrides([...overrides, { date: "" }])}><Plus /> 添加月更例外</button></div>
  </>
}

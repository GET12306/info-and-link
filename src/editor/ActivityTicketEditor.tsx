import { Plus, Trash2 } from "lucide-react"
import type { Activity } from "../types"
import { ItemToolbar, LocalizedEditor } from "./ActivityEditorFields"
import { EMPTY_LOCALIZED_TEXT, setOptional, type EditorActivity, type EditorTicketEntry } from "./activityEditorValues"

export function TicketEditor({
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
          <p>票务时间默认沿用活动时区（未填写即 Asia/Tokyo）；如票务公告采用其他时区，可在条目中单独指定。</p>
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
              <label className="form-field">
                <span>ticketInfo.entries[].timeZone <em className="optional">optional</em></span>
                <input type="text" placeholder="沿用活动时区，例如 Asia/Tokyo" value={entry.timeZone ?? ""}
                  onChange={(event) => updateEntry(index, setOptional(entry, "timeZone", event.target.value) as EditorTicketEntry)} />
              </label>
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
      <div className="list-append-action">
        <button type="button" className="secondary-button" onClick={() => updateInfo({
          ...ticketInfo,
          entries: [...entries, {
            type: { ja: "", en: "" },
            scheduleLabel: "",
          }],
        })}>
          <Plus /> 添加条目
        </button>
      </div>
    </section>
  )
}

type TicketInfoRecord = NonNullable<Activity["ticketInfo"]> & Record<string, unknown>

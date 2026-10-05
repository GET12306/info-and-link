import { useEffect, useState } from "react"
import { ChevronDown, ChevronUp, Trash2 } from "lucide-react"
import type { Language, LocalizedText } from "../types"
import type { ActivityEditorField, ActivityEditorScalarKey } from "./activityEditorSchema"
import { EMPTY_LOCALIZED_TEXT, type EditorActivity } from "./activityEditorValues"

export function LocalizedEditor({
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

export function VenueEditor({
  value,
  onChange,
}: {
  value?: string[]
  onChange: (value: string[] | undefined) => void
}) {
  const [draft, setDraft] = useState((value ?? []).join(", "))

  useEffect(() => {
    setDraft((value ?? []).join(", "))
  }, [value])

  const commit = () => {
    const ids = [...new Set(draft
      .split(/[,\n]/)
      .map((id) => id.trim())
      .filter(Boolean))]
    const next = ids.length ? ids : undefined
    setDraft(ids.join(", "))
    onChange(next)
  }

  return (
    <fieldset className="localized-field">
      <legend>venueIds <span className="optional">optional</span></legend>
      <label>
        <span>场馆 ID</span>
        <input
          value={draft}
          placeholder="theater-sunmall, another-venue"
          onChange={(event) => setDraft(event.target.value)}
          onBlur={commit}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur()
          }}
        />
      </label>
      <small>多个 ID 请用逗号分隔；可以先填写尚未收录的 ID，再到 Venues 标签页补充场馆资料。</small>
    </fieldset>
  )
}

export function ScalarField({
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

export function ItemToolbar({
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

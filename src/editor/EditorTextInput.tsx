import { useEffect, useRef, useState } from "react"

/** Keep IME preedit text local until composition commits. */
export default function EditorTextInput({ value, onChange, multiline = false, rows = 3, className }: {
  value: string
  onChange: (value: string) => void
  multiline?: boolean
  rows?: number
  className?: string
}) {
  const [draft, setDraft] = useState(value)
  const composing = useRef(false)
  useEffect(() => { if (!composing.current) setDraft(value) }, [value])
  const props = {
    value: draft,
    className,
    onCompositionStart: () => { composing.current = true },
    onCompositionEnd: (event: React.CompositionEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      composing.current = false
      setDraft(event.currentTarget.value)
      onChange(event.currentTarget.value)
    },
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setDraft(event.currentTarget.value)
      if (!composing.current && !(event.nativeEvent as InputEvent).isComposing) onChange(event.currentTarget.value)
    },
  }
  return multiline ? <textarea {...props} rows={rows} /> : <input {...props} />
}

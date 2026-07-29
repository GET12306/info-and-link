import { useEffect, useState } from "react"
import { getJapanDateTimeKey } from "../utils/japanTime"

export default function useJapanNow() {
  const [now, setNow] = useState(() => getJapanDateTimeKey())

  useEffect(() => {
    let intervalId: number | undefined
    const update = () => setNow(getJapanDateTimeKey())
    const delayToNextMinute = 60_000 - (Date.now() % 60_000) + 50
    const timeoutId = window.setTimeout(() => {
      update()
      intervalId = window.setInterval(update, 60_000)
    }, delayToNextMinute)

    return () => {
      window.clearTimeout(timeoutId)
      if (intervalId !== undefined) window.clearInterval(intervalId)
    }
  }, [])

  return now
}

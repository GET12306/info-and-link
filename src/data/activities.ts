import ACTIVITIES from "./activities.yaml"
import type { Activity } from "../types"
import { attachActivitySchedules } from "../utils/activityScheduleFiles"

const files = import.meta.glob("./activity-schedules/*.yaml", { eager: true, import: "default" })
const schedules = Object.fromEntries(Object.entries(files).map(([file, value]) => [file.replace(/^\.\//, ""), value]))

export default attachActivitySchedules(ACTIVITIES as Activity[], schedules)

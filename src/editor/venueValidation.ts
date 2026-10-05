import { isCalendarDate, isHttpUrl, isRecord } from "../utils/contentValidation"
import { isValidTimeZone } from "../utils/timeZone"

export interface VenueValidationIssue {
  path: string
  message: string
  severity: "error" | "warning"
}

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

function validateLocalized(
  value: unknown,
  path: string,
  issues: VenueValidationIssue[],
  required = false
) {
  if (value === undefined && !required) return
  if (!isRecord(value)) {
    issues.push({ path, message: "必须是包含 ja 和 en 的对象", severity: "error" })
    return
  }
  for (const language of ["ja", "en"] as const) {
    if (typeof value[language] !== "string" || (required && !value[language].trim())) {
      issues.push({ path: `${path}.${language}`, message: `${language} 必须是${required ? "非空" : ""}文本`, severity: "error" })
    }
  }
}

export function validateVenues(value: unknown): VenueValidationIssue[] {
  if (!Array.isArray(value)) {
    return [{ path: "venues", message: "venues 必须是数组", severity: "error" }]
  }

  const issues: VenueValidationIssue[] = []
  const ids = new Set<string>()
  value.forEach((venue, index) => {
    const path = `venues[${index}]`
    if (!isRecord(venue)) {
      issues.push({ path, message: "场馆必须是对象", severity: "error" })
      return
    }

    if (typeof venue.id !== "string" || !ID_PATTERN.test(venue.id)) {
      issues.push({ path: `${path}.id`, message: "ID 只能使用小写字母、数字和单个连字符", severity: "error" })
    } else if (ids.has(venue.id)) {
      issues.push({ path: `${path}.id`, message: `ID ${venue.id} 重复`, severity: "error" })
    } else {
      ids.add(venue.id)
    }

    validateLocalized(venue.name, `${path}.name`, issues, true)
    validateLocalized(venue.formalName, `${path}.formalName`, issues)
    validateLocalized(venue.formerName, `${path}.formerName`, issues)

    if (!isRecord(venue.address)) {
      issues.push({ path: `${path}.address`, message: "address 必须是对象", severity: "error" })
    } else {
      if (venue.address.postalCode !== undefined && typeof venue.address.postalCode !== "string") {
        issues.push({ path: `${path}.address.postalCode`, message: "邮编必须是文本", severity: "error" })
      }
      for (const key of ["region", "locality", "street", "note"] as const) {
        validateLocalized(venue.address[key], `${path}.address.${key}`, issues)
      }
    }

    if (!isHttpUrl(venue.officialUrl)) {
      issues.push({ path: `${path}.officialUrl`, message: "官网必须是 HTTP(S) URL", severity: "error" })
    }

    if (!Array.isArray(venue.sources) || venue.sources.length === 0) {
      issues.push({ path: `${path}.sources`, message: "至少需要一个信息来源", severity: "error" })
    } else {
      venue.sources.forEach((source, sourceIndex) => {
        const sourcePath = `${path}.sources[${sourceIndex}]`
        if (!isRecord(source)) {
          issues.push({ path: sourcePath, message: "信息来源必须是对象", severity: "error" })
          return
        }
        if (typeof source.label !== "string" || !source.label.trim()) {
          issues.push({ path: `${sourcePath}.label`, message: "来源名称不能为空", severity: "error" })
        }
        if (!isHttpUrl(source.url)) {
          issues.push({ path: `${sourcePath}.url`, message: "来源必须是 HTTP(S) URL", severity: "error" })
        }
        if (source.covers !== undefined && (!Array.isArray(source.covers) || source.covers.some(item => typeof item !== "string"))) {
          issues.push({ path: `${sourcePath}.covers`, message: "covers 必须是文本数组", severity: "error" })
        }
      })
    }

    if (venue.countryCode !== undefined &&
        (typeof venue.countryCode !== "string" || !/^[A-Z]{2}$/.test(venue.countryCode))) {
      issues.push({ path: `${path}.countryCode`, message: "国家代码必须是两个大写字母", severity: "error" })
    }
    if (venue.timeZone !== undefined && !isValidTimeZone(venue.timeZone)) {
      issues.push({ path: `${path}.timeZone`, message: "请输入有效的 IANA 时区", severity: "error" })
    }
    if (venue.closedOn !== undefined && !isCalendarDate(venue.closedOn)) {
      issues.push({ path: `${path}.closedOn`, message: "日期必须是有效的 YYYY-MM-DD", severity: "error" })
    }

    if (venue.aliases !== undefined) {
      if (!isRecord(venue.aliases)) {
        issues.push({ path: `${path}.aliases`, message: "aliases 必须是对象", severity: "error" })
      } else {
        for (const language of ["ja", "en"] as const) {
          const aliases = venue.aliases[language]
          if (aliases !== undefined && (!Array.isArray(aliases) || aliases.some(alias => typeof alias !== "string"))) {
            issues.push({ path: `${path}.aliases.${language}`, message: "别名必须是文本数组", severity: "error" })
          }
        }
      }
    }
  })

  return issues
}

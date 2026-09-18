import type { PlanDay, Procedure } from './prep'

/**
 * Calendar export is deliberately a pure transformation: the Plan page already
 * has the department-approved procedure and derived steps, and a browser can
 * turn that into an .ics download without sending either to another service.
 */
const TIME_ZONE = 'Asia/Singapore'
const TASK_DURATION_MINUTES = 30

export type CalendarExportEvent = {
  readonly uid: string
  readonly title: string
  readonly description: string
  readonly date: string
  readonly time: string | null
  readonly location?: string
  readonly allDay: boolean
  readonly blocksCalendar: boolean
}

export type CalendarExport = {
  readonly filename: string
  readonly content: string
  readonly events: readonly CalendarExportEvent[]
}

export function calendarEventsForPlan({
  procedure,
  plan,
}: {
  procedure: Procedure
  plan: readonly PlanDay[]
}): CalendarExportEvent[] {
  const reminderFooter = `Clarity reminder. Follow instructions from ${procedure.hospital} if they differ.`

  const events: CalendarExportEvent[] = plan.flatMap((day) =>
    day.steps.map((step) => ({
      uid: `clarity-${procedure.date}-${step.uid}@clarity.local`,
      title: `Clarity: ${step.title}`,
      description: [step.detail, reminderFooter].filter(Boolean).join('\n\n'),
      date: day.date,
      time: step.at,
      allDay: step.at === null,
      blocksCalendar: false,
    })),
  )

  // Arrival is intentionally a short logistical appointment. The department
  // only gives us an arrival time, not a safe claim about procedure duration.
  if (isTime(procedure.arriveAt)) {
    events.push({
      uid: `clarity-${procedure.date}-arrival@clarity.local`,
      title: `Clarity: Arrive at ${procedure.hospital}`,
      description: [
        procedure.location ? `Location: ${procedure.location}` : undefined,
        'Arrive at the department at this time. Follow instructions from your department if they differ.',
      ]
        .filter(Boolean)
        .join('\n\n'),
      date: procedure.date,
      time: procedure.arriveAt,
      location: procedure.location || undefined,
      allDay: false,
      blocksCalendar: true,
    })
  }

  return events
}

export function exportPlanCalendar({
  procedure,
  plan,
  generatedAt = new Date(),
}: {
  procedure: Procedure
  plan: readonly PlanDay[]
  generatedAt?: Date
}): CalendarExport {
  const events = calendarEventsForPlan({ procedure, plan })
  return {
    filename: `clarity-prep-${procedure.date}.ics`,
    events,
    content: serializeCalendar(events, generatedAt),
  }
}

export function serializeCalendar(events: readonly CalendarExportEvent[], generatedAt: Date): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Clarity//Colonoscopy preparation//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VTIMEZONE',
    `TZID:${TIME_ZONE}`,
    `X-LIC-LOCATION:${TIME_ZONE}`,
    'BEGIN:STANDARD',
    'TZOFFSETFROM:+0800',
    'TZOFFSETTO:+0800',
    'TZNAME:+08',
    'DTSTART:19700101T000000',
    'END:STANDARD',
    'END:VTIMEZONE',
    ...events.flatMap((event) => eventLines(event, generatedAt)),
    'END:VCALENDAR',
  ]

  return `${lines.map(foldLine).join('\r\n')}\r\n`
}

function eventLines(event: CalendarExportEvent, generatedAt: Date): string[] {
  const start = dateTime(event.date, event.time)
  const timing = event.allDay
    ? [`DTSTART;VALUE=DATE:${compactDate(event.date)}`, `DTEND;VALUE=DATE:${compactDate(addDays(event.date, 1))}`]
    : [`DTSTART;TZID=${TIME_ZONE}:${start}`, `DTEND;TZID=${TIME_ZONE}:${addMinutes(start, TASK_DURATION_MINUTES)}`]

  return [
    'BEGIN:VEVENT',
    `UID:${event.uid}`,
    `DTSTAMP:${utcTimestamp(generatedAt)}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    ...(event.location ? [`LOCATION:${escapeText(event.location)}`] : []),
    ...timing,
    `TRANSP:${event.blocksCalendar ? 'OPAQUE' : 'TRANSPARENT'}`,
    ...alarmLines(event, start),
    'END:VEVENT',
  ]
}

function alarmLines(event: CalendarExportEvent, start: string): string[] {
  const trigger = event.allDay
    // All-day DTSTART is local midnight; this relative alarm therefore rings
    // at 9am in whichever calendar imports the file, without a non-standard
    // timezone parameter on the VALARM trigger.
    ? 'TRIGGER:PT9H'
    : 'TRIGGER:-PT15M'

  return ['BEGIN:VALARM', trigger, 'ACTION:DISPLAY', `DESCRIPTION:${escapeText(event.title)}`, 'END:VALARM']
}

function isTime(value: string): boolean {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value)
}

function dateTime(date: string, time: string | null): string {
  return `${compactDate(date)}T${(time ?? '09:00').replace(':', '')}00`
}

function compactDate(date: string): string {
  return date.replaceAll('-', '')
}

/** Calendar arithmetic without converting an Asia/Singapore wall time to the server's timezone. */
function addDays(date: string, days: number): string {
  const [year, month, day] = date.split('-').map(Number)
  const value = new Date(Date.UTC(year!, month! - 1, day! + days))
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}-${String(value.getUTCDate()).padStart(2, '0')}`
}

function addMinutes(value: string, minutes: number): string {
  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(4, 6))
  const day = Number(value.slice(6, 8))
  const hour = Number(value.slice(9, 11))
  const minute = Number(value.slice(11, 13))
  const adjusted = new Date(Date.UTC(year, month - 1, day, hour, minute + minutes))
  return `${adjusted.getUTCFullYear()}${String(adjusted.getUTCMonth() + 1).padStart(2, '0')}${String(adjusted.getUTCDate()).padStart(2, '0')}T${String(adjusted.getUTCHours()).padStart(2, '0')}${String(adjusted.getUTCMinutes()).padStart(2, '0')}00`
}

function utcTimestamp(value: Date): string {
  return value.toISOString().replaceAll('-', '').replaceAll(':', '').replace(/\.\d{3}/, '')
}

function escapeText(value: string): string {
  return value.replaceAll('\\', '\\\\').replaceAll(';', '\\;').replaceAll(',', '\\,').replace(/\r?\n/g, '\\n')
}

/** RFC 5545 limits a content line to 75 octets; continuation lines begin with one space. */
function foldLine(line: string): string {
  const encoder = new TextEncoder()
  const segments: string[] = []
  let current = ''
  let maximum = 75

  for (const character of line) {
    if (encoder.encode(current + character).length > maximum) {
      segments.push(current)
      current = ` ${character}`
      maximum = 75
    } else {
      current += character
    }
  }
  segments.push(current)
  return segments.join('\r\n')
}

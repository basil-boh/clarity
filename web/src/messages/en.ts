/**
 * English, and the shape every other language must match.
 *
 * `Dictionary` is `typeof en`, so a missing or misspelled key in zh, ms or ta
 * is a compile error rather than an English word appearing in the middle of a
 * Tamil sentence. English is therefore the only file where a key may be added.
 *
 * Keys are grouped by where they are read, not by what they say. A translator
 * working on `welcome` is looking at one screen.
 *
 * ── On the translations that follow ────────────────────────────────────────
 * The zh, ms and ta files are machine-translated and have **not** been checked
 * by a clinician or a native speaker. Nothing here is a clinical instruction in
 * itself -- the app's medical content comes from the department -- but "finish
 * the whole volume" is an instruction a patient acts on at 2am, and a wrong
 * word in it is a wrong preparation. They are marked unreviewed in the README
 * and should be read by a person before any patient sees them.
 */

export const en = {
  language: {
    /** The question itself, which has to be findable by someone who cannot read the rest. */
    question: 'Your language',
    hint: 'The app changes as soon as you choose.',
  },

  welcome: {
    title: 'Before you start',
    intro:
      'Three things, so the app can show you the right plan on the right days. Nothing here is shared outside your care.',
    nameLabel: 'Your full name',
    namePlaceholder: 'As it appears on your appointment letter',
    nameMissing: 'Please enter your name.',
    dateLabel: 'Date of your colonoscopy',
    dateHint: 'The whole plan is worked out from this date, so it has to be right.',
    dateMissing: 'Please enter the date of your colonoscopy.',
    dateUnreadable: 'That date could not be read. Use the date picker.',
    datePast: 'That date has already passed. Check your appointment letter.',
    dateTooFar: 'That date is more than three years away. Please check it.',
    submit: 'Save and continue',
    saving: 'Saving…',
    editTitle: 'Your details',
    editIntro: 'Change any of these and the plan updates straight away.',
    editSubmit: 'Save changes',
    cancel: 'Cancel',
    saved: 'Saved.',
    saveFailed: 'That could not be saved. Please try again.',
  },

  reminders: {
    heading: 'Reminders on Telegram',
    blurb:
      'The second dose is at 2am and it is the one most often missed. Connect Telegram and we will message you half an hour before each dose — even if your phone is on silent for the night.',
    connect: 'Connect Telegram',
    connected: 'Telegram is connected. You will be messaged before each dose.',
    stopped: 'Reminders are stopped. Connect again to turn them back on.',
    unavailable: 'Reminders are not set up on this deployment.',
    linkExpired: 'That link has expired. Open the app and tap Connect Telegram again.',
    /** What the bot says back when a patient connects. */
    botLinked:
      'Connected. I will message you half an hour before each dose of your bowel preparation. Send /stop at any time to turn this off.',
    botStopped: 'Reminders are off. You will get no more messages from me.',
    botUnknown:
      'I do not recognise that link. Open the Clarity app, sign in, and tap Connect Telegram.',
    /** The reminder itself. {time} is the dose time. */
    titleFirst: 'First dose at {time}',
    titleSecond: 'Second dose at {time}',
    lead: 'Your bowel preparation starts in 30 minutes.',
    body: 'Open Clarity for what to do.',
    footer: 'Send /stop to turn these reminders off',
  },
  tabs: {
    home: 'Home',
    plan: 'Plan',
    diet: 'Diet',
    ask: 'Ask',
    verify: 'Verify',
  },

  common: {
    back: 'Back',
    close: 'Close',
    changeDetails: 'Change your details',
  },
}

/**
 * The shape, with values widened to `string`.
 *
 * `en` is deliberately not `as const`: under it every value's type is the
 * English sentence itself, so `zh.ts` failed to compile for the crime of not
 * being in English. What must match across languages is the set of keys, not
 * the words.
 */
export type Dictionary = typeof en

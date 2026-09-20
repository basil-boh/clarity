import type { Dictionary } from './en'

/**
 * தமிழ் · Tamil, as written in Singapore.
 *
 * MACHINE-TRANSLATED AND UNREVIEWED. See the note in `en.ts`.
 *
 * "கொலனாஸ்கோபி" is the transliteration rather than a coined Tamil compound:
 * it is what appears on Singapore hospital letters, so it is the word a patient
 * will be matching against the paper in their hand.
 *
 * Tab labels are deliberately the shortest sensible word. Five tabs share a
 * 390px phone, and a long label wraps or clips -- `progress` is "நிலை"
 * (status) rather than "முன்னேற்றம்" for that reason alone.
 */
export const ta: Dictionary = {
  language: {
    question: 'உங்கள் மொழி',
    hint: 'நீங்கள் தேர்ந்தெடுத்தவுடன் திரை மாறும்.',
  },

  welcome: {
    title: 'தொடங்குவதற்கு முன்',
    intro:
      'மூன்று விவரங்கள் — சரியான நாட்களில் சரியான திட்டத்தை செயலி காண்பிக்க. இவை உங்கள் சிகிச்சைக்கு வெளியே பகிரப்படாது.',
    nameLabel: 'உங்கள் முழுப் பெயர்',
    namePlaceholder: 'உங்கள் சந்திப்புக் கடிதத்தில் உள்ளபடி',
    nameMissing: 'உங்கள் பெயரை உள்ளிடவும்.',
    dateLabel: 'உங்கள் கொலனாஸ்கோபி தேதி',
    dateHint: 'முழுத் திட்டமும் இந்தத் தேதியிலிருந்தே கணக்கிடப்படுகிறது, எனவே இது சரியாக இருக்க வேண்டும்.',
    dateMissing: 'உங்கள் கொலனாஸ்கோபி தேதியை உள்ளிடவும்.',
    dateUnreadable: 'அந்தத் தேதியைப் படிக்க முடியவில்லை. தேதி தேர்வியைப் பயன்படுத்தவும்.',
    datePast: 'அந்தத் தேதி ஏற்கனவே கடந்துவிட்டது. உங்கள் சந்திப்புக் கடிதத்தைச் சரிபார்க்கவும்.',
    dateTooFar: 'அந்தத் தேதி மூன்று ஆண்டுகளுக்கும் மேலானது. சரிபார்க்கவும்.',
    submit: 'சேமித்துத் தொடரவும்',
    saving: 'சேமிக்கிறது…',
    editTitle: 'உங்கள் விவரங்கள்',
    editIntro: 'எதை மாற்றினாலும் திட்டம் உடனே புதுப்பிக்கப்படும்.',
    editSubmit: 'மாற்றங்களைச் சேமிக்கவும்',
    cancel: 'ரத்து செய்',
    saved: 'சேமிக்கப்பட்டது.',
    saveFailed: 'சேமிக்க முடியவில்லை. மீண்டும் முயற்சிக்கவும்.',
  },

  reminders: {
    heading: 'Telegram நினைவூட்டல்கள்',
    blurb:
      'இரண்டாவது மருந்து அதிகாலை 2 மணிக்கு — அதுவே அடிக்கடி தவறவிடப்படுவது. Telegram இணைத்தால், ஒவ்வொரு மருந்துக்கும் அரை மணி நேரம் முன்பு நாங்கள் செய்தி அனுப்புவோம் — உங்கள் தொலைபேசி இரவு முழுவதும் அமைதியாக இருந்தாலும்.',
    connect: 'Telegram இணைக்கவும்',
    connected: 'Telegram இணைக்கப்பட்டது. ஒவ்வொரு மருந்துக்கும் முன் செய்தி வரும்.',
    stopped: 'நினைவூட்டல்கள் நிறுத்தப்பட்டன. மீண்டும் இணைத்தால் தொடரும்.',
    unavailable: 'இந்த நிறுவலில் நினைவூட்டல்கள் அமைக்கப்படவில்லை.',
    linkExpired: 'அந்த இணைப்பு காலாவதியாகிவிட்டது. செயலியைத் திறந்து மீண்டும் Telegram இணைக்கவும்.',
    botLinked:
      'இணைக்கப்பட்டது. உங்கள் குடல் சுத்திகரிப்பு மருந்தின் ஒவ்வொரு அளவுக்கும் அரை மணி நேரம் முன்பு செய்தி அனுப்புவேன். நிறுத்த /stop அனுப்பவும்.',
    botStopped: 'நினைவூட்டல்கள் நிறுத்தப்பட்டன. இனி செய்திகள் வராது.',
    botUnknown:
      'அந்த இணைப்பு தெரியவில்லை. Clarity செயலியைத் திறந்து உள்நுழைந்து, Telegram இணைக்கவும் என்பதை அழுத்தவும்.',
    titleFirst: 'முதல் அளவு {time}',
    titleSecond: 'இரண்டாவது அளவு {time}',
    lead: 'உங்கள் குடல் தயாரிப்பு 30 நிமிடங்களில் தொடங்குகிறது.',
    body: 'முழு விவரங்களுக்கு Clarity செயலியைத் திறக்கவும்.',
    footer: 'நினைவூட்டல்களை நிறுத்த /stop அனுப்பவும்',
  },
  tabs: {
    home: 'முகப்பு',
    plan: 'திட்டம்',
    diet: 'உணவு',
    ask: 'கேள்வி',
    verify: 'சரிபார்',
  },

  common: {
    back: 'பின்',
    close: 'மூடு',
    changeDetails: 'விவரங்களை மாற்று',
  },
}

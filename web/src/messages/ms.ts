import type { Dictionary } from './en'

/**
 * Bahasa Melayu, as written in Singapore.
 *
 * MACHINE-TRANSLATED AND UNREVIEWED. See the note in `en.ts`.
 */
export const ms: Dictionary = {
  language: {
    question: 'Bahasa anda',
    hint: 'Paparan akan bertukar sebaik sahaja anda memilih.',
  },

  welcome: {
    title: 'Sebelum anda mula',
    intro:
      'Tiga perkara, supaya aplikasi dapat menunjukkan pelan yang betul pada hari yang betul. Tiada apa-apa di sini dikongsi di luar rawatan anda.',
    nameLabel: 'Nama penuh anda',
    namePlaceholder: 'Seperti dalam surat temu janji anda',
    nameMissing: 'Sila masukkan nama anda.',
    dateLabel: 'Tarikh kolonoskopi anda',
    dateHint: 'Keseluruhan pelan dikira daripada tarikh ini, jadi ia mesti betul.',
    dateMissing: 'Sila masukkan tarikh kolonoskopi anda.',
    dateUnreadable: 'Tarikh itu tidak dapat dibaca. Gunakan pemilih tarikh.',
    datePast: 'Tarikh itu sudah berlalu. Sila semak surat temu janji anda.',
    dateTooFar: 'Tarikh itu lebih tiga tahun dari sekarang. Sila semak semula.',
    submit: 'Simpan dan teruskan',
    saving: 'Menyimpan…',
    editTitle: 'Butiran anda',
    editIntro: 'Ubah mana-mana satu dan pelan akan dikemas kini serta-merta.',
    editSubmit: 'Simpan perubahan',
    cancel: 'Batal',
    saved: 'Disimpan.',
    saveFailed: 'Butiran itu tidak dapat disimpan. Sila cuba lagi.',
  },

  reminders: {
    heading: 'Peringatan di Telegram',
    blurb:
      'Dos kedua pada pukul 2 pagi dan itulah yang paling kerap terlepas. Sambungkan Telegram dan kami akan menghantar mesej setengah jam sebelum setiap dos — walaupun telefon anda senyap sepanjang malam.',
    connect: 'Sambungkan Telegram',
    connected: 'Telegram telah disambungkan. Anda akan dimesej sebelum setiap dos.',
    stopped: 'Peringatan dihentikan. Sambung semula untuk menghidupkannya.',
    unavailable: 'Peringatan belum disediakan pada pemasangan ini.',
    linkExpired: 'Pautan itu telah tamat tempoh. Buka aplikasi dan tekan Sambungkan Telegram sekali lagi.',
    botLinked:
      'Tersambung. Saya akan menghantar mesej setengah jam sebelum setiap dos penyediaan usus anda. Hantar /stop bila-bila masa untuk mematikannya.',
    botStopped: 'Peringatan dimatikan. Anda tidak akan menerima mesej lagi daripada saya.',
    botUnknown:
      'Saya tidak mengenali pautan itu. Buka aplikasi Clarity, log masuk, dan tekan Sambungkan Telegram.',
    titleFirst: 'Dos pertama pada {time}',
    titleSecond: 'Dos kedua pada {time}',
    lead: 'Penyediaan usus anda bermula dalam 30 minit.',
    body: 'Buka Clarity untuk langkah penuh.',
    footer: 'Hantar /stop untuk mematikan peringatan',
  },
  tabs: {
    home: 'Utama',
    plan: 'Pelan',
    diet: 'Diet',
    ask: 'Tanya',
    verify: 'Semak',
  },

  common: {
    back: 'Kembali',
    close: 'Tutup',
    changeDetails: 'Ubah butiran anda',
  },
}

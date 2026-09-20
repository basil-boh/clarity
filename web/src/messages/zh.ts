import type { Dictionary } from './en'

/**
 * 简体中文 · Simplified Chinese, as written in Singapore.
 *
 * MACHINE-TRANSLATED AND UNREVIEWED. See the note in `en.ts`.
 */
export const zh: Dictionary = {
  language: {
    question: '您的语言',
    hint: '选择后界面会立即更改。',
  },

  welcome: {
    title: '开始之前',
    intro: '三项资料，让应用在正确的日子显示正确的计划。这些资料不会在您的医疗团队以外分享。',
    nameLabel: '您的全名',
    namePlaceholder: '与预约信上的姓名相同',
    nameMissing: '请输入您的姓名。',
    dateLabel: '您的肠镜检查日期',
    dateHint: '整个计划都根据这个日期推算，请确保正确。',
    dateMissing: '请输入您的肠镜检查日期。',
    dateUnreadable: '无法读取该日期。请使用日期选择器。',
    datePast: '该日期已过。请核对您的预约信。',
    dateTooFar: '该日期在三年以后。请再次核对。',
    submit: '保存并继续',
    saving: '保存中…',
    editTitle: '您的资料',
    editIntro: '更改任何一项，计划会立即更新。',
    editSubmit: '保存更改',
    cancel: '取消',
    saved: '已保存。',
    saveFailed: '无法保存。请再试一次。',
  },

  reminders: {
    heading: 'Telegram 提醒',
    blurb:
      '第二剂在凌晨两点，也是最常被遗漏的一剂。连接 Telegram，我们会在每一剂前半小时提醒您——即使您的手机整夜静音。',
    connect: '连接 Telegram',
    connected: 'Telegram 已连接。每一剂前我们都会提醒您。',
    stopped: '提醒已停止。重新连接即可再次开启。',
    unavailable: '此部署尚未设置提醒功能。',
    linkExpired: '该链接已过期。请打开应用，再次点击「连接 Telegram」。',
    botLinked:
      '已连接。我会在您每一剂肠道清洁剂前半小时提醒您。随时发送 /stop 即可关闭。',
    botStopped: '提醒已关闭。我不会再发送任何消息。',
    botUnknown:
      '无法识别该链接。请打开 Clarity 应用登录，然后点击「连接 Telegram」。',
    titleFirst: '第一剂 {time}',
    titleSecond: '第二剂 {time}',
    lead: '您的肠道准备将在 30 分钟后开始。',
    body: '请打开 Clarity 查看详细步骤。',
    footer: '发送 /stop 可关闭提醒',
  },
  tabs: {
    home: '首页',
    plan: '计划',
    diet: '饮食',
    ask: '询问',
    verify: '查验',
  },

  common: {
    back: '返回',
    close: '关闭',
    changeDetails: '更改您的资料',
  },
}

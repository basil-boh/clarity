import test from 'node:test'
import assert from 'node:assert/strict'
import { createI18n } from './translate.ts'
import { PATIENT_COPY } from '../messages/patient-copy.ts'
import { buildPlan, PHASE_COPY, dosesFor } from './prep.ts'
import { FLAG_COPY, PREP_REPORTS } from './readiness.ts'
import { DIET_ANSWERS } from './progress.ts'
import { CLARITIES, COLOURS, CONSISTENCIES, REASONS, REASON_HINTS, guidanceFor } from './stool-check.ts'
import { DIET_FOODS } from './diet-foods.ts'
import { zhFoods } from '../messages/foods/zh.ts'
import { msFoods } from '../messages/foods/ms.ts'
import { taFoods } from '../messages/foods/ta.ts'

const languages = ['zh', 'ms', 'ta']
const slots = text => [...text.matchAll(/\{(\w+)\}/g)].map(match => match[1]).sort()

test('every catalogue entry has all three translations with identical placeholders', () => {
  for (const [english, values] of Object.entries(PATIENT_COPY)) {
    assert.equal(values.length, 3, english)
    for (const translation of values) {
      assert.ok(translation.trim(), english)
      assert.deepEqual(slots(translation), slots(english), english)
    }
  }
})

test('all preparation phases, steps, doses and readiness options translate without changing IDs', () => {
  const plan = buildPlan('2026-10-12', new Date('2026-10-05T00:00:00Z'))
  const labels = [
    ...Object.values(PHASE_COPY).flatMap(p => [p.name, p.blurb]),
    ...plan.flatMap(day => day.steps.flatMap(step => [step.title, step.detail].filter(Boolean))),
    ...dosesFor().flatMap(dose => [dose.label, dose.note]),
    ...Object.values(FLAG_COPY).flatMap(copy => [copy.title, copy.detail]),
    ...Object.values(PREP_REPORTS), ...DIET_ANSWERS.map(a => a.label),
    ...Object.values(CLARITIES), ...Object.values(COLOURS), ...Object.values(CONSISTENCIES),
    ...Object.values(REASONS), ...Object.values(REASON_HINTS),
  ]
  for (const language of languages) {
    const { tx } = createI18n(language)
    for (const english of labels) assert.notEqual(tx(english), english, `${language}: ${english}`)
  }
  assert.equal(plan[0].steps[0].uid, '-7:confirm-meds')
})

test('each stool guidance branch translates both title and explanation', () => {
  for (const colour of Object.keys(COLOURS)) for (const consistency of Object.keys(CONSISTENCIES)) {
    for (const clarity of [null, ...Object.keys(CLARITIES)]) {
      const guidance = guidanceFor({ colour, consistency, clarity, reason: 'colour' })
      for (const language of languages) {
        const { tx } = createI18n(language)
        assert.notEqual(tx(guidance.title), guidance.title)
        assert.notEqual(tx(guidance.detail), guidance.detail)
      }
    }
  }
})

test('food translations cover every displayed food and category', () => {
  for (const dictionary of [zhFoods, msFoods, taFoods]) for (const food of DIET_FOODS) {
    assert.ok(dictionary.foods[food.id]?.food, food.id)
    assert.ok(dictionary.categories[food.category], food.category)
  }
})

test('counts, dates, whitespace and user text survive translation', () => {
  const { tx, dateFormat } = createI18n('zh')
  assert.equal(tx('3 of 8 glasses recorded'), '已记录 3 杯，共 8 杯')
  assert.equal(tx('Hello, {0}.', { 0: 'Siti Rahman' }), '您好，Siti Rahman。')
  assert.equal(tx('I drank a glass'), '我喝了一杯')
  assert.equal(tx('Siti Rahman'), 'Siti Rahman')
  assert.equal(tx('+6591234567'), '+6591234567')
  assert.equal(tx(''), '')
  assert.equal(tx(null), null)
  assert.equal(tx(1500), 1500)
  assert.equal(tx('   '), '   ')
  assert.match(dateFormat(new Date(2026, 9, 12), 'EEEE d MMMM yyyy'), /星期|周/)
  assert.equal(createI18n('en').tx('  I drank a glass  '), '  I drank a glass  ')
})

test('every literal passed to tx in patient screens is present in the catalogue', async () => {
  const { readdir, readFile } = await import('node:fs/promises')
  const ts = (await import('typescript')).default
  const roots = ['../components/', '../app/(patient)/', '../app/sign-in/', '../app/sign-out/', '../app/welcome/', '../app/qr/']
  for (const root of roots) {
    const directory = new URL(root, import.meta.url)
    const files = await readdir(directory, { recursive: true })
    for (const file of files.filter(name => name.endsWith('.tsx'))) {
      const contents = await readFile(new URL(file, directory), 'utf8')
      const source = ts.createSourceFile(file, contents, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
      function visit(node) {
        if (ts.isCallExpression(node) && node.expression.getText(source) === 'tx' && node.arguments[0] && ts.isStringLiteral(node.arguments[0])) {
          const english = node.arguments[0].text
          if (/[A-Za-z]/.test(english)) assert.ok(Object.hasOwn(PATIENT_COPY, english), `${file}: ${english}`)
        }
        ts.forEachChild(node, visit)
      }
      visit(source)
    }
  }
})

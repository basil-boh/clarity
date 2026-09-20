import test from 'node:test'
import assert from 'node:assert/strict'
import { DIET_FOODS } from './diet-foods.ts'
import { foodStatus, getFoodGroups } from './diet.ts'

const food = (name) => {
  const found = DIET_FOODS.find(item => item.food === name)
  assert.ok(found, name)
  return found
}

test('imports every workbook row and preserves category order', () => {
  assert.equal(DIET_FOODS.length, 102)
  assert.deepEqual(DIET_FOODS.map(f => f.sourceRow), Array.from({ length: 102 }, (_, i) => i + 2))
  assert.equal(new Set(DIET_FOODS.map(f => f.id)).size, 102)
  assert.deepEqual([...new Set(DIET_FOODS.map(f => f.category))], [
    'Grains & starches', 'Meat & protein', 'Dairy & alternatives', 'Fruit & juice',
    'Vegetables', 'Snacks & desserts', 'Local dishes', 'Sauces & condiments', 'Clear liquids',
  ])
})

// Independent expected totals from the source workbook, before any name merging.
for (const [preference, day, allowed, avoid] of [
  ['General', 'low-residue', 55, 26], ['General', 'clear-liquid', 10, 76],
  ['Vegetarian', 'low-residue', 45, 35], ['Vegetarian', 'clear-liquid', 8, 78],
  ['Vegan', 'low-residue', 27, 49], ['Vegan', 'clear-liquid', 7, 76],
]) {
  test(`${preference}, ${day}: workbook totals and check exclusions`, () => {
    const groups = getFoodGroups(day, preference)
    assert.equal(groups.reduce((sum, group) => sum + group.allowed.length, 0), allowed)
    assert.equal(groups.reduce((sum, group) => sum + group.avoid.length, 0), avoid)
    const visible = groups.flatMap(group => [...group.allowed, ...group.avoid])
    assert.equal(new Set(visible.map(f => f.id)).size, visible.length)
    assert.ok(visible.every(f => !f.statuses[preference].startsWith('Check')))
    assert.ok(groups.every(g => g.allowed.length + g.avoid.length > 0))
  })
}

test('phase inheritance preserves low-residue permissions', () => {
  for (const name of ['White rice', 'Milo', 'Soy milk (strained)']) {
    assert.equal(foodStatus(food(name), 'low-residue', 'General'), 'Allowed')
    assert.equal(foodStatus(food(name), 'clear-liquid', 'General'), 'Avoid')
  }
  for (const day of ['low-residue', 'clear-liquid']) {
    assert.equal(foodStatus(food('Water'), day, 'General'), 'Allowed')
    assert.equal(foodStatus(food('Isotonic / electrolyte drinks'), day, 'General'), 'Allowed')
    assert.equal(foodStatus(food('Brown / red rice'), day, 'General'), 'Avoid')
  }
  assert.equal(foodStatus(food('Soy milk'), 'low-residue', 'General'), null)
  assert.equal(foodStatus(food('Soy milk'), 'clear-liquid', 'General'), 'Avoid')
})

test('check statuses depend only on the selected preference and take priority over phase', () => {
  for (const day of ['low-residue', 'clear-liquid']) {
    assert.equal(foodStatus(food('White bread'), day, 'Vegan'), null)
    assert.equal(foodStatus(food('Milk'), day, 'General'), null)
  }
  assert.equal(foodStatus(food('White bread'), 'low-residue', 'General'), 'Allowed')
  assert.equal(foodStatus(food('Chicken'), 'low-residue', 'General'), 'Allowed')
  assert.equal(foodStatus(food('Fishballs / fishcake / luncheon meat'), 'low-residue', 'Vegetarian'), 'Avoid')
})

test('vegetarian and vegan restrictions follow workbook columns', () => {
  assert.equal(foodStatus(food('Fish'), 'low-residue', 'Vegetarian'), 'Avoid')
  assert.equal(foodStatus(food('Eggs'), 'low-residue', 'Vegetarian'), 'Allowed')
  assert.equal(foodStatus(food('Eggs'), 'low-residue', 'Vegan'), 'Avoid')
  assert.equal(foodStatus(food('Honey'), 'clear-liquid', 'Vegetarian'), 'Allowed')
  assert.equal(foodStatus(food('Honey'), 'clear-liquid', 'Vegan'), 'Avoid')
})

test('empty categories disappear, while avoid-only categories remain', () => {
  assert.deepEqual(getFoodGroups('low-residue', 'General', [food('Milk')]), [])
  const groups = getFoodGroups('clear-liquid', 'General', [food('White rice')])
  assert.equal(groups.length, 1)
  assert.deepEqual(groups[0].allowed, [])
  assert.equal(groups[0].avoid[0].food, 'White rice')
})

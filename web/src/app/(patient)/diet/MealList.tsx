'use client'

import { useState } from 'react'
import { Card, Field, Select } from '@/components/ui'
import { Icon } from '@/components/Icon'
import { FOOD_CATEGORIES, getFoodGroups, type DietPreference, type PrepDay } from '@/domain/diet'

export function MealList() {
  const [day, setDay] = useState<PrepDay>('low-residue')
  const [preference, setPreference] = useState<DietPreference>('General')
  const [category, setCategory] = useState('all')
  const groups = getFoodGroups(day, preference).filter(group => category === 'all' || group.category === category)
  const allowedCount = groups.reduce((total, group) => total + group.allowed.length, 0)
  const avoidCount = groups.reduce((total, group) => total + group.avoid.length, 0)

  return (
    <>
      <div className="mb-6 grid gap-4 sm:grid-cols-2">
        <Field label="Prep day">
          <Select value={day} onChange={(event) => setDay(event.target.value as PrepDay)}>
            <option value="low-residue">Low residue day</option>
            <option value="clear-liquid">Clear liquid day</option>
          </Select>
        </Field>
        <Field label="Diet preference">
          <Select value={preference} onChange={(event) => setPreference(event.target.value as DietPreference)}>
            <option value="General">General</option>
            <option value="Vegetarian">Vegetarian</option>
            <option value="Vegan">Vegan</option>
          </Select>
        </Field>
        <div className="sm:col-span-2">
          <Field label="Food category">
            <Select value={category} onChange={(event) => setCategory(event.target.value)}>
              <option value="all">All categories</option>
              {FOOD_CATEGORIES.map(name => <option key={name} value={name}>{name}</option>)}
            </Select>
          </Field>
        </div>
      </div>

      <p role="status" aria-live="polite" aria-atomic="true" className="mb-4 text-[15px] text-ink-muted">
        {allowedCount} foods you can eat · {avoidCount} to avoid
      </p>
      <div className="space-y-5" key={`${day}-${preference}-${category}`}>
        {groups.map((group) => (
          <Card key={group.category}>
            <h2 className="text-[21px] font-semibold tracking-[-0.018em] text-ink">{group.category}</h2>
            {group.allowed.length === 0 ? (
              <p className="mt-4 text-[17px] leading-relaxed text-ink-muted">
                You are not allowed to eat this category of the food
              </p>
            ) : (
              <>
                <div className="mt-4">
                  <h3 className="flex items-center gap-2 text-[15px] font-semibold text-blue-deep">
                    <Icon name="check-check" size={18} /> You can eat
                  </h3>
                  <ul className="mt-2 flex flex-wrap items-start gap-2">
                    {group.allowed.map((item) => (
                      <li key={item.id} className="max-w-full rounded-lg border border-blue/15 bg-blue-wash px-3 py-2 text-[15px] leading-relaxed text-ink">
                        {item.food}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-5 border-t border-hairline pt-4">
                  <h3 className="flex items-center gap-2 text-[15px] font-semibold text-ink-muted">
                    <Icon name="ban" size={18} /> Avoid
                  </h3>
                  {group.avoid.length ? (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {group.avoid.map((item) => (
                        <li key={item.id} className="max-w-full rounded-lg border border-hairline px-3 py-2 text-[15px] leading-relaxed text-ink-muted">
                          {item.food}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-2 text-[15px] text-ink-muted">No foods listed to avoid in this category.</p>
                  )}
                </div>
              </>
            )}
          </Card>
        ))}
        {!groups.length && <p className="text-ink-muted">No foods listed for this selection.</p>}
      </div>
    </>
  )
}

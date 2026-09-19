import { Card, Notice, SectionTitle } from '@/components/ui'
import { NoRecord } from '@/components/NoRecord'
import { Icon, type IconName } from '@/components/Icon'
import { DIET_RULES, FOOD_GROUPS, RED_NOTE } from '@/domain/diet'
import { findPatient } from '@/lib/patients'
import { requireSession } from '@/lib/session'

export const metadata = { title: 'Diet — Clarity' }

/**
 * What can be eaten, in the food the patient actually eats.
 *
 * Allowed and avoided sit in the same panel rather than on separate screens,
 * because the question is never "what is allowed" in the abstract — it is
 * "can I have this", asked while standing in front of it.
 */
export default async function Diet() {
  const session = await requireSession()
  const patient = await findPatient(session.phone)
  if (!patient) return <NoRecord phone={session.phone} />

  return (
    <>
      <header className="mb-6">
        <h1 className="text-[30px] font-bold leading-[1.1] tracking-[-0.03em] text-ink">
          Low residue
        </h1>
        <p className="mt-2 text-[17px] leading-relaxed text-ink-muted">
          For the three days before your scope. Low residue means food that leaves as little behind
          as possible.
        </p>
      </header>

      <div className="mb-6">
        <Notice>{RED_NOTE}</Notice>
      </div>

      <SectionTitle>The three rules</SectionTitle>
      <Card className="mb-6">
        <ul className="divide-y divide-hairline">
          {DIET_RULES.map((rule) => (
            <li key={rule.label} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <Icon name={rule.icon as IconName} size={22} className="shrink-0 text-flag-red" />
              <p className="text-[17px] font-semibold tracking-[-0.012em] text-ink">{rule.label}</p>
            </li>
          ))}
        </ul>
      </Card>

      <SectionTitle>By food group</SectionTitle>
      <div className="space-y-4">
        {FOOD_GROUPS.map((group) => (
          <Card key={group.id}>
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="flex items-center gap-2.5 text-[19px] font-semibold tracking-[-0.018em] text-ink">
                <Icon name={group.icon as IconName} size={20} className="shrink-0 text-blue" />
                {group.title}
              </h2>
              <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-ink-faint">
                {group.label}
              </span>
            </div>

            <div className="mt-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-flag-green">
                Yes
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {group.allowed.map((item) => (
                  <li
                    key={item}
                    className="border border-flag-green/30 bg-flag-green-tint px-2.5 py-1 text-[15px] text-flag-green"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-4">
              <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-ink-faint">
                Not this week
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {group.avoid.map((item) => (
                  <li
                    key={item}
                    className="border border-hairline px-2.5 py-1 text-[15px] text-ink-faint line-through decoration-hairline-strong"
                  >
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <h3 className="text-[17px] font-semibold text-ink">Not on the list?</h3>
        <p className="mt-1.5 text-[15px] leading-relaxed text-ink-muted">
          Guidance differs between hospitals, so when it matters your department&rsquo;s answer is
          the one that applies to you.
        </p>
        <a
          href={`tel:${patient.procedure.departmentPhone}`}
          className="mt-4 inline-flex min-h-[48px] w-full items-center justify-center rounded-lg border border-hairline-strong px-4 text-[16px] font-semibold text-ink"
        >
          Call the department
        </a>
      </Card>
    </>
  )
}

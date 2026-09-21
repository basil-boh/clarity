import { dateFromToday } from '@/domain/prep'
import { requireAdmin } from '@/lib/admin'
import { formatPhone } from '@/lib/phone'
import { usingDatabase } from '@/lib/source'

import { ALL_PATIENTS, AdminHeader, NoDatabase } from '../../AdminShell'
import { PatientForm } from '../../PatientForm'

export const metadata = { title: 'Add a patient — Colonaid admin' }

export default async function NewPatient() {
  await requireAdmin()

  return (
    <>
      <AdminHeader title="Add a patient" back={ALL_PATIENTS} />
      {usingDatabase() ? (
        <PatientForm
          mode="create"
          initial={{
            phone: '',
            displayName: '',
            reader: 'patient',
            // Diet days: the stretch with the most on screen to check.
            date: dateFromToday(3),
            arriveAt: '08:30',
            hospital: 'Singapore General Hospital',
            location: 'Block 3, Level 4 — Endoscopy Centre',
            departmentPhone: formatPhone('+6563265656'),
          }}
        />
      ) : (
        <NoDatabase />
      )}
    </>
  )
}

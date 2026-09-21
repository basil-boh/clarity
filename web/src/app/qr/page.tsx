import { getI18n } from '@/lib/i18n-server'
import QRCode from 'qrcode'

import { Wordmark } from '@/components/brand'

/**
 * The square the patient scans.
 *
 * Printed on the appointment letter and stuck to the wall of the endoscopy
 * clinic, so it renders as a clean sheet with no app chrome: scan target, the
 * URL in readable text underneath for anyone whose camera will not cooperate,
 * and nothing else. `@media print` strips the rest.
 */
export async function generateMetadata() {
  const { tx } = await getI18n()
  return { title: tx('Colonaid — QR code for printing') }
}

export default async function Qr() {
  const { tx } = await getI18n()

  const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const svg = await QRCode.toString(site, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 0,
    color: { dark: '#0D0F14', light: '#FFFFFF' },
  })

  return (
    <div>
      <main id="main" className="mx-auto w-full max-w-[520px] px-6 pb-14 pt-10 text-center">
      <div className="flex justify-center">
        <Wordmark width={160} />
      </div>
      <h1 className="mt-6 text-[30px] font-bold leading-[1.1] tracking-[-0.03em] text-ink">{tx("Your colonoscopy preparation")}</h1>
      <p className="mx-auto mt-3 max-w-[38ch] text-[17px] leading-relaxed text-ink-muted">{tx("Scan this with your phone camera. Sign in with the mobile number the endoscopy hospital/clinic has on file.")}</p>

      <div
        className="mx-auto mt-9 w-[248px] rounded-xl border border-hairline bg-paper p-5"
        // qrcode returns a self-contained <svg>; there is no user input in it.
        dangerouslySetInnerHTML={{ __html: svg }}
      />

      <p className="mt-6 break-all text-[16px] font-semibold text-ink">{tx(site)}</p>

      <p className="mt-10 border-t border-hairline pt-5 text-[14px] leading-relaxed text-ink-faint">{tx("This app supports your preparation. It does not replace your care team. In an emergency, call 995.")}</p>
      </main>
    </div>
  )
}

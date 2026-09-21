import 'server-only'
import { readLanguage } from './language'
import { createI18n } from '@/domain/translate'

export async function getI18n() {
  return createI18n(await readLanguage())
}

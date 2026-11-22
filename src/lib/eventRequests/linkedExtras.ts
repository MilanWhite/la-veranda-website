import type { EventMenu } from '../../payload-types'

// An extra and an answer to an "Additional details" question with the same name are one
// choice, e.g. the "Open Bar" extra and Alcohol → "Open Bar". Ticking one selects the other,
// and picking another answer (Pay per consumption) unticks the extra. Used by the form and,
// so a request can never say both, by the server check.

export type ExtraLink = {
  /** The question, e.g. "alcohol" */
  choiceKey: string
  /** Its answer with the same name as the extra ("Open Bar") */
  optionId: string
  /** The answer used when the extra is off ("Pay per consumption"); also the default */
  offOptionId: string
  extraId: string
}

const same = (a?: string | null, b?: string | null) =>
  Boolean(a?.trim() && b?.trim() && a.trim().toLowerCase() === b.trim().toLowerCase())

export function extraLinks(menu: EventMenu): ExtraLink[] {
  const extras = (menu.extras ?? []).filter((e) => e.available !== false && e.id)
  const links: ExtraLink[] = []
  for (const choice of menu.choices ?? []) {
    const options = (choice.options ?? []).filter((o) => o.id)
    for (const option of options) {
      const extra = extras.find((e) => same(e.name, option.label))
      const off = options.find((o) => o.id !== option.id)
      if (extra && off) {
        links.push({
          choiceKey: choice.key,
          optionId: option.id!,
          offOptionId: off.id!,
          extraId: extra.id!,
        })
      }
    }
  }
  return links
}

/** Each question's starting answer: the "off" answer for linked ones, otherwise the first. */
export function defaultChoices(menu: EventMenu) {
  const links = extraLinks(menu)
  return Object.fromEntries(
    (menu.choices ?? []).map((c) => [
      c.key,
      links.find((l) => l.choiceKey === c.key)?.offOptionId ?? c.options?.[0]?.id ?? '',
    ]),
  )
}

import type { Menu } from '@/payload-types'
import { formatPrice, slugify } from '../lib/content'

type Section = NonNullable<Menu['sections']>[number]
type Item = NonNullable<Section['items']>[number]
type AddOn = { label: string; price: number; id?: string | null }

function AddOns({ addOns }: { addOns?: AddOn[] | null }) {
  if (!addOns?.length) return null
  return (
    <ul className="menu-addons">
      {addOns.map((a) => (
        <li key={a.id ?? a.label}>
          {a.label} <span>+{formatPrice(a.price)}</span>
        </li>
      ))}
    </ul>
  )
}

function price(item: Item) {
  if (item.variants?.length) {
    return item.variants.map((v) => `${v.label} ${formatPrice(v.price)}`).join(' · ')
  }
  if (item.price == null) return null
  return item.priceLabel
    ? `${item.priceLabel} – ${formatPrice(item.price)}`
    : formatPrice(item.price)
}

function MenuItem({ item }: { item: Item }) {
  const value = price(item)
  return (
    <div className="dish">
      <div className="leader-row">
        <h3>{item.name}</h3>
        <span className="leader-line" />
        {value && <span className="leader-value">{value}</span>}
      </div>
      {item.description && <p>{item.description}</p>}
      <AddOns addOns={item.addOns} />
    </div>
  )
}

export function sectionId(section: Section) {
  return slugify(section.title)
}

function MenuSection({ section }: { section: Section }) {
  const items = section.items?.filter((i) => i.available !== false) ?? []
  if (!items.length) return null
  return (
    <section
      id={sectionId(section)}
      className={section.isSubgroup ? 'menu-section menu-subgroup' : 'menu-section'}
    >
      {section.isSubgroup ? (
        <h3 className="menu-subgroup-title">{section.title}</h3>
      ) : (
        <h2 className="eyebrow eyebrow-accent menu-section-title">{section.title}</h2>
      )}
      {section.description && <p className="menu-section-description">{section.description}</p>}
      {items.map((item) => (
        <MenuItem key={item.id} item={item} />
      ))}
      <AddOns addOns={section.addOns} />
      {section.note && <p className="menu-note">({section.note})</p>}
    </section>
  )
}

// A section plus the sub-groups that follow it (e.g. Savouries + Benedicts + Skillets),
// so a sub-group always stays in the same column as its parent.
function groupBlocks(sections: Section[]) {
  const blocks: Section[][] = []
  for (const section of sections) {
    if (section.isSubgroup && blocks.length) blocks[blocks.length - 1].push(section)
    else blocks.push([section])
  }
  return blocks.filter((b) => b.some((s) => s.items?.some((i) => i.available !== false)))
}

// Rendered height of a block in px at desktop width, measured from the real pages
// (dish ≈ 66px without description, 95px with one line, +24px per extra line).
function estimateHeight(block: Section[]) {
  const lines = (text?: string | null) => (text ? Math.ceil(text.length / 80) : 0)
  return block.reduce((total, s) => {
    const items = s.items?.filter((i) => i.available !== false) ?? []
    const dishes = items.reduce((sum, i) => {
      const descLines = lines(i.description)
      const dish = descLines ? 65 + (descLines - 1) * 24 : 36
      return sum + dish + 30 + (i.addOns?.length ?? 0) * 22
    }, 0)
    return (
      total +
      (s.isSubgroup ? 90 + lines(s.description) * 26 : 84 + lines(s.description) * 30) +
      (s.addOns?.length ? 30 + s.addOns.length * 22 : 0) +
      (s.note ? 58 : 0) +
      dishes
    )
  }, 0)
}

type Placed = { block: Section[]; order: number }

// Splits the blocks between two columns so both end at about the same height (no gaps
// between sections). Every left/right split is tried (fine for menu-sized lists); each
// column keeps menu order. The first block always starts the left column.
function toColumns(blocks: Section[][]) {
  const heights = blocks.map(estimateHeight)
  const n = blocks.length
  let best = 0
  let bestDiff = Infinity
  if (n <= 16) {
    for (let mask = 0; mask < 1 << n; mask++) {
      if (mask & 1) continue // block 0 on the left
      let diff = 0
      for (let i = 0; i < n; i++) diff += mask & (1 << i) ? -heights[i] : heights[i]
      if (Math.abs(diff) < bestDiff) {
        bestDiff = Math.abs(diff)
        best = mask
      }
    }
  }
  const columns: Placed[][] = [[], []]
  blocks.forEach((block, order) => columns[best & (1 << order) ? 1 : 0].push({ block, order }))
  return columns
}

function Block({ block, order }: { block: Section[]; order?: number }) {
  return (
    <div className="menu-block" style={order === undefined ? undefined : { order }}>
      {block.map((section) => (
        <MenuSection key={section.id ?? section.title} section={section} />
      ))}
    </div>
  )
}

// All sections of a menu. With `columns`, wide screens show two balanced columns; on small
// screens the columns dissolve and `order` restores the original menu order.
export function MenuSections({
  sections,
  columns = false,
}: {
  sections: Menu['sections']
  columns?: boolean
}) {
  const blocks = groupBlocks(sections ?? [])
  if (!columns) {
    return (
      <div>
        {blocks.map((block) => (
          <Block key={block[0].id ?? block[0].title} block={block} />
        ))}
      </div>
    )
  }
  return (
    <div className="menu-columns">
      {toColumns(blocks).map((column, c) => (
        <div key={c} className="menu-column">
          {column.map(({ block, order }) => (
            <Block key={block[0].id ?? block[0].title} block={block} order={order} />
          ))}
        </div>
      ))}
    </div>
  )
}

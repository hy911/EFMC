import { getPayload, type Payload } from 'payload'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

import config from '@/payload.config'
import { FeatureColumns } from '@/components/ui/FeatureColumns'

// vitest 未开 test.globals，RTL 的自动 cleanup 探测不到全局 afterEach，需手动挂
afterEach(cleanup)

let payload: Payload

describe('首页优势区（SiteSettings.homeAdvantage）', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config })
  })

  it('可写入四栏并按语种回读', async () => {
    const written = await payload.updateGlobal({
      slug: 'site-settings',
      locale: 'en',
      data: {
        homeAdvantage: {
          eyebrow: 'Company Advantage',
          heading: 'Why customers specify Donglin',
          columns: [
            {
              kicker: 'INTEGRATED SOLUTIONS',
              title: 'Software-Hardware Synergy',
              items: [{ text: 'PLC/HMI/SCADA programming & commissioning' }],
              footnote: 'Achieves 30% communication load reduction via AI optimization',
            },
            {
              kicker: 'OEM/ODM SERVICES',
              title: 'End-to-End Customization',
              items: [{ label: 'HARDWARE', text: 'IP66-rated control cabinets & modular layouts' }],
            },
          ],
        },
      },
    })

    const columns = written.homeAdvantage?.columns ?? []
    expect(columns).toHaveLength(2)
    expect(columns[0]?.items?.[0]?.text).toBe('PLC/HMI/SCADA programming & commissioning')
    expect(columns[1]?.items?.[0]?.label).toBe('HARDWARE')
  })

  it('写 zh 时带上行 id 不会冲掉 en 内容', async () => {
    const en = await payload.findGlobal({ slug: 'site-settings', locale: 'en' })
    const enColumns = en.homeAdvantage?.columns ?? []
    expect(enColumns.length).toBeGreaterThan(0)

    // 关键：带上原有行 id，否则数组被重建、en 值全丢
    await payload.updateGlobal({
      slug: 'site-settings',
      locale: 'zh',
      data: {
        homeAdvantage: {
          columns: enColumns.map((col) => ({
            id: col.id,
            title: `中文-${col.title}`,
            items: (col.items ?? []).map((item) => ({ id: item.id, text: `中文-${item.text}` })),
          })),
        },
      },
    })

    const enAfter = await payload.findGlobal({ slug: 'site-settings', locale: 'en' })
    expect(enAfter.homeAdvantage?.columns?.[0]?.title).toBe('Software-Hardware Synergy')

    const zhAfter = await payload.findGlobal({ slug: 'site-settings', locale: 'zh' })
    expect(zhAfter.homeAdvantage?.columns?.[0]?.title).toBe('中文-Software-Hardware Synergy')
  })
})

describe('FeatureColumns 组件', () => {
  const columns = [
    {
      id: 'a',
      kicker: 'INTEGRATED SOLUTIONS',
      title: 'Software-Hardware Synergy',
      items: [{ id: 'a1', text: 'PLC/HMI/SCADA programming & commissioning' }],
      footnote: 'Achieves 30% communication load reduction',
    },
    {
      id: 'b',
      title: 'End-to-End Customization',
      items: [{ id: 'b1', label: 'HARDWARE', text: 'IP66-rated control cabinets' }],
    },
  ]

  it('渲染 kicker、标题、要点与脚注', () => {
    render(<FeatureColumns columns={columns} />)
    expect(screen.getByText('INTEGRATED SOLUTIONS')).toBeDefined()
    expect(screen.getByText('Software-Hardware Synergy')).toBeDefined()
    expect(screen.getByText(/PLC\/HMI\/SCADA/)).toBeDefined()
    expect(screen.getByText(/30% communication load reduction/)).toBeDefined()
  })

  it('要点的加粗前缀渲染为 strong', () => {
    render(<FeatureColumns columns={columns} />)
    const label = screen.getByText('HARDWARE')
    expect(label.tagName).toBe('STRONG')
  })

  it('kicker 与 footnote 缺省时不渲染空节点', () => {
    const { container } = render(<FeatureColumns columns={[columns[1]!]} />)
    expect(container.querySelectorAll('[data-kicker]')).toHaveLength(0)
    expect(container.querySelectorAll('[data-footnote]')).toHaveLength(0)
  })

  it('栏目为空时整体不渲染', () => {
    const { container } = render(<FeatureColumns columns={[]} />)
    expect(container.firstChild).toBeNull()
  })
})

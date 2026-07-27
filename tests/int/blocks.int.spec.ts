import { getPayload, type Payload } from 'payload'
import { beforeAll, describe, expect, it } from 'vitest'

import config from '@/payload.config'

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

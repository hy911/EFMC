import { getPayload, type Payload } from 'payload'
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'

import config from '@/payload.config'
import { FeatureColumns } from '@/components/ui/FeatureColumns'
import { LogoStrip } from '@/components/ui/LogoStrip'
import { MediaVideo } from '@/components/ui/MediaVideo'
import { SectionHeader } from '@/components/ui/SectionHeader'
import type { SiteSetting } from '@/payload-types'

// vitest 未开 test.globals，RTL 的自动 cleanup 探测不到全局 afterEach，需手动挂
afterEach(cleanup)

let payload: Payload

describe('首页优势区（SiteSettings.homeAdvantage）', () => {
  // 这组测试会真写 site-settings 这个 global（localized 字段），会污染运营/seed 数据
  // 且被后续 e2e 断言依赖 —— 必须快照原值、跑完原样写回（两个语种都要）
  let originalEn: SiteSetting['homeAdvantage']
  let originalZh: SiteSetting['homeAdvantage']

  beforeAll(async () => {
    payload = await getPayload({ config: await config })
    originalEn = (await payload.findGlobal({ slug: 'site-settings', locale: 'en' })).homeAdvantage
    originalZh = (await payload.findGlobal({ slug: 'site-settings', locale: 'zh' })).homeAdvantage
  })

  afterAll(async () => {
    // 带上原有行 id 写回，避免 localized 数组被重建冲掉数据（本项目反复踩过的坑）
    await payload.updateGlobal({
      slug: 'site-settings',
      locale: 'en',
      data: {
        homeAdvantage: originalEn
          ? {
              ...originalEn,
              columns: (originalEn.columns ?? []).map((col) => ({
                ...col,
                items: (col.items ?? []).map((item) => ({ ...item })),
              })),
            }
          : { eyebrow: null, heading: null, columns: [] },
      },
    })
    await payload.updateGlobal({
      slug: 'site-settings',
      locale: 'zh',
      data: {
        homeAdvantage: originalZh
          ? {
              ...originalZh,
              columns: (originalZh.columns ?? []).map((col) => ({
                ...col,
                items: (col.items ?? []).map((item) => ({ ...item })),
              })),
            }
          : { eyebrow: null, heading: null, columns: [] },
      },
    })
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

describe('SectionHeader 组件', () => {
  it('传了 eyebrow 时渲染小标题', () => {
    const { container } = render(<SectionHeader eyebrow="Company Advantage" title="标题" />)
    expect(screen.getByText('Company Advantage')).toBeDefined()
    expect(container.querySelector('.uppercase')).not.toBeNull()
  })

  it('eyebrow 为空/未传时不渲染那个 div，避免留白', () => {
    const { container: withoutProp } = render(<SectionHeader title="标题" />)
    expect(withoutProp.querySelector('.uppercase')).toBeNull()

    const { container: withEmptyString } = render(<SectionHeader eyebrow="" title="标题" />)
    expect(withEmptyString.querySelector('.uppercase')).toBeNull()
  })
})

describe('LogoStrip 组件', () => {
  const logos = [
    {
      id: 'l1',
      name: 'Siemens',
      image: { id: 1, alt: 'Siemens logo', url: '/uploads/logo-siemens.webp', width: 200, height: 60 },
    },
    {
      id: 'l2',
      name: 'ABB',
      image: { id: 2, alt: 'ABB logo', url: '/uploads/logo-abb.webp', width: 200, height: 60 },
    },
  ]

  it('渲染标题与全部 logo', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(<LogoStrip heading="Cooperative Suppliers" logos={logos as any} />)
    expect(screen.getByText('Cooperative Suppliers')).toBeDefined()
    expect(screen.getByTitle('Siemens')).toBeDefined()
    expect(screen.getByTitle('ABB')).toBeDefined()
  })

  it('logo 用 object-contain，不被裁切', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { container } = render(<LogoStrip logos={logos as any} />)
    const img = container.querySelector('img')
    expect(img?.className).toContain('object-contain')
  })

  it('logos 为空时整体不渲染', () => {
    const { container } = render(<LogoStrip logos={[]} />)
    expect(container.firstChild).toBeNull()
  })
})

/**
 * 案例视频（figure 块的 video 字段）。
 *
 * 三条会真出事的规矩，光看渲染结果看不出来，必须断言属性：
 * - 绝不能 autoplay：B2B 案例页翻到一半突然出声是负体验
 * - 必须 preload="metadata"：写成 auto 的话每个访客都白下 7 MB
 * - 必须有 poster：没有封面帧，用户翻到这一节看到的是一块黑
 */
describe('案例视频（MediaVideo）', () => {
  const video = {
    id: 190,
    alt: '完工冷却水处理车间实录',
    url: '/api/media/file/walkthrough.mp4',
    mimeType: 'video/mp4',
  }
  const poster = {
    id: 184,
    alt: '完工车间',
    url: '/api/media/file/cover.jpg',
    sizes: { feature: { url: '/api/media/file/cover-1280x720.webp' } },
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderVideo = (props: any) => render(<MediaVideo {...props} />).container

  it('不自动播放、只预加载元数据、带原生控件', () => {
    const el = renderVideo({ video, poster }).querySelector('video')
    expect(el?.hasAttribute('autoplay'), '案例视频不能自动播放').toBe(false)
    expect(el?.getAttribute('preload'), 'preload 不是 metadata 会让每个访客白下整个文件').toBe(
      'metadata',
    )
    expect(el?.hasAttribute('controls')).toBe(true)
    expect(el?.hasAttribute('playsinline'), 'iOS 上没有它会强制全屏').toBe(true)
  })

  it('封面帧取 feature 尺寸的 webp，不是原图', () => {
    const el = renderVideo({ video, poster }).querySelector('video')
    expect(el?.getAttribute('poster')).toBe('/api/media/file/cover-1280x720.webp')
  })

  it('封面没有 feature 尺寸时回落原图', () => {
    const el = renderVideo({ video, poster: { ...poster, sizes: {} } }).querySelector('video')
    expect(el?.getAttribute('poster')).toBe('/api/media/file/cover.jpg')
  })

  it('alt 挂成 aria-label（屏幕阅读器要靠它说明这是什么视频）', () => {
    const el = renderVideo({ video, poster }).querySelector('video')
    expect(el?.getAttribute('aria-label')).toBe('完工冷却水处理车间实录')
  })

  it('关系未 populate（纯 id）或为空时不渲染，不会输出空的 <video>', () => {
    expect(renderVideo({ video: 190, poster }).firstChild).toBeNull()
    expect(renderVideo({ video: null, poster }).firstChild).toBeNull()
    expect(renderVideo({ video: { ...video, url: null }, poster }).firstChild).toBeNull()
  })
})

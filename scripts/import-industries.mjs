#!/usr/bin/env node
/**
 * 导入 / 更新 6 个应用行业（ApplicationScenarios），中英双语。
 * 首页「行业」区按 displayOrder 展示前 6 个。
 *
 * 用法：
 *   node scripts/import-industries.mjs --dry-run
 *   node scripts/import-industries.mjs            新建缺的、更新已有的（含改名换 slug）
 *   node scripts/import-industries.mjs --prune    同时删除不在下表里的旧行业
 *
 * 行业只出现在首页那排卡片里，没有独立页面，所以改 slug 不会断链。
 * 不带 --prune 时，多余的旧行业不删，只把 displayOrder 推到 99（首页不再显示），
 * 确认没问题再跑一次 --prune 清理。
 *
 * 配图：行业没有专属实拍素材，复用对应产品文件夹里的照片（展示该行业实际
 * 用到的设备，比图库图诚实）。已有行业的图片保持不动，可在后台随时替换。
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { api, login, requireEnv, richTextOf, uploadMedia } from './lib/payload-api.mjs'

const args = process.argv.slice(2)
const DRY = args.includes('--dry-run')
const PRUNE = args.includes('--prune')

const SOURCE_ROOT =
  process.env.PRODUCT_ASSETS_ROOT ||
  'D:/国际站店铺装修发品资料收集包 - 副本/1.客户需要准备的素材（需要回传）/2.发品所需资料（最多150条）'

const INDUSTRIES = [
  {
    slug: 'agriculture-livestock',
    /** 旧 slug：命中则改名沿用（保留图片与关联产品），不新建 */
    renameFrom: 'agricultural-innovation',
    displayOrder: 1,
    imageFrom: { folder: 5, index: 0 }, // 仪表箱 / 操作箱
    relatedSlugs: ['instrument-enclosure-operator-valve-control-box'],
    en: {
      name: 'Agriculture & Livestock',
      tagline: 'Environmental control · Monitoring · Dosing',
      description: [
        'Environmental regulation systems and digitized livestock management. Field enclosures are built for the conditions they sit in — correct ingress protection, sealed penetrations, labelled terminals.',
      ],
    },
    zh: {
      name: '农牧业',
      tagline: '环境调控 · 监测 · 加药',
      description: [
        '环境调控系统与畜牧养殖数字化管理。现场箱体按实际安装环境制作——防护等级正确、开孔密封、端子标识齐全。',
      ],
    },
  },
  {
    slug: 'energy',
    renameFrom: 'new-energy-development',
    displayOrder: 2,
    imageFrom: { folder: 7, index: 0 }, // 变频柜
    relatedSlugs: ['abb-acs510-acs580-vfd-control-cabinet'],
    en: {
      name: 'Energy',
      tagline: 'PV · Wind · Storage · Distribution',
      description: [
        'Photovoltaic, wind and energy storage plants, plus distribution for conventional power sites. Drive and distribution cabinets are sized for real thermal load and programmed for duty rotation rather than left on default parameters.',
      ],
    },
    zh: {
      name: '能源行业',
      tagline: '光伏 · 风电 · 储能 · 配电',
      description: [
        '光伏、风电与储能电站，以及常规电力现场的配电。变频柜与配电柜按实际热负荷选型，控制逻辑实际编写轮换与节能策略，而非沿用默认参数。',
      ],
    },
  },
  {
    slug: 'water-treatment',
    renameFrom: 'smart-water-management',
    displayOrder: 3,
    imageFrom: { folder: 8, index: 0 }, // 水处理控制柜
    relatedSlugs: ['ro-edi-mbr-water-treatment-control-panel'],
    en: {
      name: 'Water Treatment',
      tagline: 'RO · EDI · MBR · Pump stations',
      description: [
        'Treatment plants, reuse lines and automated pump stations. Control panels and SCADA are built together, so membrane flush cycles, dosing ratios and quality interlocks match the actual treatment train.',
      ],
    },
    zh: {
      name: '水处理行业',
      tagline: 'RO · EDI · MBR · 泵站',
      description: [
        '水处理厂、中水回用与泵站自动化。控制柜与 SCADA 一并设计，膜冲洗周期、加药配比与水质联锁均按实际工艺段编写。',
      ],
    },
  },
  {
    slug: 'machinery-machine-tools',
    displayOrder: 4,
    imageFrom: { folder: 6, index: 0 }, // 多品牌 PLC 控制柜
    relatedSlugs: ['multi-brand-plc-control-cabinet', 'siemens-s7-200-smart-plc-cabinet'],
    en: {
      name: 'Machinery & Machine Tools',
      tagline: 'OEM panels · Retrofits · Motion control',
      description: [
        'Control panels for machine builders and retrofits of existing equipment. We work to the machine’s own electrical drawings and match the controller brand already used on the line, so operators and maintenance staff keep their existing tooling.',
      ],
    },
    zh: {
      name: '设备机床类',
      tagline: '成套电控 · 老机改造 · 运动控制',
      description: [
        '为设备厂配套电控柜，以及既有设备的电气改造。按机器本身的电气图纸制作，控制器品牌沿用产线现有的那套，操作与维修人员不用换工具、不用重新学。',
      ],
    },
  },
  {
    slug: 'industrial-automation',
    renameFrom: 'advanced-manufacturing',
    displayOrder: 5,
    imageFrom: { folder: 3, index: 0 }, // ET200SP / S7-1500
    relatedSlugs: ['siemens-et200sp-s7-1500-plc-cabinet', 'siemens-s7-1200-plc-control-cabinet'],
    en: {
      name: 'Industrial Automation',
      tagline: 'Production lines · MES interface · Smart warehousing',
      description: [
        'Production line control system optimization and smart warehousing integration. Distributed I/O keeps field wiring short across large plants, while a central controller carries the process logic.',
      ],
    },
    zh: {
      name: '工业自动化',
      tagline: '产线控制 · MES 对接 · 智能仓储',
      description: [
        '生产线控制系统优化与智能仓储集成。分布式 I/O 大幅缩短大型厂区的现场布线，工艺逻辑由中央控制器统一承担。',
      ],
    },
  },
  {
    slug: 'instrumentation',
    displayOrder: 6,
    imageFrom: { folder: 5, index: 1 }, // 仪表箱（与农牧业错开取第 2 张）
    relatedSlugs: [
      'instrument-enclosure-operator-valve-control-box',
      'wincc-hmi-scada-programming-service',
    ],
    en: {
      name: 'Instrumentation & Metering',
      tagline: 'Signal conditioning · Data acquisition · HMI',
      description: [
        'Instrument enclosures, signal conditioning and data acquisition for process measurement. Analogue loops are wired and shielded so the reading on the HMI is the reading at the sensor.',
      ],
    },
    zh: {
      name: '仪器仪表',
      tagline: '信号调理 · 数据采集 · 人机界面',
      description: [
        '过程测量用的仪表箱、信号调理与数据采集。模拟量回路按规范布线与屏蔽，保证 HMI 上显示的值就是传感器测到的值。',
      ],
    },
  },
]

/** 从产品素材文件夹里按下标取图 */
async function pickImage({ folder, index }) {
  const dirs = await fs.readdir(SOURCE_ROOT, { withFileTypes: true })
  const dir = dirs.find((d) => d.isDirectory() && d.name.startsWith(`${folder}产品`))
  if (!dir) return null
  const full = path.join(SOURCE_ROOT, dir.name)
  const files = (await fs.readdir(full))
    .filter((f) => /\.(jpe?g|png)$/i.test(f) && f !== '彩页.png')
    .sort()
  // 下标越界时回落到第一张
  const file = files[index] ?? files[0]
  return file ? path.join(full, file) : null
}

async function main() {
  const base = requireEnv()
  console.log(`目标站点：${base}${DRY ? '　【空跑，不写任何数据】' : ''}\n`)
  await login()

  // 产品 slug → id，用于填 relatedProducts
  const prods = await api('/api/products?limit=100&locale=en&depth=0')
  const productIdBySlug = new Map((prods.docs ?? []).map((d) => [d.slug, d.id]))
  console.log(`已读到 ${productIdBySlug.size} 个产品，用于关联`)

  // 站上现有行业：slug → 文档
  const current = await api('/api/application-scenarios?limit=100&locale=en&depth=0')
  const bySlug = new Map((current.docs ?? []).map((d) => [d.slug, d]))
  console.log(`站上现有 ${bySlug.size} 个行业：${[...bySlug.keys()].join(', ')}\n`)

  let created = 0
  let updated = 0

  for (const ind of INDUSTRIES) {
    const existing = bySlug.get(ind.slug) ?? (ind.renameFrom ? bySlug.get(ind.renameFrom) : null)
    const renaming = existing && existing.slug !== ind.slug
    const related = ind.relatedSlugs.map((s) => productIdBySlug.get(s)).filter(Boolean)
    const missingRelated = ind.relatedSlugs.filter((s) => !productIdBySlug.has(s))

    if (DRY) {
      const action = existing ? (renaming ? `改名自 ${existing.slug}` : '更新') : '新建'
      console.log(`${existing ? '~' : '+'} ${ind.slug}　[${action}]
    EN：${ind.en.name}　|　ZH：${ind.zh.name}
    关联产品：${related.length} 个${missingRelated.length ? `（站上没有：${missingRelated.join(', ')}）` : ''}　|　顺序：${ind.displayOrder}${
      existing ? '' : `\n    配图：产品文件夹 ${ind.imageFrom.folder} 的第 ${ind.imageFrom.index + 1} 张`
    }`)
      existing ? updated++ : created++
      continue
    }

    const bodyEn = {
      name: ind.en.name,
      slug: ind.slug,
      tagline: ind.en.tagline,
      description: richTextOf(ind.en.description),
      relatedProducts: related,
      displayOrder: ind.displayOrder,
    }

    let id
    if (existing) {
      // 图片不动：已有行业的配图可能已被运营在后台换过
      const r = await api(`/api/application-scenarios/${existing.id}?locale=en`, {
        method: 'PATCH',
        body: bodyEn,
      })
      id = r.doc.id
      console.log(`✓ ${ind.slug}${renaming ? `（原 ${existing.slug}）` : ''} 已更新`)
      updated++
    } else {
      const imgPath = await pickImage(ind.imageFrom)
      if (!imgPath) {
        console.error(`✗ ${ind.slug}：找不到配图（产品文件夹 ${ind.imageFrom.folder}），跳过 —— 配图是必填项`)
        continue
      }
      const mediaId = await uploadMedia(imgPath, ind.en.name, ind.zh.name)
      const r = await api('/api/application-scenarios?locale=en', {
        method: 'POST',
        body: { ...bodyEn, image: mediaId },
      })
      id = r.doc.id
      console.log(`✓ ${ind.slug} 已新建（配图 ${path.basename(imgPath)}）`)
      created++
    }

    await api(`/api/application-scenarios/${id}?locale=zh`, {
      method: 'PATCH',
      body: {
        name: ind.zh.name,
        tagline: ind.zh.tagline,
        description: richTextOf(ind.zh.description),
      },
    })
  }

  // 不在表里的旧行业：--prune 删除，否则推到最后不再上首页
  const keep = new Set(INDUSTRIES.flatMap((i) => [i.slug, i.renameFrom].filter(Boolean)))
  const leftovers = (current.docs ?? []).filter((d) => !keep.has(d.slug))

  if (leftovers.length) {
    console.log()
    for (const doc of leftovers) {
      if (DRY) {
        console.log(`− ${doc.slug}（${doc.name}）：${PRUNE ? '会被删除' : 'displayOrder 改为 99，首页不再显示'}`)
        continue
      }
      if (PRUNE) {
        await api(`/api/application-scenarios/${doc.id}`, { method: 'DELETE' })
        console.log(`✓ 已删除多余行业：${doc.slug}（${doc.name}）`)
      } else {
        await api(`/api/application-scenarios/${doc.id}?locale=en`, {
          method: 'PATCH',
          body: { displayOrder: 99 },
        })
        console.log(`— ${doc.slug}（${doc.name}）不在本次清单里：已推到末尾，首页不再显示。确认后加 --prune 删除`)
      }
    }
  }

  console.log(`\n完成：新建 ${created} 个，更新 ${updated} 个${leftovers.length ? `，多余 ${leftovers.length} 个` : ''}。`)
  if (DRY) console.log('这是空跑，没有写入任何数据。')
  else console.log('配图用的是对应产品的照片，可在后台替换为行业现场图。')
}

main().catch((e) => {
  console.error(`\n失败：${e.message}`)
  process.exit(1)
})

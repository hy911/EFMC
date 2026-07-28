#!/usr/bin/env node
/**
 * 导入 5 个应用行业（ApplicationScenarios），中英双语一次写好。
 * 首页「行业」区按 displayOrder 取前 5 个。
 *
 * 用法：
 *   node scripts/import-industries.mjs --dry-run
 *   node scripts/import-industries.mjs
 *
 * 配图：行业没有专属实拍素材，故复用对应产品文件夹里的照片
 * （展示该行业实际用到的设备，比图库图诚实）。可在后台随时替换。
 * slug 已存在的行业会跳过，不覆盖后台的人工修改。
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import { api, login, requireEnv, richTextOf, uploadMedia } from './lib/payload-api.mjs'

const args = process.argv.slice(2)
const DRY = args.includes('--dry-run')

const SOURCE_ROOT =
  process.env.PRODUCT_ASSETS_ROOT ||
  'D:/国际站店铺装修发品资料收集包 - 副本/1.客户需要准备的素材（需要回传）/2.发品所需资料（最多150条）'

const INDUSTRIES = [
  {
    slug: 'smart-water-management',
    displayOrder: 1,
    imageFrom: 8, // 水处理控制柜
    relatedSlugs: ['ro-edi-mbr-water-treatment-control-panel'],
    en: {
      name: 'Smart Water Management',
      tagline: 'Treatment · Pumping · SCADA',
      description: [
        'Intelligent monitoring for water treatment plants and automated pump station upgrades. Control panels and SCADA are built together, so membrane flush cycles, dosing ratios and quality interlocks match the actual treatment train.',
      ],
    },
    zh: {
      name: '智慧水务',
      tagline: '水处理 · 泵站 · SCADA',
      description: [
        '水处理厂智能监控与泵站自动化改造。控制柜与 SCADA 一并设计，膜冲洗周期、加药配比与水质联锁均按实际工艺段编写。',
      ],
    },
  },
  {
    slug: 'advanced-manufacturing',
    displayOrder: 2,
    imageFrom: 3, // ET200SP / S7-1500
    relatedSlugs: ['siemens-et200sp-s7-1500-plc-cabinet', 'siemens-s7-1200-plc-control-cabinet'],
    en: {
      name: 'Advanced Manufacturing',
      tagline: 'Production lines · MES interface · Smart warehousing',
      description: [
        'Production line control system optimization and smart warehousing integration. Distributed I/O keeps field wiring short across large plants, while a central controller carries the process logic.',
      ],
    },
    zh: {
      name: '先进制造',
      tagline: '产线控制 · MES 对接 · 智能仓储',
      description: [
        '生产线控制系统优化与智能仓储集成。分布式 I/O 大幅缩短大型厂区的现场布线，工艺逻辑由中央控制器统一承担。',
      ],
    },
  },
  {
    slug: 'new-energy-development',
    displayOrder: 3,
    imageFrom: 7, // 变频柜
    relatedSlugs: ['abb-acs510-acs580-vfd-control-cabinet'],
    en: {
      name: 'New Energy Development',
      tagline: 'PV · Wind · Energy storage',
      description: [
        'Photovoltaic and wind power equipment maintenance and energy storage system optimization. Drive cabinets are sized for real thermal load and programmed for duty rotation rather than left on default parameters.',
      ],
    },
    zh: {
      name: '新能源',
      tagline: '光伏 · 风电 · 储能',
      description: [
        '光伏与风电设备运维、储能系统优化。变频柜按实际热负荷选型，控制逻辑实际编写轮换与节能策略，而非沿用默认参数。',
      ],
    },
  },
  {
    slug: 'agricultural-innovation',
    displayOrder: 4,
    imageFrom: 5, // 仪表箱 / 操作箱
    relatedSlugs: ['instrument-enclosure-operator-valve-control-box'],
    en: {
      name: 'Agricultural Innovation',
      tagline: 'Environmental control · Monitoring · Dosing',
      description: [
        'Environmental regulation systems and digitized livestock management. Field enclosures are built for the conditions they sit in — correct ingress protection, sealed penetrations, labelled terminals.',
      ],
    },
    zh: {
      name: '农业创新',
      tagline: '环境调控 · 监测 · 加药',
      description: [
        '环境调控系统与畜牧养殖数字化管理。现场箱体按实际安装环境制作——防护等级正确、开孔密封、端子标识齐全。',
      ],
    },
  },
  {
    slug: 'traditional-industries',
    displayOrder: 5,
    imageFrom: 4, // 配电 / 动力柜
    relatedSlugs: ['hv-lv-switchgear-power-distribution-cabinet', 'multi-brand-plc-control-cabinet'],
    en: {
      name: 'Traditional Industries',
      tagline: 'Petrochemical · Transport · Power distribution',
      description: [
        'Safety control in petrochemicals and energy dispatch optimization for transportation. Distribution and power cabinets are built to the project single-line diagram with documented component selection.',
      ],
    },
    zh: {
      name: '传统产业',
      tagline: '石化 · 交通 · 配电',
      description: [
        '石化行业安全控制与交通能源调度优化。配电与动力柜按项目单线图制作，元器件选型全程留档。',
      ],
    },
  },
]

/** 从产品素材文件夹里取第一张可用图 */
async function pickImage(folderIndex) {
  const dirs = await fs.readdir(SOURCE_ROOT, { withFileTypes: true })
  const dir = dirs.find((d) => d.isDirectory() && d.name.startsWith(`${folderIndex}产品`))
  if (!dir) return null
  const full = path.join(SOURCE_ROOT, dir.name)
  const files = (await fs.readdir(full))
    .filter((f) => /\.(jpe?g|png)$/i.test(f) && f !== '彩页.png')
    .sort()
  return files[0] ? path.join(full, files[0]) : null
}

async function main() {
  const base = requireEnv()
  console.log(`目标站点：${base}${DRY ? '　【空跑，不写任何数据】' : ''}\n`)
  await login()

  // 产品 slug → id，用于填 relatedProducts
  const prods = await api('/api/products?limit=100&locale=en&depth=0')
  const productIdBySlug = new Map((prods.docs ?? []).map((d) => [d.slug, d.id]))
  console.log(`已读到 ${productIdBySlug.size} 个产品，用于关联`)

  let created = 0
  let skipped = 0

  for (const ind of INDUSTRIES) {
    const found = await api(
      `/api/application-scenarios?where[slug][equals]=${ind.slug}&limit=1&locale=en`,
    )
    if (found.docs?.[0]) {
      console.log(`— ${ind.slug}：已存在（id ${found.docs[0].id}），跳过`)
      skipped++
      continue
    }

    const imgPath = await pickImage(ind.imageFrom)
    if (!imgPath) {
      console.error(`✗ ${ind.slug}：找不到配图（产品文件夹 ${ind.imageFrom}），跳过 —— 配图是必填项`)
      continue
    }

    const related = ind.relatedSlugs.map((s) => productIdBySlug.get(s)).filter(Boolean)

    if (DRY) {
      console.log(`+ ${ind.slug}
    EN：${ind.en.name}　|　ZH：${ind.zh.name}
    配图：${path.basename(imgPath)}（取自产品 ${ind.imageFrom}）
    关联产品：${related.length} 个　|　展示顺序：${ind.displayOrder}`)
      created++
      continue
    }

    const mediaId = await uploadMedia(imgPath, ind.en.name, ind.zh.name)

    const doc = await api('/api/application-scenarios?locale=en', {
      method: 'POST',
      body: {
        name: ind.en.name,
        slug: ind.slug,
        tagline: ind.en.tagline,
        image: mediaId,
        description: richTextOf(ind.en.description),
        relatedProducts: related,
        displayOrder: ind.displayOrder,
      },
    })

    await api(`/api/application-scenarios/${doc.doc.id}?locale=zh`, {
      method: 'PATCH',
      body: {
        name: ind.zh.name,
        tagline: ind.zh.tagline,
        description: richTextOf(ind.zh.description),
      },
    })

    console.log(`✓ ${ind.slug}（id ${doc.doc.id}，关联 ${related.length} 个产品）`)
    created++
  }

  console.log(`\n完成：新建 ${created} 个${skipped ? `，跳过已存在 ${skipped} 个` : ''}。`)
  if (DRY) console.log('这是空跑，没有写入任何数据。')
  else console.log('配图用的是对应产品的照片，可在后台替换为行业现场图。')
}

main().catch((e) => {
  console.error(`\n失败：${e.message}`)
  process.exit(1)
})

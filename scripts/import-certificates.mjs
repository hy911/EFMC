#!/usr/bin/env node
/**
 * 导入资质证书（Certificates），中英双语。
 * About 页的证书墙积木块（勾选「自动展示资质证书」）会自动拉取这里的全部证书。
 *
 * 用法：
 *   node scripts/import-certificates.mjs --dry-run
 *   node scripts/import-certificates.mjs --image "E:/path/to/ce-cert.png"
 *
 * 证书图片必须是图片格式（Media 只接受 image/*），PDF 需先导出为 PNG/JPG。
 * name 已存在的证书会跳过，不重复创建。
 *
 * 命名原则：照证书原文写，不做泛化。
 * 例如这份是「LVD 符合性验证」而非「CE 认证」，覆盖的是单一型号而非全线产品——
 * 海外 B2B 客户会逐项核对，写窄比写宽安全。
 */
import fs from 'node:fs/promises'
import { api, login, requireEnv, uploadMedia } from './lib/payload-api.mjs'

const args = process.argv.slice(2)
const DRY = args.includes('--dry-run')
const imageArg = args.includes('--image') ? args[args.indexOf('--image') + 1] : null

const CERTIFICATES = [
  {
    key: 'ce-lvd-control-panel',
    // 证书原文：VERIFICATION OF LVD COMPLIANCE, Low Voltage Directive 2014/35/EU
    // 产品 Car lift control panel，型号 EFMC20251126-HW，标准 EN 61537:2007
    en: {
      name: 'CE / LVD Compliance Verification — Control Panel EFMC20251126-HW',
      issuer: 'Shenzhen CTG Testing Co., Ltd.',
    },
    zh: {
      name: 'CE / 低压指令（LVD）符合性验证 — 控制面板 EFMC20251126-HW',
      issuer: '深圳市 CTG 检测有限公司',
    },
    type: 'other',
    issuedAt: '2025-09-28',
    /** 未通过 --image 指定时用这个路径 */
    image: 'photos-out/certificates/ce-lvd-2025.png',
  },
]

async function main() {
  const base = requireEnv()
  console.log(`目标站点：${base}${DRY ? '　【空跑，不写任何数据】' : ''}\n`)
  await login()

  let created = 0
  let skipped = 0

  for (const cert of CERTIFICATES) {
    const found = await api(
      `/api/certificates?where[name][equals]=${encodeURIComponent(cert.en.name)}&limit=1&locale=en`,
    )
    if (found.docs?.[0]) {
      console.log(`— ${cert.key}：已存在（id ${found.docs[0].id}），跳过`)
      skipped++
      continue
    }

    const imgPath = imageArg || cert.image
    let exists = true
    try {
      await fs.access(imgPath)
    } catch {
      exists = false
    }
    if (!exists) {
      console.error(`✗ ${cert.key}：找不到证书图片 ${imgPath}
  证书图必填，且必须是 PNG/JPG（Media 不接受 PDF）。
  用 --image "路径" 指定，或把图片放到上面的默认路径。`)
      continue
    }

    if (DRY) {
      console.log(`+ ${cert.key}
    EN：${cert.en.name}
    ZH：${cert.zh.name}
    发证方：${cert.en.issuer} / ${cert.zh.issuer}
    类型：${cert.type}　|　发证日期：${cert.issuedAt}
    图片：${imgPath}`)
      created++
      continue
    }

    const mediaId = await uploadMedia(imgPath, cert.en.name, cert.zh.name)
    const doc = await api('/api/certificates?locale=en', {
      method: 'POST',
      body: {
        name: cert.en.name,
        issuer: cert.en.issuer,
        image: mediaId,
        type: cert.type,
        issuedAt: cert.issuedAt,
      },
    })
    await api(`/api/certificates/${doc.doc.id}?locale=zh`, {
      method: 'PATCH',
      body: { name: cert.zh.name, issuer: cert.zh.issuer },
    })
    console.log(`✓ ${cert.key}（id ${doc.doc.id}）`)
    created++
  }

  console.log(`\n完成：新建 ${created} 个${skipped ? `，跳过已存在 ${skipped} 个` : ''}。`)
  if (DRY) {
    console.log('这是空跑，没有写入任何数据。')
  } else if (created > 0) {
    console.log(`
证书墙目前不在 About 页的积木块里（导入 About 时按当时情况略过了）。
要显示证书，在后台「页面 → About」加一个「图片画廊」积木块并勾选
「自动展示资质证书」，或告诉我，我把它加进 import-about.mjs 重跑。`)
  }
}

main().catch((e) => {
  console.error(`\n失败：${e.message}`)
  process.exit(1)
})

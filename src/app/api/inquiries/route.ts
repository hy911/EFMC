import { NextResponse, type NextRequest } from 'next/server'
import { z } from 'zod'

import { notifyInquiry } from '@/lib/notify'
import { getPayloadClient } from '@/lib/payload'
import { verifyTurnstile } from '@/lib/turnstile'

/**
 * 询盘提交接口（表单唯一入口）。
 * 流程：Zod 校验 → 蜜罐检查 → Turnstile 人机校验 → Local API 写库 → Resend 通知。
 * Inquiries collection 对公开 REST 完全关闭，只有这里能写入。
 */

const inquirySchema = z.object({
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(200),
  company: z.string().trim().max(200).optional(),
  country: z.string().trim().max(100).optional(),
  phone: z.string().trim().max(50).optional(),
  message: z.string().trim().min(1).max(5000),
  /** 来源产品 id（产品页表单传入） */
  sourceProduct: z.number().int().positive().optional(),
  /** 提交时的界面语言（便于运营用对应语言回复） */
  locale: z.string().max(10).optional(),
  /** Turnstile 令牌（启用时由前端组件注入） */
  turnstileToken: z.string().optional(),
  /** 蜜罐字段：正常用户永远为空，机器人会填 */
  website: z.string().optional(),
})

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const parsed = inquirySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: z.flattenError(parsed.error).fieldErrors },
      { status: 422 },
    )
  }
  const data = parsed.data

  // 蜜罐命中：装作成功但不落库，让机器人无从判断
  if (data.website) {
    return NextResponse.json({ ok: true }, { status: 201 })
  }

  // Turnstile 人机校验（未配置密钥时自动放行）
  const ip = req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for') ?? undefined
  const human = await verifyTurnstile(data.turnstileToken, ip?.split(',')[0]?.trim())
  if (!human) {
    return NextResponse.json({ error: 'Turnstile verification failed' }, { status: 403 })
  }

  const payload = await getPayloadClient()

  // 写入询盘（Local API 绕过 create: noOne 的公开限制）
  const inquiry = await payload.create({
    collection: 'inquiries',
    data: {
      name: data.name,
      email: data.email,
      company: data.company,
      country: data.country,
      phone: data.phone,
      message: data.message,
      sourceProduct: data.sourceProduct,
      source: 'form',
      status: 'new',
    },
  })

  // 邮件通知：失败不影响接口结果（notifyInquiry 内部已捕获错误）
  let productTitle: string | undefined
  if (data.sourceProduct) {
    try {
      const product = await payload.findByID({ collection: 'products', id: data.sourceProduct })
      productTitle = product?.title
    } catch {
      // 产品不存在不影响通知
    }
  }
  await notifyInquiry({ ...data, productTitle })

  return NextResponse.json({ ok: true, id: inquiry.id }, { status: 201 })
}

import { z } from 'zod'

/**
 * 询盘请求体的校验规则。
 *
 * 从 route handler 里抽出来，是因为 OpenAPI 规范要用它生成请求体的 JSON Schema
 * （src/app/api/openapi.json/route.ts 调 z.toJSONSchema）。手抄一份进规范的话，
 * 改了校验而规范没跟上，对外公布的接口文档就是错的 —— 那比没有文档更糟。
 */
export const inquirySchema = z.object({
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

import { Resend } from 'resend'

export type InquiryNotification = {
  name: string
  email: string
  company?: string
  country?: string
  phone?: string
  message: string
  productTitle?: string
  locale?: string
}

/**
 * 询盘邮件通知（Resend）。
 * - 未配置 RESEND_API_KEY / INQUIRY_NOTIFY_TO 时静默跳过
 * - 发送失败只记日志，绝不阻塞询盘落库（线索优先）
 */
export async function notifyInquiry(data: InquiryNotification): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY
  const to = process.env.INQUIRY_NOTIFY_TO
  if (!apiKey || !to) return

  const from = process.env.INQUIRY_NOTIFY_FROM || 'noreply@example.com'
  const resend = new Resend(apiKey)

  const lines = [
    `Name:    ${data.name}`,
    `Email:   ${data.email}`,
    data.company && `Company: ${data.company}`,
    data.country && `Country: ${data.country}`,
    data.phone && `Phone:   ${data.phone}`,
    data.productTitle && `Product: ${data.productTitle}`,
    data.locale && `Locale:  ${data.locale}`,
    '',
    'Message:',
    data.message,
  ].filter(Boolean)

  const { error } = await resend.emails.send({
    from,
    to,
    replyTo: data.email,
    subject: `[Inquiry] ${data.name}${data.company ? ` — ${data.company}` : ''}`,
    text: lines.join('\n'),
  })
  if (error) {
    console.error('[inquiries] Resend 通知失败:', error)
  }
}

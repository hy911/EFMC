/**
 * Cloudflare Turnstile 服务端校验。
 * 未配置 TURNSTILE_SECRET_KEY 时直接放行（本地开发/未启用阶段），
 * 生产环境务必配置密钥对启用人机校验。
 */
export async function verifyTurnstile(token: string | undefined, ip?: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) return true // 未启用
  if (!token) return false

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secret, response: token, remoteip: ip }),
    })
    const data = (await res.json()) as { success: boolean }
    return data.success === true
  } catch {
    // 校验服务不可用时拒绝提交（宁可少收，不放垃圾）
    return false
  }
}

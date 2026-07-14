/**
 * wa.me 深链工具（纯前端询盘通道）。
 * number：国际格式纯数字（如 8613800000000），存于站点设置。
 */
export function buildWaLink(number: string, message?: string): string {
  const base = `https://wa.me/${number}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}

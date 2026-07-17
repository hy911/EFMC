import { getTranslations } from 'next-intl/server'

import { MediaImage } from '@/components/ui/MediaImage'
import type { SiteSetting } from '@/payload-types'

type Props = {
  contact: SiteSetting['contact']
  /** 二维码边长（px），默认 104 */
  size?: number
  className?: string
}

/**
 * 微信 / WhatsApp 二维码组（首页联系区、页脚、WhatsApp 浮动按钮共用）。
 * 两张图都来自站点设置；未上传的那张自动省略，都没传则整块不渲染。
 * 不走 MediaImage 的 card 尺寸——card 是 640×480 裁切，会把方形二维码切坏，故用原图。
 */
export async function ContactQrCodes({ contact, size = 104, className }: Props) {
  const t = await getTranslations('contact')

  const codes = [
    { key: 'wechat', media: contact.wechatQr, label: t('wechatQrLabel') },
    { key: 'whatsapp', media: contact.whatsAppQr, label: t('whatsAppQrLabel') },
  ].filter((c) => c.media && typeof c.media !== 'number')

  if (codes.length === 0) return null

  return (
    <div className={className ?? 'flex flex-wrap gap-6'}>
      {codes.map((code) => (
        <figure key={code.key} className="m-0">
          <span className="inline-flex bg-white p-2" style={{ width: size + 16 }}>
            <MediaImage
              media={code.media}
              className="block h-auto w-full"
              sizes={`${size}px`}
            />
          </span>
          <figcaption className="mt-2 text-[13px] text-cloud">{code.label}</figcaption>
        </figure>
      ))}
    </div>
  )
}

import { MediaImage } from '@/components/ui/MediaImage'
import type { Media } from '@/payload-types'

export type LogoItem = {
  id?: string | null
  name: string
  image: Media | number | null | undefined
}

/**
 * 合作供应商 logo 横条（纯展示）。
 * 刻意不取 card 尺寸 —— card 是 640×480 居中裁切，logo 会被切掉；
 * 直接用原图 + object-contain 等比缩放，logo 文件本身仅几 KB。
 */
export function LogoStrip({ heading, logos }: { heading?: string | null; logos: LogoItem[] }) {
  if (logos.length === 0) return null

  return (
    <div data-reveal className="flex flex-wrap items-stretch border border-line">
      {heading && (
        <div className="flex items-center bg-accent px-6 py-4 text-[13px] leading-[1.3] font-semibold tracking-[1.2px] text-white uppercase">
          {heading}
        </div>
      )}
      <div className="flex flex-1 flex-wrap items-center justify-around gap-x-8 gap-y-6 px-6 py-5">
        {logos.map((logo, i) => (
          <div key={logo.id ?? i} title={logo.name} className="relative h-8 w-28">
            <MediaImage media={logo.image} fill className="object-contain" sizes="112px" />
          </div>
        ))}
      </div>
    </div>
  )
}

import { getTranslations } from 'next-intl/server'

import { MediaImage } from '@/components/ui/MediaImage'
import { Link } from '@/i18n/navigation'
import type { Product } from '@/payload-types'

/**
 * 产品卡片（设计稿样式：图 + 名称 + 摘要 + "Request a Quote →"）。
 * 图与标题链到产品详情页；quoteHref 控制 CTA 去向
 * （首页保持设计稿的 /#contact，列表页指向详情页询盘表单）。
 */
export async function ProductCard({
  product,
  quoteHref,
}: {
  product: Product
  quoteHref?: string
}) {
  const t = await getTranslations('products')
  const cover = product.images?.[0]?.image
  const detailHref = `/products/${product.slug}`

  return (
    <div
      data-reveal
      className="flex flex-col border border-line bg-white transition-[box-shadow,transform] duration-250 hover:-translate-y-[3px] hover:shadow-[0_12px_32px_rgba(11,31,63,0.10)]"
    >
      <Link href={detailHref} className="relative block h-60 min-w-0">
        <MediaImage
          media={cover}
          size="card"
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
        />
      </Link>
      <div className="flex flex-1 flex-col gap-2 px-[26px] pt-[26px] pb-7">
        <h3 className="m-0 font-display text-[18.5px] font-semibold text-navy">
          <Link href={detailHref} className="text-navy transition-colors hover:text-accent">
            {product.title}
          </Link>
        </h3>
        <p className="m-0 flex-1 text-[14px] leading-[1.55] text-steel">{product.excerpt}</p>
        <Link
          href={quoteHref ?? detailHref}
          className="mt-3.5 text-[14px] font-semibold text-accent transition-colors hover:text-accent-strong"
        >
          {t('requestQuote')}
        </Link>
      </div>
    </div>
  )
}

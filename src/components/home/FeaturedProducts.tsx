import { getTranslations } from 'next-intl/server'

import { Container } from '@/components/ui/Container'
import { MediaImage } from '@/components/ui/MediaImage'
import type { Product } from '@/payload-types'

/**
 * 精选产品（设计稿 1:1）：浅灰蓝底，3 列卡片（图 + 名称 + 摘要 + CTA），
 * hover 上浮加投影。数据来自 Payload（featured=true 前 6 个）。
 */
export async function FeaturedProducts({ products }: { products: Product[] }) {
  const t = await getTranslations('products')

  return (
    <section id="products" className="bg-mist">
      <Container className="py-20 lg:py-[104px]">
        {/* 区块头：左标题 + 右链接 */}
        <div
          data-reveal
          className="mb-14 flex flex-wrap items-end justify-between gap-8"
        >
          <div className="max-w-[560px]">
            <div className="mb-3.5 text-[12.5px] font-semibold tracking-[2.2px] text-accent uppercase">
              {t('eyebrow')}
            </div>
            <h2 className="m-0 font-display text-[28px] leading-[1.15] font-bold tracking-[-0.3px] text-navy sm:text-[38px]">
              {t('title')}
            </h2>
          </div>
          <a
            href="#contact"
            className="border-b-2 border-accent pb-1 text-[15px] font-semibold whitespace-nowrap text-accent transition-colors hover:text-accent-strong"
          >
            {t('talkToEngineer')}
          </a>
        </div>

        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => {
            const cover = product.images?.[0]?.image
            return (
              <div
                key={product.id}
                data-reveal
                className="flex flex-col border border-line bg-white transition-[box-shadow,transform] duration-250 hover:-translate-y-[3px] hover:shadow-[0_12px_32px_rgba(11,31,63,0.10)]"
              >
                <div className="relative h-60 min-w-0">
                  <MediaImage
                    media={cover}
                    size="card"
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                  />
                </div>
                <div className="flex flex-1 flex-col gap-2 px-[26px] pt-[26px] pb-7">
                  <h3 className="m-0 font-display text-[18.5px] font-semibold text-navy">
                    {product.title}
                  </h3>
                  <p className="m-0 flex-1 text-[14px] leading-[1.55] text-steel">
                    {product.excerpt}
                  </p>
                  <a
                    href="#contact"
                    className="mt-3.5 text-[14px] font-semibold text-accent transition-colors hover:text-accent-strong"
                  >
                    {t('requestQuote')}
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      </Container>
    </section>
  )
}

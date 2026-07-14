import { getTranslations } from 'next-intl/server'

import { Container } from '@/components/ui/Container'
import { ProductCard } from '@/components/ui/ProductCard'
import type { Product } from '@/payload-types'

/**
 * 精选产品（设计稿 1:1）：浅灰蓝底，3 列卡片，hover 上浮加投影。
 * 数据来自 Payload（featured=true 前 6 个）；卡片 CTA 按设计稿指向 /#contact。
 */
export async function FeaturedProducts({ products }: { products: Product[] }) {
  const t = await getTranslations('products')

  return (
    <section id="products" className="bg-mist">
      <Container className="py-20 lg:py-[104px]">
        {/* 区块头：左标题 + 右链接 */}
        <div data-reveal className="mb-14 flex flex-wrap items-end justify-between gap-8">
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
          {products.map((product) => (
            <ProductCard key={product.id} product={product} quoteHref="/#contact" />
          ))}
        </div>
      </Container>
    </section>
  )
}

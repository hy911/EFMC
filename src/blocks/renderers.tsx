import { RichText } from '@payloadcms/richtext-lexical/react'

import { InquiryForm } from '@/components/home/InquiryForm'
import { Container } from '@/components/ui/Container'
import { MediaImage } from '@/components/ui/MediaImage'
import type { Locale } from '@/i18n/routing'
import { getPayloadClient } from '@/lib/payload'
import type { Page } from '@/payload-types'

/** Pages.layout 的 block 联合类型（由 payload-types 自动生成） */
type PageBlock = NonNullable<Page['layout']>[number]

/**
 * 固定页 blocks 渲染器：后台拼什么，前端渲染什么。
 * 每种 block 的视觉风格与首页设计体系保持一致。
 */
export async function RenderBlocks({ blocks, locale }: { blocks: PageBlock[]; locale: Locale }) {
  return (
    <>
      {blocks.map(async (block) => {
        switch (block.blockType) {
          /* 富文本段落 */
          case 'richText':
            return (
              <Container key={block.id} className="py-10">
                <div className="prose max-w-[760px] text-ink prose-headings:font-display prose-headings:text-navy">
                  <RichText data={block.content} />
                </div>
              </Container>
            )

          /* 图片画廊 / 证书墙 */
          case 'imageGallery': {
            // fromCertificates 勾选时自动拉取全部证书
            let items: Array<{ id: string; media: PageBlock | unknown; caption?: string | null }>
            if (block.fromCertificates) {
              const payload = await getPayloadClient()
              const { docs } = await payload.find({
                collection: 'certificates',
                limit: 100,
                locale,
                depth: 1,
              })
              items = docs.map((c) => ({
                id: String(c.id),
                media: c.image,
                caption: `${c.name} — ${c.issuer}`,
              }))
            } else {
              items = (block.images ?? []).map((img) => ({
                id: img.id ?? '',
                media: img.image,
                caption: img.caption,
              }))
            }
            return (
              <Container key={block.id} className="py-10">
                {block.heading && (
                  <h2 className="m-0 mb-8 font-display text-[28px] font-bold tracking-[-0.3px] text-navy">
                    {block.heading}
                  </h2>
                )}
                <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
                  {items.map((item) => (
                    <figure key={item.id} className="m-0">
                      <div className="relative h-56 border border-line bg-mist">
                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                        <MediaImage media={item.media as any} size="card" fill sizes="300px" />
                      </div>
                      {item.caption && (
                        <figcaption className="mt-2 text-[13px] text-steel">
                          {item.caption}
                        </figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              </Container>
            )
          }

          /* 数据指标网格 */
          case 'statsGrid':
            return (
              <Container key={block.id} className="py-10">
                <div className="grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-4">
                  {(block.stats ?? []).map((stat) => (
                    <div key={stat.id} className="bg-mist px-8 py-10">
                      <div className="font-display text-[40px] leading-none font-bold text-navy">
                        {stat.value}
                      </div>
                      <div className="mt-2.5 text-[14px] leading-[1.4] text-steel">
                        {stat.label}
                      </div>
                    </div>
                  ))}
                </div>
              </Container>
            )

          /* CTA 横幅 */
          case 'ctaBanner':
            return (
              <section key={block.id} className="my-10 bg-navy text-white">
                <Container className="flex flex-wrap items-center justify-between gap-8 py-14">
                  <div className="max-w-[560px]">
                    <h2 className="m-0 mb-3 font-display text-[28px] leading-[1.15] font-bold tracking-[-0.3px]">
                      {block.heading}
                    </h2>
                    {block.body && (
                      <p className="m-0 text-[16px] leading-[1.7] text-cloud">{block.body}</p>
                    )}
                  </div>
                  <a
                    href="#contact-form"
                    className="bg-accent px-[30px] py-[15px] text-[15.5px] font-semibold text-white transition-colors hover:bg-accent-soft"
                  >
                    {block.buttonLabel}
                  </a>
                </Container>
              </section>
            )

          /* 内嵌询盘表单 */
          case 'contactForm':
            return (
              <Container key={block.id} className="py-10">
                <div id="contact-form" className="max-w-[640px]">
                  {block.heading && (
                    <h2 className="m-0 mb-6 font-display text-[28px] font-bold tracking-[-0.3px] text-navy">
                      {block.heading}
                    </h2>
                  )}
                  <div className="border border-line bg-mist p-1">
                    <InquiryForm />
                  </div>
                </div>
              </Container>
            )

          default:
            return null
        }
      })}
    </>
  )
}

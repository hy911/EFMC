import { Container } from '@/components/ui/Container'
import { MediaImage } from '@/components/ui/MediaImage'
import type { CaseStudy } from '@/payload-types'

/** CaseStudies.sections 的 block 联合类型（由 payload-types 自动生成） */
type CaseBlock = NonNullable<CaseStudy['sections']>[number]

/** 章节序号：01 · 客户的要求 */
const num = (i: number) => String(i + 1).padStart(2, '0')

/** 章节留白：设计稿是 100px，窄屏 70px */
const SECTION = 'py-[70px] lg:py-[100px]'

/** 章节头（小标 + 大标题 + 引言），各块共用 */
function SectionHead({
  index,
  kicker,
  heading,
  intro,
  dark = false,
}: {
  index: number
  kicker: string
  heading: string
  intro?: string | null
  dark?: boolean
}) {
  return (
    <>
      <div
        className={`text-[12px] font-bold tracking-[0.18em] uppercase ${dark ? 'text-sky' : 'text-accent'}`}
      >
        {num(index)} · {kicker}
      </div>
      {/* 设计稿 clamp(34px, 5vw, 56px) */}
      <h2
        className={`mt-3.5 mb-0 max-w-[900px] font-display text-[34px] leading-[1.12] font-bold tracking-[-0.035em] sm:text-[44px] lg:text-[56px] ${
          dark ? 'text-white' : 'text-navy'
        }`}
      >
        {heading}
      </h2>
      {intro && (
        <p
          className={`mt-6 mb-0 max-w-[760px] text-[16px] leading-[1.65] ${dark ? 'text-cloud' : 'text-steel'}`}
        >
          {intro}
        </p>
      )}
    </>
  )
}

/**
 * 案例章节渲染器：后台拼什么，前端渲染什么。
 * 底色按序号交替（白 / 浅灰），收尾块固定深蓝 —— 与首页的节奏一致。
 * 字号与留白按客户认可的设计稿还原，配色换成站点品牌色。
 */
export function RenderCaseSections({ blocks }: { blocks: CaseBlock[] }) {
  return (
    <>
      {blocks.map((block, i) => {
        // 深色收尾块不参与交替，避免它前面那块也变灰、连成一片
        const wash = block.blockType !== 'caseStatement' && i % 2 === 1
        const bg = wash ? 'bg-mist' : 'bg-white'

        switch (block.blockType) {
          /* 问题陈述：左标题 右引语+清单 */
          case 'caseSplit':
            return (
              <section key={block.id} className={bg}>
                <Container className={SECTION}>
                  <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-20">
                    <div>
                      <SectionHead
                        index={i}
                        kicker={block.kicker}
                        heading={block.heading}
                        intro={block.intro}
                      />
                    </div>
                    <div>
                      {block.quote && (
                        <p className="m-0 border-l-[5px] border-accent pl-7 font-display text-[26px] leading-[1.38] font-bold text-navy sm:text-[30px]">
                          “{block.quote}”
                        </p>
                      )}
                      <div className={block.quote ? 'mt-9' : ''}>
                        {(block.points ?? []).map((point) => (
                          <div key={point.id} className="border-t border-line pt-[18px] pb-[18px]">
                            <strong className="mb-1.5 block text-[16px] font-semibold text-navy">
                              {point.label}
                            </strong>
                            <span className="block text-[16px] leading-[1.65] text-steel">
                              {point.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </Container>
              </section>
            )

          /* 整幅图版 */
          case 'caseFigure':
            return (
              <section key={block.id} className={bg}>
                <Container className={SECTION}>
                  <SectionHead
                    index={i}
                    kicker={block.kicker}
                    heading={block.heading}
                    intro={block.intro}
                  />
                  {/* 示意图按原始比例展示、不裁切；用原图而非 feature（1280px 在 2 倍屏上会糊） */}
                  <div className="mt-12 border border-line bg-white p-2 sm:p-[22px]">
                    <MediaImage
                      media={block.image}
                      sizes="(min-width: 1240px) 1136px, 100vw"
                      quality={90}
                    />
                  </div>
                  {block.banner && (
                    <div className="mt-8 bg-navy px-[30px] py-[22px] text-center font-display text-[18px] leading-[1.45] font-bold text-white sm:text-[21px]">
                      {block.banner}
                    </div>
                  )}
                </Container>
              </section>
            )

          /* 卡片网格：有图两栏（图在左），无图三栏；拼贴时首末两张通栏 */
          case 'caseCards': {
            const cards = block.cards ?? []
            const withImages = cards.some((card) => card.image)
            // 拼贴要有图、且至少 4 张才成立，否则退回等宽网格
            const bento = block.layout === 'bento' && withImages && cards.length >= 4
            return (
              <section key={block.id} className={bg}>
                <Container className={SECTION}>
                  <SectionHead
                    index={i}
                    kicker={block.kicker}
                    heading={block.heading}
                    intro={block.intro}
                  />
                  <div
                    className={`mt-12 grid grid-cols-1 gap-7 ${
                      withImages ? 'lg:grid-cols-2' : 'sm:grid-cols-3'
                    }`}
                  >
                    {cards.map((card, c) => {
                      const spans = bento && (c === 0 || c === cards.length - 1)
                      return (
                        <article
                          key={card.id}
                          className={[
                            withImages
                              ? 'grid grid-cols-1 gap-7 border-t border-line pt-[26px]'
                              : 'border-t-4 border-accent pt-[22px]',
                            // 通栏卡：横跨两列，图片给到更大的比例
                            spans
                              ? 'lg:col-span-2 lg:grid-cols-[minmax(0,1fr)_380px]'
                              : withImages
                                ? 'sm:grid-cols-[190px_1fr]'
                                : '',
                          ]
                            .filter(Boolean)
                            .join(' ')}
                        >
                          {card.image && (
                            <div
                              className={`relative bg-mist ${
                                spans ? 'h-[240px] lg:h-[320px]' : 'h-[210px] sm:h-[155px]'
                              }`}
                            >
                              <MediaImage
                                media={card.image}
                                size={spans ? 'feature' : 'card'}
                                fill
                                sizes={spans ? '740px' : '380px'}
                              />
                            </div>
                          )}
                          <div className={spans ? 'lg:self-center' : ''}>
                            {card.tag && (
                              <div className="mb-2 text-[12px] font-bold tracking-[0.16em] text-accent uppercase">
                                {card.tag}
                              </div>
                            )}
                            <h3 className="m-0 font-display text-[24px] leading-[1.25] font-bold text-navy">
                              {card.title}
                            </h3>
                            <p className="mt-3.5 mb-0 text-[16px] leading-[1.65] text-steel">
                              {card.text}
                            </p>
                          </div>
                        </article>
                      )
                    })}
                  </div>
                </Container>
              </section>
            )
          }

          /* 步骤条 */
          case 'caseSteps':
            return (
              <section key={block.id} className={bg}>
                <Container className={SECTION}>
                  <SectionHead
                    index={i}
                    kicker={block.kicker}
                    heading={block.heading}
                    intro={block.intro}
                  />
                  {/*
                    每格自带顶线，不用「整条顶线 + 格间竖线」那套。
                    格间线要求判断某一格是不是行尾 / 末行，而每个断点的列数不同，
                    CSS 判断不出来 —— 4 步排 3 列（3+1）这种非满行必然错位。
                    每格一条线则行数、列数怎么变都成立，也和本页价值卡片一致。

                    列数按步数来：配了图的格子更宽，一行最多 3 个。
                  */}
                  {(() => {
                    const steps = block.steps ?? []
                    const withImages = steps.some((s) => s.image)
                    const cols = withImages
                      ? 'lg:grid-cols-3'
                      : { 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5', 6: 'lg:grid-cols-6' }[
                          steps.length
                        ] || 'lg:grid-cols-3'
                    return (
                      <div
                        className={`mt-13 grid grid-cols-1 gap-x-7 gap-y-10 sm:grid-cols-2 ${cols}`}
                      >
                        {steps.map((step, s) => (
                          <div key={step.id} className="border-t-2 border-accent pt-[26px]">
                            <b className="block text-[12px] font-bold tracking-[0.12em] text-accent">
                              {num(s)}
                            </b>
                            {step.image && (
                              <div className="relative mt-4 h-[150px] bg-mist">
                                <MediaImage media={step.image} size="card" fill sizes="380px" />
                              </div>
                            )}
                            <strong className="mt-2.5 block text-[16px] leading-[1.3] font-semibold text-navy">
                              {step.title}
                            </strong>
                            <span className="mt-2 block text-[13px] leading-[1.5] text-steel">
                              {step.text}
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  })()}
                  {/* 佐证条：一个数值 + 出处说明，如「5 秒（上一版为 5 分钟）」 */}
                  {block.proofValue && (
                    <div className="mt-10 flex flex-wrap items-baseline gap-x-8 gap-y-3 bg-navy px-[30px] py-[26px]">
                      <strong className="font-display text-[34px] leading-none font-bold text-white">
                        {block.proofValue}
                      </strong>
                      {block.proofNote && (
                        <p className="m-0 max-w-[620px] text-[15px] leading-[1.6] text-cloud">
                          {block.proofNote}
                        </p>
                      )}
                    </div>
                  )}
                </Container>
              </section>
            )

          /* 前后对比表 */
          case 'caseCompare':
            return (
              <section key={block.id} className={bg}>
                <Container className={SECTION}>
                  <SectionHead
                    index={i}
                    kicker={block.kicker}
                    heading={block.heading}
                    intro={block.intro}
                  />
                  {/* 窄屏横向滚动，页面本身不出现横向滚动条 */}
                  <div className="mt-11 overflow-x-auto">
                    <table className="w-full min-w-[760px] border-collapse text-left">
                      <thead>
                        <tr>
                          {[block.labelArea, block.labelBefore, block.labelAfter].map((label) => (
                            <th
                              key={label}
                              className="border-b border-line p-[18px] text-[12px] font-bold tracking-[0.1em] text-accent uppercase"
                            >
                              {label}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {(block.rows ?? []).map((row) => (
                          <tr key={row.id}>
                            <td className="w-[22%] border-b border-line p-[18px] align-top text-[16px] font-bold text-navy">
                              {row.area}
                            </td>
                            <td className="w-[39%] border-b border-line p-[18px] align-top text-[16px] text-steel">
                              {row.before}
                            </td>
                            <td className="border-b border-line p-[18px] align-top text-[16px] font-bold text-navy">
                              {row.after}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Container>
              </section>
            )

          /* 深蓝收尾 */
          case 'caseStatement':
            return (
              <section key={block.id} className="bg-navy text-white">
                <Container className="py-[80px] text-center lg:py-[110px]">
                  <div className="mx-auto max-w-[980px]">
                    <SectionHead
                      index={i}
                      kicker={block.kicker}
                      heading={block.heading}
                      intro={block.intro}
                      dark
                    />
                    {block.body && (
                      <p className="mx-auto mt-6 mb-0 max-w-[740px] text-[19px] leading-[1.65] text-cloud">
                        {block.body}
                      </p>
                    )}
                    <div className="mx-auto mt-13 max-w-[980px] border-t border-white/22 pt-[42px] font-display text-[25px] leading-[1.28] font-bold sm:text-[34px] lg:text-[42px]">
                      {block.statement}
                    </div>
                  </div>
                </Container>
              </section>
            )

          default:
            return null
        }
      })}
    </>
  )
}

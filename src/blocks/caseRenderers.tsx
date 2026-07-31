import { Container } from '@/components/ui/Container'
import { MediaImage } from '@/components/ui/MediaImage'
import type { CaseStudy } from '@/payload-types'

/** CaseStudies.sections 的 block 联合类型（由 payload-types 自动生成） */
type CaseBlock = NonNullable<CaseStudy['sections']>[number]

/** 章节序号：01 · 客户的要求 */
const num = (i: number) => String(i + 1).padStart(2, '0')

/** 章节留白：设计稿是 100px，窄屏 70px */
const SECTION = 'py-[70px] lg:py-[100px]'

/**
 * 章节头：左侧方框编号 + 右侧小标/大标题/引言。
 * number 传 null 表示这节不编号（侧栏图版、深色收尾），左栏留空占位保持对齐。
 */
function SectionHead({
  number,
  kicker,
  heading,
  intro,
  dark = false,
}: {
  number: string | null
  kicker: string
  heading: string
  intro?: string | null
  dark?: boolean
}) {
  return (
    <div
      className={`mb-15 grid max-w-[980px] gap-6 ${number ? 'grid-cols-[52px_minmax(0,1fr)] sm:grid-cols-[66px_minmax(0,1fr)]' : 'grid-cols-1'}`}
    >
      {number && (
        <div
          className={`grid h-13 w-13 place-items-center border text-[11px] font-extrabold tracking-[0.1em] ${
            dark ? 'border-white/25 text-sky' : 'border-[#bcd5ee] text-accent'
          }`}
        >
          {number}
        </div>
      )}
      <div>
        <p
          className={`m-0 text-[12px] font-bold tracking-[0.18em] uppercase ${dark ? 'text-sky' : 'text-accent'}`}
        >
          {kicker}
        </p>
        {/* 设计稿 clamp(38px, 5.2vw, 62px) */}
        <h2
          className={`mt-2.5 mb-0 max-w-[940px] font-display text-[34px] leading-[1.06] font-bold tracking-[-0.045em] sm:text-[46px] lg:text-[58px] ${
            dark ? 'text-white' : 'text-navy'
          }`}
        >
          {heading}
        </h2>
        {intro && (
          <p
            className={`mt-6 mb-0 max-w-[790px] text-[17px] leading-[1.75] ${dark ? 'text-cloud' : 'text-steel'}`}
          >
            {intro}
          </p>
        )}
      </div>
    </div>
  )
}

type CompareBlock = Extract<CaseBlock, { blockType: 'caseCompare' }>

/**
 * 「改造前 / 改造后」图示面板：左卡列出旧逻辑下无法区分的几种情形，
 * 右卡放一张识别画面 + 控制层读数。以 panelImage 为开关，没传图就整块不渲染。
 *
 * 窄屏两卡上下排，中间那颗 AI 圆点在断点下换方向 —— 用 grid 的行列切换实现，
 * 不做两套 DOM。
 */
function ContrastPanel({ block }: { block: CompareBlock }) {
  const rows = block.panelBeforeRows ?? []
  const tags = block.panelImageTags ?? []
  const facts = block.panelAfterFacts ?? []
  const corner: Record<string, string> = {
    bottomLeft: 'bottom-5 left-5 border-l-[3px] border-go',
    topRight: 'top-5 right-5 border-l-[3px] border-accent-soft',
    topLeft: 'top-5 left-5 border-l-[3px] border-accent-soft',
  }

  return (
    <div className="grid grid-cols-1 items-center gap-y-9 lg:grid-cols-[minmax(0,0.9fr)_70px_minmax(0,1.1fr)] lg:gap-y-0">
      {/* 左：旧逻辑 */}
      <article className="border border-line bg-white shadow-[0_22px_70px_rgba(6,28,59,0.08)]">
        <div className="flex items-center justify-between gap-5 border-b border-line px-6 py-[22px]">
          <span className="text-[10px] font-extrabold tracking-[0.17em] text-accent uppercase">
            {block.panelBeforeLabel}
          </span>
          <strong className="text-[14px] font-semibold text-navy">{block.panelBeforeTitle}</strong>
        </div>
        <div className="grid gap-4 px-7 py-8">
          {rows.map((row) => (
            <div
              key={row.id}
              className="grid grid-cols-[62px_1fr_auto] items-center gap-[18px] border border-line p-4"
            >
              <span className="relative grid h-[62px] w-[62px] place-items-center overflow-hidden rounded-[14px] border border-line bg-mist">
                {row.image ? (
                  <MediaImage media={row.image} size="card" fill sizes="62px" />
                ) : (
                  <em className="text-[11px] font-extrabold tracking-[0.08em] text-steel not-italic">
                    {row.symbol}
                  </em>
                )}
                {row.image && (
                  <small className="absolute right-1 bottom-1 z-[2] bg-navy/90 px-[5px] py-[3px] text-[7px] leading-none font-extrabold tracking-[0.12em] text-white">
                    {row.symbol}
                  </small>
                )}
              </span>
              <p className="m-0 text-[14px] font-semibold text-ink">
                {row.text}
                {row.note && (
                  <small className="mt-1 block text-[11px] font-normal text-steel">{row.note}</small>
                )}
              </p>
              {row.tag && (
                <b className="border border-flag/30 bg-flag/8 px-[9px] py-[7px] text-[9px] tracking-[0.12em] text-flag uppercase">
                  {row.tag}
                </b>
              )}
            </div>
          ))}
        </div>
        {block.panelBeforeResultValue && (
          <div className="mx-7 mb-7 border-l-[3px] border-flag bg-flag/6 p-[22px]">
            <span className="block text-[10px] tracking-[0.1em] text-flag uppercase">
              {block.panelBeforeResultLabel}
            </span>
            <strong className="mt-1.5 block text-[17px] font-bold text-navy">
              {block.panelBeforeResultValue}
            </strong>
          </div>
        )}
      </article>

      {/* 中：AI 转折点 */}
      {/* 细线方向随断点换：窄屏两卡上下排是竖线，宽屏并排是横线 */}
      <div className="relative flex h-12 items-center justify-center lg:h-auto" aria-hidden="true">
        <i className="absolute bg-[#9fb8d2] max-lg:h-full max-lg:w-px lg:h-px lg:w-full" />
        <span className="relative z-[1] grid h-[39px] w-[39px] place-items-center rounded-full bg-accent text-[11px] font-extrabold text-white shadow-[0_0_0_7px_var(--color-mist)]">
          AI
        </span>
      </div>

      {/* 右：新逻辑 */}
      <article className="border border-line bg-white shadow-[0_22px_70px_rgba(6,28,59,0.08)]">
        <div className="flex items-center justify-between gap-5 border-b border-line px-6 py-[22px]">
          <span className="text-[10px] font-extrabold tracking-[0.17em] text-accent uppercase">
            {block.panelAfterLabel}
          </span>
          <strong className="text-[14px] font-semibold text-navy">{block.panelAfterTitle}</strong>
        </div>
        <div className="relative m-6 h-[240px] bg-navy lg:h-[310px]">
          <MediaImage
            media={block.panelImage}
            size="feature"
            fill
            sizes="(min-width: 1024px) 620px, 100vw"
          />
          {tags.map((tag) => (
            <span
              key={tag.id}
              className={`absolute z-[2] bg-navy/90 px-2 py-1.5 text-[9px] font-extrabold tracking-[0.11em] text-white ${
                corner[tag.corner ?? 'bottomLeft']
              }`}
            >
              {tag.text}
            </span>
          ))}
        </div>
        {facts.length > 0 && (
          <div className="mx-6 mb-6 grid grid-cols-3 gap-px border border-line bg-line">
            {facts.map((fact) => (
              <div key={fact.id} className={fact.highlight ? 'bg-go/8 p-4' : 'bg-white p-4'}>
                <small className="block text-[8px] tracking-[0.11em] text-steel uppercase">
                  {fact.label}
                </small>
                <strong
                  className={`mt-1.5 block text-[12px] font-bold ${fact.highlight ? 'text-go' : 'text-navy'}`}
                >
                  {fact.value}
                </strong>
              </div>
            ))}
          </div>
        )}
      </article>
    </div>
  )
}

/**
 * 案例章节渲染器：后台拼什么，前端渲染什么。
 * 底色按序号交替（白 / 浅灰），收尾块固定深蓝 —— 与首页的节奏一致。
 * 字号与留白按客户认可的设计稿还原，配色换成站点品牌色。
 */
export function RenderCaseSections({ blocks }: { blocks: CaseBlock[] }) {
  /*
    编号与底色都只按「独立章节」算：佐证图（side）并进上一节、深色收尾不编号，
    它们跳过计数，后面的章节号才不会被顶掉一位。底色同理 —— 佐证图沿用上一节
    的底色，看起来才是同一节的一部分。
  */
  const isMerged = (b: CaseBlock) => b.blockType === 'caseFigure' && b.variant === 'side'
  const laid: {
    block: CaseBlock
    merged: boolean
    number: string | null
    bg: string
    pad: string
  }[] = []
  let counter = 0
  let lastBg = 'bg-white'
  for (const [i, block] of blocks.entries()) {
    const merged = isMerged(block)
    const numbered = !merged && block.blockType !== 'caseStatement'
    if (numbered) counter += 1
    const bg = merged ? lastBg : counter % 2 === 0 ? 'bg-mist' : 'bg-white'
    if (!merged) lastBg = bg
    // 下一块是佐证图时本节不收底，两者之间只留 54px，读起来才是同一节
    const pad = blocks[i + 1] && isMerged(blocks[i + 1]) ? 'pt-[70px] lg:pt-[100px]' : SECTION
    laid.push({ block, merged, number: numbered ? num(counter - 1) : null, bg, pad })
  }

  return (
    <>
      {laid.map(({ block, merged, number, bg, pad }) => {
        switch (block.blockType) {
          /* 问题陈述：左标题 右引语+清单 */
          case 'caseSplit':
            return (
              <section key={block.id} className={bg}>
                <Container className={pad}>
                  <div className="grid grid-cols-1 items-start gap-12 lg:grid-cols-2 lg:gap-20">
                    <div>
                      <SectionHead
                        number={number}
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

          /* 佐证图：图片 + 右侧深蓝说明面板，接在上一节末尾，不单独编号 */
          case 'caseFigure':
            if (merged)
              return (
                <section key={block.id} className={bg}>
                  <Container className="pt-[54px] pb-[70px] lg:pb-[100px]">
                    <figure className="m-0 grid grid-cols-1 bg-navy text-white shadow-[0_22px_70px_rgba(6,28,59,0.08)] lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.45fr)]">
                      <div className="relative min-h-[260px] lg:min-h-[430px]">
                        <MediaImage
                          media={block.image}
                          size="feature"
                          fill
                          sizes="(min-width: 1024px) 800px, 100vw"
                        />
                      </div>
                      <figcaption className="flex flex-col justify-end p-8 lg:border-l lg:border-white/15 lg:p-[42px]">
                        <span className="text-[9px] font-extrabold tracking-[0.17em] text-sky uppercase">
                          {block.kicker}
                        </span>
                        <strong className="mt-3.5 block font-display text-[19px] leading-[1.3] font-bold">
                          {block.heading}
                        </strong>
                        {block.intro && (
                          <p className="mt-4 mb-0 text-[15px] leading-[1.65] text-cloud">
                            {block.intro}
                          </p>
                        )}
                      </figcaption>
                    </figure>
                    {block.banner && (
                      <div className="mt-8 bg-navy px-[30px] py-[22px] text-center font-display text-[18px] leading-[1.45] font-bold text-white sm:text-[21px]">
                        {block.banner}
                      </div>
                    )}
                  </Container>
                </section>
              )
            return (
              <section key={block.id} className={bg}>
                <Container className={pad}>
                  <SectionHead
                    number={number}
                    kicker={block.kicker}
                    heading={block.heading}
                    intro={block.intro}
                  />
                  {/* 示意图按原始比例展示、不裁切；用原图而非 feature（1280px 在 2 倍屏上会糊） */}
                  <div className="border border-line bg-white p-2 sm:p-[22px]">
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
                <Container className={pad}>
                  <SectionHead
                    number={number}
                    kicker={block.kicker}
                    heading={block.heading}
                    intro={block.intro}
                  />
                  <div
                    className={`grid grid-cols-1 gap-7 ${
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
                  {/* 口径小格：数据是怎么测出来的（窗口、间隔、仪器台数） */}
                  {(block.facts?.length ?? 0) > 0 && (
                    <div className="mt-10 grid grid-cols-2 gap-x-7 gap-y-6 sm:grid-cols-4">
                      {block.facts!.map((fact) => (
                        <div key={fact.id} className="border-t border-line pt-4">
                          <b className="block font-display text-[22px] leading-none font-bold text-navy">
                            {fact.value}
                          </b>
                          <span className="mt-2 block text-[13px] leading-[1.5] text-steel">
                            {fact.label}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                  {block.note && (
                    <p className="mt-8 mb-0 max-w-[760px] text-[13px] leading-[1.6] text-steel">
                      {block.note}
                    </p>
                  )}
                </Container>
              </section>
            )
          }

          /* 步骤条 */
          case 'caseSteps':
            return (
              <section key={block.id} className={bg}>
                <Container className={pad}>
                  <SectionHead
                    number={number}
                    kicker={block.kicker}
                    heading={block.heading}
                    intro={block.intro}
                  />
                  {/*
                    宽屏是一条横贯的流程带：整条上下两根横线，格与格之间竖线分隔，
                    接缝上再压一颗 › 圆点。分隔线只在「一行放得下全部步骤」时才成立
                    —— 换行后判断不出哪一格是行尾（每个断点列数不同），所以 lg 以下
                    改成每格自带顶线，行列怎么变都不会错位。
                  */}
                  {(() => {
                    const steps = block.steps ?? []
                    const cols =
                      { 2: 'lg:grid-cols-2', 3: 'lg:grid-cols-3', 4: 'lg:grid-cols-4', 5: 'lg:grid-cols-5', 6: 'lg:grid-cols-6' }[
                        steps.length
                      ] ?? 'lg:grid-cols-6'
                    return (
                      <div
                        className={`grid grid-cols-1 gap-y-10 sm:grid-cols-2 lg:gap-y-0 lg:border-y lg:border-line ${cols}`}
                      >
                        {steps.map((step, s) => (
                          <article
                            key={step.id}
                            className="relative min-w-0 max-lg:border-t-2 max-lg:border-accent max-lg:pt-[26px] lg:min-h-[360px] lg:px-4 lg:pt-[22px] lg:pb-[27px] lg:not-last:border-r lg:not-last:border-line"
                          >
                            <div className="flex items-center justify-between gap-2.5 lg:mb-4">
                              <span className="text-[10px] font-extrabold tracking-[0.13em] text-accent">
                                {num(s)}
                              </span>
                              {block.cellLabel && (
                                <small className="hidden text-[7px] font-bold tracking-[0.1em] whitespace-nowrap text-fog uppercase lg:block">
                                  {block.cellLabel}
                                </small>
                              )}
                            </div>
                            {step.image && (
                              <div className="relative mt-4 h-[150px] overflow-hidden border border-[#c7d7e6] bg-mist lg:mt-0 lg:mb-[26px] lg:h-[112px]">
                                <MediaImage media={step.image} size="card" fill sizes="240px" />
                                <span
                                  className="pointer-events-none absolute inset-[9px] z-[2] border border-accent-soft/30"
                                  aria-hidden="true"
                                />
                                <span className="absolute right-2.5 bottom-2.5 z-[3] bg-navy/88 px-1.5 py-[5px] text-[8px] font-extrabold tracking-[0.1em] text-white uppercase">
                                  {step.title}
                                </span>
                              </div>
                            )}
                            <strong className="mt-2.5 block text-[17px] leading-[1.3] font-semibold text-navy lg:mt-0">
                              {step.title}
                            </strong>
                            <span className="mt-3 block text-[13px] leading-[1.6] text-steel">
                              {step.text}
                            </span>
                            {/* 接缝上的箭头：只在单排时出现，换行后没有接缝可压 */}
                            {s < steps.length - 1 && (
                              <b
                                className="absolute top-[47px] -right-3 z-[2] hidden h-[23px] w-[23px] place-items-center rounded-full border border-[#adc4da] bg-white text-[17px] leading-none text-accent lg:grid"
                                aria-hidden="true"
                              >
                                ›
                              </b>
                            )}
                          </article>
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

          /* 前后对比表（可选：表格上方再放一组「改造前 / 改造后」图示卡） */
          case 'caseCompare':
            return (
              <section key={block.id} className={bg}>
                <Container className={pad}>
                  <SectionHead
                    number={number}
                    kicker={block.kicker}
                    heading={block.heading}
                    intro={block.intro}
                  />
                  {block.panelImage && <ContrastPanel block={block} />}
                  {/* 窄屏横向滚动，页面本身不出现横向滚动条 */}
                  <div className={`overflow-x-auto ${block.panelImage ? 'mt-11' : ''}`}>
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
                      number={number}
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

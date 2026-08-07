import { Fragment } from 'react'

import { Container } from '@/components/ui/Container'
import { MediaImage } from '@/components/ui/MediaImage'
import { MediaVideo } from '@/components/ui/MediaVideo'
import type { CaseStudy } from '@/payload-types'

/** CaseStudies.sections 的 block 联合类型（由 payload-types 自动生成） */
type CaseBlock = NonNullable<CaseStudy['sections']>[number]

/** 章节序号：01 · 客户的要求 */
const num = (i: number) => String(i + 1).padStart(2, '0')

/** 章节留白：设计稿是 112px，窄屏 70px */
const SECTION = 'py-[70px] lg:py-[112px]'

/** 底色档位：auto 走交替，其余由这一节自己指定 */
const THEMES: Record<string, { bg: string; dark: boolean }> = {
  white: { bg: 'bg-white', dark: false },
  wash: { bg: 'bg-wash', dark: false },
  washBlue: { bg: 'bg-wash-blue', dark: false },
  dark: { bg: 'bg-navy', dark: true },
}

/**
 * 章节外壳：底色、左缘强调条、深蓝底上的背景照片都在这里，
 * 各版式只管里面的内容，不用各自处理一遍。
 */
function Section({
  bg,
  dark,
  photo,
  accentEdge,
  className,
  children,
}: {
  bg: string
  dark: boolean
  photo?: CaseFigure['image'] | null
  accentEdge?: boolean | null
  className?: string
  children: React.ReactNode
}) {
  return (
    <section className={`relative overflow-hidden ${bg}`}>
      {dark && photo && (
        <>
          <div className="absolute inset-0 opacity-30">
            <MediaImage media={photo} size="feature" fill sizes="100vw" />
          </div>
          <div className="absolute inset-0 bg-linear-to-b from-navy/97 to-navy-deep/98" />
        </>
      )}
      {accentEdge && (
        <i
          className="absolute inset-y-0 left-0 z-[1] w-[9px] bg-linear-to-b from-accent to-accent-soft"
          aria-hidden="true"
        />
      )}
      <Container className={`relative ${className ?? SECTION}`}>{children}</Container>
    </section>
  )
}

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
type CaseFigure = Extract<CaseBlock, { blockType: 'caseFigure' }>

/**
 * 流程带里「没有实物可拍」那几格的示意图：推理、传输这类环节，
 * 硬塞一张机柜照片只会误导读者以为那一步发生在某个具体设备上。
 */
function Pictogram({ kind }: { kind: 'ai' | 'network' }) {
  return (
    <svg viewBox="0 0 160 112" className="h-full w-full" role="presentation">
      <rect width="160" height="112" fill="var(--color-navy)" />
      {kind === 'ai' ? (
        <>
          <rect
            x="46"
            y="30"
            width="68"
            height="52"
            fill="none"
            stroke="var(--color-accent-soft)"
            strokeWidth="1"
            opacity="0.55"
          />
          <rect
            x="54"
            y="38"
            width="52"
            height="36"
            fill="none"
            stroke="var(--color-accent-soft)"
            strokeWidth="1"
            opacity="0.3"
          />
          <text
            x="80"
            y="58"
            textAnchor="middle"
            fill="#fff"
            fontSize="19"
            fontWeight="700"
            letterSpacing="1"
          >
            AI
          </text>
          <text
            x="80"
            y="69"
            textAnchor="middle"
            fill="var(--color-accent-soft)"
            fontSize="7"
            fontWeight="700"
            letterSpacing="2.5"
          >
            VISION
          </text>
        </>
      ) : (
        <>
          <line
            x1="46"
            y1="56"
            x2="114"
            y2="56"
            stroke="var(--color-accent-soft)"
            strokeWidth="1"
            opacity="0.5"
          />
          {[46, 80, 114].map((cx) => (
            <circle
              key={cx}
              cx={cx}
              cy="56"
              r="9"
              fill="var(--color-navy)"
              stroke="var(--color-accent-soft)"
              strokeWidth="1.4"
            />
          ))}
        </>
      )}
    </svg>
  )
}

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
    dark: boolean
    pad: string
  }[] = []
  let counter = 0
  let lastBg: string = 'bg-white'
  let lastDark: boolean = false
  for (const [i, block] of blocks.entries()) {
    const merged = isMerged(block)
    const numbered = !merged && block.blockType !== 'caseStatement'
    if (numbered) counter += 1
    // 收尾块固定深蓝；其余没指定底色时按序号交替
    const picked =
      block.blockType === 'caseStatement'
        ? THEMES.dark
        : THEMES[block.theme ?? 'auto'] ||
          (counter % 2 === 0 ? { bg: 'bg-wash', dark: false } : { bg: 'bg-white', dark: false })
    const bg: string = merged ? lastBg : picked.bg
    const dark: boolean = merged ? lastDark : picked.dark
    if (!merged) {
      lastBg = bg
      lastDark = dark
    }
    // 下一块是佐证图时本节不收底，两者之间只留 54px，读起来才是同一节
    const pad = blocks[i + 1] && isMerged(blocks[i + 1]) ? 'pt-[70px] lg:pt-[112px]' : SECTION
    laid.push({ block, merged, number: numbered ? num(counter - 1) : null, bg, dark, pad })
  }

  return (
    <>
      {laid.map(({ block, merged, number, bg, dark, pad }) => {
        const shell = {
          bg,
          dark,
          photo: block.blockType === 'caseStatement' ? null : block.themeImage,
          accentEdge: block.blockType === 'caseStatement' ? false : block.accentEdge,
        }

        switch (block.blockType) {
          /* 问题陈述：左侧深蓝引语卡，右侧问题清单 */
          case 'caseSplit':
            return (
              <Section key={block.id} {...shell} className={pad}>
                <SectionHead
                  number={number}
                  kicker={block.kicker}
                  heading={block.heading}
                  intro={block.intro}
                  dark={dark}
                />
                <div className="grid grid-cols-1 items-stretch gap-10 lg:grid-cols-[1.06fr_0.94fr] lg:gap-18">
                  {block.quote && (
                    <div className="relative flex min-h-[430px] flex-col justify-between overflow-hidden bg-navy p-9 text-white shadow-[0_22px_70px_rgba(6,28,59,0.14)] lg:p-13">
                      {/* 右下角的描边圆环，纯装饰 */}
                      <i
                        className="absolute -right-[130px] -bottom-[160px] h-[330px] w-[330px] rounded-full border border-sky/25 shadow-[0_0_0_58px_rgba(79,141,242,0.04)]"
                        aria-hidden="true"
                      />
                      <span className="relative z-[1] h-11 font-display text-[80px] leading-[0.8] text-accent-soft">
                        “
                      </span>
                      <p className="relative z-[1] m-0 mt-5 mb-11 max-w-[610px] text-[25px] leading-[1.38] font-medium sm:text-[30px] lg:text-[34px]">
                        {block.quote}
                      </p>
                      {(block.quoteLabel || block.quoteFooter) && (
                        <div className="relative z-[1] border-t border-white/17 pt-5">
                          <span className="block text-[9px] tracking-[0.16em] text-fog uppercase">
                            {block.quoteLabel}
                          </span>
                          <b className="mt-1.5 block text-[11px] tracking-[0.08em] text-accent-soft uppercase">
                            {block.quoteFooter}
                          </b>
                        </div>
                      )}
                    </div>
                  )}
                  <div className="grid content-stretch">
                    {(block.points ?? []).map((point, p) => (
                      <article
                        key={point.id}
                        className={`grid grid-cols-[38px_minmax(0,1fr)] items-start gap-5 border-t py-[30px] last:border-b ${
                          dark ? 'border-white/15' : 'border-line'
                        }`}
                      >
                        <b className="text-[11px] tracking-[0.12em] text-accent">{num(p)}</b>
                        <div>
                          <h3
                            className={`m-0 text-[19px] leading-[1.3] font-semibold ${dark ? 'text-white' : 'text-navy'}`}
                          >
                            {point.label}
                          </h3>
                          <p
                            className={`mt-2.5 mb-0 text-[15px] leading-[1.65] ${dark ? 'text-cloud' : 'text-steel'}`}
                          >
                            {point.text}
                          </p>
                        </div>
                      </article>
                    ))}
                  </div>
                </div>
              </Section>
            )

          /* 佐证图：图片 + 右侧深蓝说明面板，接在上一节末尾，不单独编号 */
          case 'caseFigure':
            if (merged)
              return (
                <Section
                  key={block.id}
                  {...shell}
                  className="pt-[54px] pb-[70px] lg:pb-[112px]"
                >
                  <figure className="m-0 grid grid-cols-1 bg-navy text-white shadow-[0_22px_70px_rgba(6,28,59,0.08)] lg:grid-cols-[minmax(0,1.55fr)_minmax(280px,0.45fr)]">
                    <div className="relative min-h-[260px] lg:min-h-[430px]">
                      {block.video ? (
                        <MediaVideo
                          video={block.video}
                          poster={block.image}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <MediaImage
                          media={block.image}
                          size="feature"
                          fill
                          sizes="(min-width: 1024px) 800px, 100vw"
                        />
                      )}
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
                </Section>
              )
            return (
              <Section key={block.id} {...shell} className={pad}>
                <SectionHead
                  number={number}
                  kicker={block.kicker}
                  heading={block.heading}
                  intro={block.intro}
                  dark={dark}
                />
                {/* 示意图按原始比例展示、不裁切；用原图而非 feature（1280px 在 2 倍屏上会糊） */}
                <div
                  className={`border p-2 sm:p-[22px] ${dark ? 'border-white/20 bg-navy-deep' : 'border-line bg-white'}`}
                >
                  {block.video ? (
                    <MediaVideo video={block.video} poster={block.image} />
                  ) : (
                    <MediaImage
                      media={block.image}
                      sizes="(min-width: 1240px) 1136px, 100vw"
                      quality={90}
                    />
                  )}
                </div>
                {block.banner && (
                  <div className="mt-8 bg-navy px-[30px] py-[22px] text-center font-display text-[18px] leading-[1.45] font-bold text-white sm:text-[21px]">
                    {block.banner}
                  </div>
                )}
              </Section>
            )

          /* 卡片网格：有图两栏（图在左），无图三栏；拼贴时首末两张通栏；数据版式左读数右佐证 */
          case 'caseCards': {
            const cards = block.cards ?? []
            const withImages = cards.some((card) => card.image)
            // 拼贴要有图、且至少 4 张才成立，否则退回等宽网格
            const bento = block.layout === 'bento' && withImages && cards.length >= 4

            /* 数据版式：左侧读数卡竖排，右侧一张佐证图 + 口径小格 + 小字 */
            if (block.layout === 'metrics')
              return (
                <Section key={block.id} {...shell} className={pad}>
                  <SectionHead
                    number={number}
                    kicker={block.kicker}
                    heading={block.heading}
                    intro={block.intro}
                    dark={dark}
                  />
                  <div className="grid grid-cols-1 gap-[34px] lg:grid-cols-[minmax(360px,0.72fr)_minmax(0,1.28fr)]">
                    <div className="grid content-start gap-3.5">
                      {cards.map((card) => (
                        <article
                          key={card.id}
                          className="grid min-h-[158px] grid-cols-[minmax(0,1fr)_auto] items-end border border-l-4 border-line border-l-accent bg-white p-[27px]"
                        >
                          <div>
                            <span className="block text-[14px] font-bold text-navy">
                              {card.title}
                            </span>
                            {card.tag && (
                              <small className="mt-1.5 block text-[11px] text-steel">
                                {card.tag}
                              </small>
                            )}
                          </div>
                          {card.value && (
                            <strong className="font-display text-[38px] leading-[0.9] font-bold tracking-[-0.045em] text-accent sm:text-[48px]">
                              {card.value}
                            </strong>
                          )}
                          <p className="col-span-full mt-[22px] mb-0 border-t border-line pt-[13px] text-[11px] text-steel">
                            {card.text}
                          </p>
                        </article>
                      ))}
                    </div>
                    <div className="min-w-0 bg-navy text-white">
                      {block.sideImage && (
                        <div className="relative h-[240px] lg:h-[330px]">
                          <MediaImage
                            media={block.sideImage}
                            size="feature"
                            fill
                            sizes="(min-width: 1024px) 720px, 100vw"
                          />
                          {block.sideImageValue && (
                            <div className="absolute right-6 bottom-6 z-[2] bg-navy/88 px-3.5 py-2.5">
                              <small className="block text-[8px] tracking-[0.14em] text-sky uppercase">
                                {block.sideImageLabel}
                              </small>
                              <strong className="mt-1 block font-display text-[17px] leading-none font-bold">
                                {block.sideImageValue}
                              </strong>
                            </div>
                          )}
                        </div>
                      )}
                      {(block.facts?.length ?? 0) > 0 && (
                        <div className="grid grid-cols-1 gap-px bg-white/12 sm:grid-cols-3">
                          {block.facts!.map((fact) => (
                            <div key={fact.id} className="bg-navy px-6 py-[22px]">
                              <b className="block font-display text-[19px] leading-none font-bold">
                                {fact.value}
                              </b>
                              <span className="mt-2 block text-[11px] leading-[1.5] text-cloud">
                                {fact.label}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {block.note && (
                        <p className="m-0 border-t border-white/12 px-6 py-[22px] text-[11px] leading-[1.65] text-cloud">
                          {block.note}
                        </p>
                      )}
                    </div>
                  </div>
                </Section>
              )

            return (
              <Section key={block.id} {...shell} className={pad}>
                <SectionHead
                  number={number}
                  kicker={block.kicker}
                  heading={block.heading}
                  intro={block.intro}
                  dark={dark}
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
                            ? `grid grid-cols-1 gap-7 ${dark ? 'border border-sky/20 bg-navy-deep/70 p-5' : 'border-t border-line pt-[26px]'}`
                            : `pt-[22px] ${dark ? 'border-t-4 border-accent-soft' : 'border-t-4 border-accent'}`,
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
                            className={`relative ${dark ? 'bg-navy' : 'bg-mist'} ${
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
                            <div
                              className={`mb-2 text-[12px] font-bold tracking-[0.16em] uppercase ${dark ? 'text-sky' : 'text-accent'}`}
                            >
                              {card.tag}
                            </div>
                          )}
                          <h3
                            className={`m-0 font-display text-[24px] leading-[1.25] font-bold ${dark ? 'text-white' : 'text-navy'}`}
                          >
                            {card.title}
                          </h3>
                          <p
                            className={`mt-3.5 mb-0 text-[16px] leading-[1.65] ${dark ? 'text-cloud' : 'text-steel'}`}
                          >
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
                      <div
                        key={fact.id}
                        className={`border-t pt-4 ${dark ? 'border-white/15' : 'border-line'}`}
                      >
                        <b
                          className={`block font-display text-[22px] leading-none font-bold ${dark ? 'text-white' : 'text-navy'}`}
                        >
                          {fact.value}
                        </b>
                        <span
                          className={`mt-2 block text-[13px] leading-[1.5] ${dark ? 'text-cloud' : 'text-steel'}`}
                        >
                          {fact.label}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
                {block.note && (
                  <p
                    className={`mt-8 mb-0 max-w-[760px] text-[13px] leading-[1.6] ${dark ? 'text-cloud' : 'text-steel'}`}
                  >
                    {block.note}
                  </p>
                )}
              </Section>
            )
          }

          /* 步骤：三种版式 —— 流程带 / 状态流 / 网格 */
          case 'caseSteps': {
            const steps = block.steps ?? []
            const style = block.style ?? 'strip'
            const TONES: Record<string, string> = {
              accent: 'bg-accent',
              flag: 'bg-flag',
              go: 'bg-go',
              navy: 'bg-navy',
            }
            return (
              <Section key={block.id} {...shell} className={pad}>
                <SectionHead
                  number={number}
                  kicker={block.kicker}
                  heading={block.heading}
                  intro={block.intro}
                  dark={dark}
                />

                {/* 状态流：一排彩色圆徽章，用颜色说明每一步处在什么状态 */}
                {style === 'flow' && (
                  <div
                    className={`grid grid-cols-1 items-center gap-y-7 border-y py-7 sm:grid-cols-2 lg:grid-cols-[1fr_28px_1fr_28px_1fr_28px_1fr] lg:gap-y-0 ${dark ? 'border-white/15' : 'border-line'}`}
                  >
                    {steps.map((step, s) => (
                      <Fragment key={step.id}>
                        <article className="grid min-w-0 grid-cols-[46px_minmax(0,1fr)] items-start gap-[15px]">
                          <span
                            className={`grid h-[42px] w-[42px] place-items-center rounded-full text-[9px] font-extrabold text-white ${TONES[step.tone ?? 'accent']}`}
                          >
                            {num(s)}
                          </span>
                          <div>
                            <small
                              className={`block text-[8px] font-extrabold tracking-[0.13em] uppercase ${dark ? 'text-sky' : 'text-accent'}`}
                            >
                              {step.title}
                            </small>
                            <h3
                              className={`m-0 mt-2 text-[15px] leading-[1.4] font-semibold ${dark ? 'text-white' : 'text-navy'}`}
                            >
                              {step.text}
                            </h3>
                          </div>
                        </article>
                        {s < steps.length - 1 && (
                          <i
                            className="hidden text-center text-[27px] leading-none text-[#a7bdd1] not-italic lg:block"
                            aria-hidden="true"
                          >
                            ›
                          </i>
                        )}
                      </Fragment>
                    ))}
                  </div>
                )}

                {/* 网格：每行三个，顶部一条强调线，格子靠右/下细线分隔 */}
                {style === 'grid' && (
                  <div
                    className={`grid grid-cols-1 border-t-2 sm:grid-cols-2 lg:grid-cols-3 ${dark ? 'border-accent-soft' : 'border-accent'}`}
                  >
                    {steps.map((step, s) => (
                      <article
                        key={step.id}
                        className={`min-h-[230px] border-b p-8 ${dark ? 'border-white/15 bg-navy-deep/60' : 'border-line bg-white'} ${
                          dark ? 'lg:not-nth-[3n]:border-r' : 'lg:not-nth-[3n]:border-r'
                        } ${dark ? 'lg:border-r-white/15' : 'lg:border-r-line'}`}
                      >
                        <span
                          className={`mb-9 block text-[10px] font-extrabold tracking-[0.12em] ${dark ? 'text-sky' : 'text-accent'}`}
                        >
                          {num(s)}
                        </span>
                        <h3
                          className={`m-0 text-[19px] leading-[1.3] font-semibold ${dark ? 'text-white' : 'text-navy'}`}
                        >
                          {step.title}
                        </h3>
                        <p
                          className={`mt-3 mb-0 text-[13px] leading-[1.6] ${dark ? 'text-cloud' : 'text-steel'}`}
                        >
                          {step.text}
                        </p>
                      </article>
                    ))}
                  </div>
                )}

                {/*
                  流程带：整条上下两根横线，格与格之间竖线分隔，接缝上再压一颗 › 圆点。
                  分隔线只在「一行放得下全部步骤」时才成立 —— 换行后判断不出哪一格是
                  行尾（每个断点列数不同），所以 lg 以下改成每格自带顶线，行列怎么变
                  都不会错位。
                */}
                {style === 'strip' &&
                  (() => {
                    const cols =
                      {
                        2: 'lg:grid-cols-2',
                        3: 'lg:grid-cols-3',
                        4: 'lg:grid-cols-4',
                        5: 'lg:grid-cols-5',
                        6: 'lg:grid-cols-6',
                      }[steps.length] ?? 'lg:grid-cols-6'
                    return (
                      <div
                        className={`grid grid-cols-1 gap-y-10 sm:grid-cols-2 lg:gap-y-0 lg:border-y ${dark ? 'lg:border-white/15' : 'lg:border-line'} ${cols}`}
                      >
                        {steps.map((step, s) => (
                          <article
                            key={step.id}
                            className={`relative min-w-0 max-lg:border-t-2 max-lg:pt-[26px] lg:min-h-[360px] lg:px-4 lg:pt-[22px] lg:pb-[27px] lg:not-last:border-r ${
                              dark
                                ? 'max-lg:border-accent-soft lg:not-last:border-white/15'
                                : 'max-lg:border-accent lg:not-last:border-line'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2.5 lg:mb-4">
                              <span
                                className={`text-[10px] font-extrabold tracking-[0.13em] ${dark ? 'text-sky' : 'text-accent'}`}
                              >
                                {num(s)}
                              </span>
                              {block.cellLabel && (
                                <small className="hidden text-[7px] font-bold tracking-[0.1em] whitespace-nowrap text-fog uppercase lg:block">
                                  {block.cellLabel}
                                </small>
                              )}
                            </div>
                            {(step.image || (step.pictogram && step.pictogram !== 'none')) && (
                              <div
                                className={`relative mt-4 h-[150px] overflow-hidden border lg:mt-0 lg:mb-[26px] lg:h-[112px] ${dark ? 'border-white/20 bg-navy' : 'border-[#c7d7e6] bg-mist'}`}
                              >
                                {step.pictogram && step.pictogram !== 'none' ? (
                                  <Pictogram kind={step.pictogram} />
                                ) : (
                                  <MediaImage
                                    media={step.image}
                                    size="card"
                                    fill
                                    focal
                                    sizes="240px"
                                  />
                                )}
                                <span
                                  className="pointer-events-none absolute inset-[9px] z-[2] border border-accent-soft/30"
                                  aria-hidden="true"
                                />
                                <span className="absolute right-2.5 bottom-2.5 z-[3] bg-navy/88 px-1.5 py-[5px] text-[8px] font-extrabold tracking-[0.1em] text-white uppercase">
                                  {step.title}
                                </span>
                              </div>
                            )}
                            <strong
                              className={`mt-2.5 block text-[17px] leading-[1.3] font-semibold lg:mt-0 ${dark ? 'text-white' : 'text-navy'}`}
                            >
                              {step.title}
                            </strong>
                            <span
                              className={`mt-3 block text-[13px] leading-[1.6] ${dark ? 'text-cloud' : 'text-steel'}`}
                            >
                              {step.text}
                            </span>
                            {/* 接缝上的箭头：只在单排时出现，换行后没有接缝可压 */}
                            {s < steps.length - 1 && (
                              <b
                                className={`absolute top-[47px] -right-3 z-[2] hidden h-[23px] w-[23px] place-items-center rounded-full border text-[17px] leading-none lg:grid ${dark ? 'border-white/25 bg-navy text-sky' : 'border-[#adc4da] bg-white text-accent'}`}
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
                  <div className="mt-10 flex flex-wrap items-baseline gap-x-8 gap-y-3 border-l-4 border-accent bg-navy px-[30px] py-[26px]">
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
              </Section>
            )
          }

          /* 前后对比表（可选：表格上方再放一组「改造前 / 改造后」图示卡） */
          case 'caseCompare': {
            const line = dark ? 'border-white/15' : 'border-line'
            return (
              <Section key={block.id} {...shell} className={pad}>
                <SectionHead
                  number={number}
                  kicker={block.kicker}
                  heading={block.heading}
                  intro={block.intro}
                  dark={dark}
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
                            className={`border-b p-[18px] text-[12px] font-bold tracking-[0.1em] uppercase ${line} ${dark ? 'text-sky' : 'text-accent'}`}
                          >
                            {label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {(block.rows ?? []).map((row) => (
                        <tr key={row.id}>
                          <td
                            className={`w-[22%] border-b p-[18px] align-top text-[16px] font-bold ${line} ${dark ? 'text-white' : 'text-navy'}`}
                          >
                            {row.area}
                          </td>
                          <td
                            className={`w-[39%] border-b p-[18px] align-top text-[16px] ${line} ${dark ? 'text-cloud' : 'text-steel'}`}
                          >
                            {row.before}
                          </td>
                          <td
                            className={`border-b p-[18px] align-top text-[16px] font-bold ${line} ${dark ? 'text-white' : 'text-navy'}`}
                          >
                            {row.after}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Section>
            )
          }

          /* 深蓝收尾：左标题、右正文 + 大字引语 */
          case 'caseStatement':
            return (
              <section key={block.id} className="relative overflow-hidden bg-navy text-white">
                {/* 右上角的描边圆环，纯装饰 */}
                <i
                  className="absolute -top-[250px] -right-[110px] h-[560px] w-[560px] rounded-full border border-sky/20 shadow-[0_0_0_70px_rgba(79,141,242,0.03),0_0_0_140px_rgba(79,141,242,0.02)]"
                  aria-hidden="true"
                />
                <Container className="relative py-[80px] lg:py-[118px]">
                  <div className="grid grid-cols-1 gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-25">
                    <div>
                      <p className="m-0 text-[12px] font-bold tracking-[0.18em] text-sky uppercase">
                        {block.kicker}
                      </p>
                      <h2 className="mt-2.5 mb-0 font-display text-[34px] leading-[1.06] font-bold tracking-[-0.045em] text-white sm:text-[42px] lg:text-[52px]">
                        {block.heading}
                      </h2>
                    </div>
                    <div>
                      {block.body && (
                        <p className="m-0 mb-[42px] max-w-[610px] text-[17px] leading-[1.75] text-cloud">
                          {block.body}
                        </p>
                      )}
                      <blockquote className="m-0 border-t border-white/18 pt-7 text-[23px] leading-[1.35] font-normal tracking-[-0.03em] text-cloud sm:text-[30px] lg:text-[36px]">
                        {block.statement}
                      </blockquote>
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

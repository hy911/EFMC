/**
 * JSON 契约的章节 → Payload block 的字段映射。**这份映射只能有一处。**
 *
 * 两个地方在用：
 * - scripts/import-case-study.mjs：导入时按 en 取值写库
 * - scripts/lib/case-preview.mjs：客户端预览时按 en 或 zh 取值，直接喂给真实渲染器
 *
 * 预览那边少映射一个字段，客户就会看不到自己刚写的内容却查不出原因，
 * 所以别在预览里另抄一份 —— 加字段改这里，两处一起生效。
 *
 * `pick` 决定取哪个语种（case-schema.mjs 的 en / zh）；`media` 是
 * 文件名 → 媒体值的映射：导入时是 media id，预览时是可直接渲染的媒体对象。
 */
import { BLOCK_TYPE } from './case-schema.mjs'

export function sectionToBlock(s, media, pick) {
  const base = {
    blockType: BLOCK_TYPE[s.type],
    kicker: pick(s.kicker),
    heading: pick(s.heading),
    intro: pick(s.intro),
    theme: s.theme ?? 'auto',
    themeImage: s.themeImage ? media[s.themeImage] : undefined,
    accentEdge: s.accentEdge === true,
  }
  switch (s.type) {
    case 'split':
      return {
        ...base,
        quote: pick(s.quote),
        quoteLabel: pick(s.quoteLabel),
        quoteFooter: pick(s.quoteFooter),
        points: s.points.map((p) => ({ label: pick(p.label), text: pick(p.text) })),
      }
    case 'figure':
      return {
        ...base,
        variant: s.variant ?? 'full',
        image: media[s.image],
        video: s.video ? media[s.video] : undefined,
        banner: pick(s.banner),
      }
    case 'cards':
      return {
        ...base,
        layout: s.layout ?? 'uniform',
        cards: s.cards.map((c) => ({
          image: c.image ? media[c.image] : undefined,
          tag: pick(c.tag),
          title: pick(c.title),
          value: pick(c.value),
          text: pick(c.text),
        })),
        sideImage: s.sideImage ? media[s.sideImage] : undefined,
        sideImageLabel: pick(s.sideImageLabel),
        sideImageValue: pick(s.sideImageValue),
        facts: (s.facts ?? []).map((f) => ({ value: pick(f.value), label: pick(f.label) })),
        note: pick(s.note),
      }
    case 'steps':
      return {
        ...base,
        style: s.style ?? 'strip',
        cellLabel: pick(s.cellLabel),
        steps: s.steps.map((st) => ({
          image: st.image ? media[st.image] : undefined,
          title: pick(st.title),
          tone: st.tone ?? 'accent',
          pictogram: st.pictogram ?? 'none',
          text: pick(st.text),
        })),
        proofValue: pick(s.proofValue),
        proofNote: pick(s.proofNote),
      }
    case 'compare':
      return {
        ...base,
        labelArea: pick(s.labels.area),
        labelBefore: pick(s.labels.before),
        labelAfter: pick(s.labels.after),
        rows: s.rows.map((r) => ({ area: pick(r.area), before: pick(r.before), after: pick(r.after) })),
        ...(s.panel
          ? {
              panelImage: media[s.panel.image],
              panelBeforeLabel: pick(s.panel.beforeLabel),
              panelBeforeTitle: pick(s.panel.beforeTitle),
              panelBeforeRows: s.panel.beforeRows.map((r) => ({
                image: r.image ? media[r.image] : undefined,
                symbol: pick(r.symbol),
                text: pick(r.text),
                note: pick(r.note),
                tag: pick(r.tag),
              })),
              panelBeforeResultLabel: pick(s.panel.beforeResultLabel),
              panelBeforeResultValue: pick(s.panel.beforeResultValue),
              panelAfterLabel: pick(s.panel.afterLabel),
              panelAfterTitle: pick(s.panel.afterTitle),
              panelImageTags: (s.panel.imageTags ?? []).map((t) => ({
                text: pick(t.text),
                corner: t.corner ?? 'bottomLeft',
              })),
              panelAfterFacts: (s.panel.afterFacts ?? []).map((f) => ({
                label: pick(f.label),
                value: pick(f.value),
                highlight: f.highlight === true,
              })),
            }
          : {}),
      }
    case 'statement':
      return { ...base, body: pick(s.body), statement: pick(s.statement) }
  }
}



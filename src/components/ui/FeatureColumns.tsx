export type FeatureColumnItem = {
  id?: string | null
  /** 可选加粗前缀，用于二级要点（如 HARDWARE / SOFTWARE） */
  label?: string | null
  text: string
}

export type FeatureColumn = {
  id?: string | null
  kicker?: string | null
  title: string
  items?: FeatureColumnItem[] | null
  footnote?: string | null
}

/** 栏数 → lg 断点列数；类名写成字面量，保证 Tailwind 扫描得到 */
const gridColsByCount: Record<number, string> = {
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
}

/**
 * 多栏要点（纯展示）—— 首页优势区与 Pages 的 featureColumns block 共用。
 * 刻意不依赖 payload-types：数据来源由调用方适配，组件只吃 props。
 * 视觉沿用设计体系的 1px 分隔线网格；手机上堆成单栏。
 */
export function FeatureColumns({ columns }: { columns: FeatureColumn[] }) {
  if (columns.length === 0) return null

  return (
    <div
      className={`grid grid-cols-1 gap-px border border-line bg-line sm:grid-cols-2 ${
        gridColsByCount[columns.length] ?? 'lg:grid-cols-4'
      }`}
    >
      {columns.map((col, i) => (
        <div key={col.id ?? i} data-reveal className="bg-white px-7 pt-9 pb-10">
          {col.kicker && (
            <div
              data-kicker
              className="mb-2.5 text-[12.5px] font-semibold tracking-[2.2px] text-accent uppercase"
            >
              {col.kicker}
            </div>
          )}
          <h3 className="m-0 mb-5 font-display text-[19px] font-semibold text-navy">{col.title}</h3>
          {(col.items?.length ?? 0) > 0 && (
            <ul className="m-0 list-none space-y-2.5 p-0">
              {(col.items ?? []).map((item, j) => (
                <li key={item.id ?? j} className="text-[14.5px] leading-[1.6] text-steel">
                  <span aria-hidden className="mr-2 text-accent">
                    ●
                  </span>
                  {item.label && <strong className="text-navy">{item.label}</strong>}
                  {item.label && ' '}
                  {item.text}
                </li>
              ))}
            </ul>
          )}
          {col.footnote && (
            <p data-footnote className="mt-6 mb-0 bg-mist px-3 py-2.5 text-[13px] leading-[1.5] text-steel">
              {col.footnote}
            </p>
          )}
        </div>
      ))}
    </div>
  )
}

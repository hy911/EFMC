/**
 * 区块头：eyebrow 小标题 + 大标题（设计稿统一模式）。
 * dark 变体用于深蓝底区块（Industries）。
 */
export function SectionHeader({
  eyebrow,
  title,
  dark = false,
  className,
}: {
  eyebrow: string
  title: string
  dark?: boolean
  className?: string
}) {
  return (
    <div data-reveal className={className}>
      <div
        className={`mb-3.5 text-[12.5px] font-semibold tracking-[2.2px] uppercase ${
          dark ? 'text-sky' : 'text-accent'
        }`}
      >
        {eyebrow}
      </div>
      <h2
        className={`m-0 font-display text-[28px] leading-[1.15] font-bold tracking-[-0.3px] sm:text-[38px] ${
          dark ? 'text-white' : 'text-navy'
        }`}
      >
        {title}
      </h2>
    </div>
  )
}

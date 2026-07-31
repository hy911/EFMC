import Image from 'next/image'

import type { Media } from '@/payload-types'

type Props = {
  /** Payload 的 media 关联字段值（depth>=1 时是完整文档，否则是 id） */
  media: Media | number | null | undefined
  /** 取哪个预生成尺寸；不传用原图 */
  size?: 'card' | 'feature' | 'og'
  /** 填充父容器（父级需 position:relative） */
  fill?: boolean
  className?: string
  sizes?: string
  priority?: boolean
  /** 压缩质量；默认 75。示意图这类细线图用 90（可选值在 next.config.ts 的 images.qualities） */
  quality?: 75 | 90
  /**
   * 按媒体文档上的焦点裁切（后台图片编辑里那个可拖的十字）。
   * 只在 fill 时有意义；不传就是居中裁切。
   * 不做成默认行为：页头那类手工指定过 object-position 的地方不该被焦点顶掉。
   */
  focal?: boolean
}

/**
 * Payload 媒体 → next/image 的适配组件。
 * 自动选择预生成的 WebP 尺寸并回落原图；alt 来自 media 文档（已按语种本地化）。
 */
export function MediaImage({
  media,
  size,
  fill,
  className,
  sizes,
  priority,
  quality,
  focal,
}: Props) {
  // 关系未 populate（纯 id）或为空时不渲染
  if (!media || typeof media === 'number') return null

  const sized = size ? media.sizes?.[size] : undefined
  const url = sized?.url ?? media.url
  if (!url) return null

  const width = sized?.width ?? media.width ?? undefined
  const height = sized?.height ?? media.height ?? undefined

  if (fill) {
    const focalPos =
      focal && (media.focalX != null || media.focalY != null)
        ? { objectPosition: `${media.focalX ?? 50}% ${media.focalY ?? 50}%` }
        : undefined
    return (
      <Image
        src={url}
        alt={media.alt}
        fill
        className={className ?? 'object-cover'}
        style={focalPos}
        sizes={sizes}
        priority={priority}
        quality={quality}
      />
    )
  }

  return (
    <Image
      src={url}
      alt={media.alt}
      width={width}
      height={height}
      className={className}
      sizes={sizes}
      priority={priority}
      quality={quality}
    />
  )
}

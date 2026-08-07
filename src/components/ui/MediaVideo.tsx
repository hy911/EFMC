import type { Media } from '@/payload-types'

type Props = {
  /** Payload 的 media 关联字段值（depth>=1 时是完整文档，否则是 id） */
  video: Media | number | null | undefined
  /** 封面帧：用同一节的图片，首屏就不会是一块黑 */
  poster?: Media | number | null
  className?: string
}

/**
 * Payload 媒体 → 原生 `<video>`。
 *
 * 只收 mp4（H.264/AAC），不引播放器库：一段几十秒的完工视频不值得为它加运行时依赖，
 * 浏览器自带的控件在移动端反而更顺手（全屏、画中画、倍速都是系统级的）。
 *
 * 两个刻意的默认值：
 * - `preload="metadata"` 只拉文件头（几 KB），用户不点播放就不会下载整个文件
 * - 不 autoplay —— B2B 案例页翻到一半突然出声是负体验
 */
export function MediaVideo({ video, poster, className }: Props) {
  // 关系未 populate（纯 id）或为空时不渲染
  if (!video || typeof video === 'number' || !video.url) return null

  const posterUrl =
    poster && typeof poster !== 'number' ? (poster.sizes?.feature?.url ?? poster.url) : null

  return (
    <video
      src={video.url}
      poster={posterUrl ?? undefined}
      controls
      playsInline
      preload="metadata"
      className={className ?? 'block h-auto w-full'}
      aria-label={video.alt}
    />
  )
}

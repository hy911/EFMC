/**
 * 最小 Lexical 节点构造器，供导入脚本拼装富文本正文。
 * payload-api.mjs 的 richTextOf 只能拼纯段落，长正文（标题/列表/引用/配图）用这里。
 *
 * 文本里的 **粗体** 会被解析为 format:1 的 text 节点。
 */

const BASE = { format: '', indent: 0, version: 1, direction: 'ltr' }

/** 解析 **粗体** 标记，返回 text 节点数组 */
function inline(text) {
  return text
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((part) => {
      const bold = part.startsWith('**') && part.endsWith('**')
      return {
        type: 'text',
        detail: 0,
        format: bold ? 1 : 0,
        mode: 'normal',
        style: '',
        text: bold ? part.slice(2, -2) : part,
        version: 1,
      }
    })
}

export const p = (text) => ({ ...BASE, type: 'paragraph', textFormat: 0, children: inline(text) })

export const h = (tag, text) => ({ ...BASE, type: 'heading', tag, children: inline(text) })

export const quote = (text) => ({ ...BASE, type: 'quote', children: inline(text) })

/** 无序/有序列表；items 为字符串数组 */
export const list = (items, ordered = false) => ({
  ...BASE,
  type: 'list',
  listType: ordered ? 'number' : 'bullet',
  tag: ordered ? 'ol' : 'ul',
  start: 1,
  children: items.map((text, i) => ({
    ...BASE,
    type: 'listitem',
    value: i + 1,
    children: inline(text),
  })),
})

/** 正文配图：mediaId 为已上传的 media id */
export const img = (mediaId) => ({
  type: 'upload',
  relationTo: 'media',
  value: mediaId,
  fields: null,
  format: '',
  version: 3,
})

export const hr = () => ({ type: 'horizontalrule', version: 1 })

export const doc = (children) => ({ root: { ...BASE, type: 'root', children } })

// Tailwind CSS v4 通过 PostCSS 插件接入（v4 不再需要 tailwind.config.js，
// 设计 token 统一在 globals.css 的 @theme 块中定义）
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}

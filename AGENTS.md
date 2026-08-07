# AGENTS.md

## 先读随包文档，别用训练数据里的 Next.js

本项目用的是 **Next.js 16（App Router）**。API、约定、文件结构跟大多数模型训练数据里的
Next 14 / 15 有实质差别，照着记忆写会写出跑不起来的代码。

版本匹配的完整文档就在仓库里，不用联网：

```
node_modules/next/dist/docs/
├── 01-app/
│   ├── 01-getting-started/
│   ├── 02-guides/
│   └── 03-api-reference/
├── 02-pages/
└── 03-architecture/
```

结构跟 nextjs.org/docs 一致。**动 Next 相关的代码之前先读对应那篇**，升级 next 时这份文档
也跟着升级。

### 本项目已经踩过的 Next 16 差异

这几处不是风格偏好，是踩出来的，改回旧写法会当场坏：

- **middleware 改叫 proxy**：`src/proxy.ts`，运行在 Node.js runtime。matcher 必须排除
  `api|admin|md|mcp|_next`，否则 Payload 后台和这些端点会被加上语言前缀而 404
- **`revalidatePath` 要从 `next/cache.js` 导入**（带扩展名）。next 包没有 exports map，
  裸子路径 `next/cache` 在纯 Node / tsx 环境（seed 脚本、Playwright 加载 payload 配置）
  解析不了
- **Tailwind v4 是 CSS-first**：没有 `tailwind.config`，设计 token 全在
  `src/app/(frontend)/globals.css` 的 `@theme` 块里
- **eslint 用 eslint-config-next 16 的原生 flat 导出**，退回 FlatCompat 写法会崩
- **`images.qualities` 要白名单声明**（Next 16 起），用了没声明的 quality 值会报错

## 项目本身的规则

代码风格、架构决策、部署约束、各种踩过的坑，全在 **[CLAUDE.md](CLAUDE.md)** —— 开工前读那份。
两份的分工：这里只讲「怎么查 Next.js 框架本身」，CLAUDE.md 讲「这个仓库怎么回事」。

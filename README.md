# yuxiangchen.dev

个人站源码。手写的 HTML、CSS、JavaScript，没有框架。首页是一座花园：每条笔记是一株植物。

推到 `main` 后由 GitHub Actions 构建并部署到 Cloudflare Pages（项目名 `yuxiangchen-dev`）。

| 文件 | 作用 |
| --- | --- |
| `notes/*.md` | 笔记，一个文件一条 |
| `src/text.mjs` | 网站上所有的文字（英文在 `/`，中文在 `/zh/`） |
| `src/home.html`、`src/note.html` | 首页和单篇笔记的模版 |
| `src/style.css` | 样式，颜色在最上面 |
| `src/plant.js` | 植物生成器：按笔记画出一株植物 |
| `src/garden.js` | 花园的交互：植物朝指针偏、显示说明 |
| `build.mjs` | 把上面这些拼成 `dist/` 下的网页 |

```bash
npm install
```

```bash
npm run dev
```

`npm run dev` 在 http://localhost:4321 预览，改文件后自动重建。`npm run demo` 会多生成一个 `/demo/` 页面，用示例笔记把花园种满，用来看长满后的样子；正式部署不包含它。

## 写一条笔记

在 `notes/` 下新建一个 `.md` 文件，文件名就是网址（`my-note.md` → `/notes/my-note/`）。文件名还决定植物长什么样，所以定了以后别改。开头写：

```md
---
title: 标题
summary: 一句话说明，显示在列表里
date: 2026-11-19
kind: making        # making 制作记录（会开花）；learning 学习笔记（只长叶）
stage: seed         # seed 芽；growing 带叶的茎；evergreen 树
lang: en            # en 或 zh
draft: false        # true 时不发布
---
```

改过旧笔记后加一行 `updated: 日期`。笔记越长，植物越高。

## 部署

需要仓库 Secrets：`CLOUDFLARE_API_TOKEN`（Pages: Edit 权限）和 `CLOUDFLARE_ACCOUNT_ID`。commit message 用纯英文，Cloudflare Pages API 不收非 ASCII（错误 8000111）。

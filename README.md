# yuxiangchen.dev

个人站源码。Astro 静态站，推到 `main` 后由 GitHub Actions 部署到 Cloudflare Pages（项目名 `yuxiangchen-dev`）。

| 路径 | 内容 |
| --- | --- |
| `/` | About：`src/pages/index.astro` |
| `/takeweave` | Takeweave 试听室：`src/pages/takeweave.astro` + `src/components/takeweave/` + `public/audio/takeweave/` |

```bash
npm install
npm run dev     # http://localhost:4321
npm run build   # 输出到 dist/
```

部署需要仓库 Secrets：`CLOUDFLARE_API_TOKEN`（Pages: Edit 权限）和 `CLOUDFLARE_ACCOUNT_ID`。commit message 用纯英文，Cloudflare Pages API 不收非 ASCII（错误 8000111）。

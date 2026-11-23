# yuxiangchen.dev

个人站源码。手写的 HTML、CSS、JavaScript，没有框架，没有构建步骤，没有依赖：`site/` 里的文件就是网站本身。

推到 `main` 后由 GitHub Actions 把 `site/` 原样发布到 Cloudflare Pages（项目名 `yuxiangchen-dev`）。

| 文件 | 作用 |
| --- | --- |
| `site/index.html` | 首页（英文） |
| `site/zh/index.html` | 首页（中文）。两个文件结构相同，改一处时另一处也要改 |
| `site/style.css` | 样式，颜色在最上面 |
| `site/play.js` | 首页的小游戏：假装自己是硬币，和真硬币比 |

本地预览：

```bash
python3 -m http.server 4321 --directory site
```

然后打开 http://localhost:4321。

## 部署

需要仓库 Secrets：`CLOUDFLARE_API_TOKEN`（Pages: Edit 权限）和 `CLOUDFLARE_ACCOUNT_ID`。commit message 用纯英文，Cloudflare Pages API 不收非 ASCII（错误 8000111）。

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

## 项目边界与旧入口

- 当前公开动画工程：[Niigata Mini Animations](https://github.com/gitcyx93/niigata-mini-animations)，与本站源码分开维护；首页项目入口指向这里。
- 早期新潟统计资料与看板：[Niigata Data Archive](https://github.com/gitcyx93/niigata-data-archive)，只读历史档案，不再作为“正在做”的动画项目。
- 按用户 2026-11-02 的决定，旧博客 `chen-blog` 已在试听室独立保留并验证后删除；哲学谱系、机器人和旧文章不再迁移。
- Takeweave 试听室现独立为 [takeweave-listening-room](https://github.com/gitcyx93/takeweave-listening-room)，包含页面、国际化和 15 段示例音频。本站现存 `/takeweave` 副本暂未移除，也不据此宣称新的线上域名已部署；此仓库和独立试听室都不是音频模型或 Mac 应用的完整源码。

2026-11-02 的入口整理不修改部署配置或音频；相关 PR 在审核合并前不会触发现有的 main 推送部署流程。历史部署失败应单独排查，不通过删配置来“清理”。

## 部署

部署需要仓库 Secrets：`CLOUDFLARE_API_TOKEN`（Pages: Edit 权限）和 `CLOUDFLARE_ACCOUNT_ID`。commit message 用纯英文，Cloudflare Pages API 不收非 ASCII（错误 8000111）。

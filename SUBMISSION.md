# 发布记录 · 歌曲评论 song-comments

## 当前状态（v1.0.3）

| 项 | 状态 |
|---|---|
| 已收录版本 | **1.0.2**（已提交上架） |
| 本次版本 | **1.0.3**：页签图标 |
| 代码 | `song-comments/client.mjs` · 82 项断言全绿 |
| 仓库 | <https://github.com/Zhangyx0824/folia-mod-song-comments> |
| 剩下的事 | 推 tag → 打开「模组更新」表单 → 打开上游「功能建议」 |

**两个点击动作的预填链接在 [`ISSUE-LINKS.md`](./ISSUE-LINKS.md)**，由 `test/build_issue_urls.mjs` 生成，改文案后重跑即可。

---

## 一、这次改了什么（写进更新说明的版本）

宿主 0.7.x 的 `playerPanelTabs` 不接受 `icon` 字段：注册项传了也会被丢掉，渲染层统一画 lucide `Puzzle`，
而且只有侧栏窄到放不下文字时才画图标——于是所有模组页签长得一模一样。

1.0.3 用官方 `styles` 注册表注入一条 CSS：

```css
[data-ponder-panel-tab-button*="song-comments"] svg{display:none}
[data-ponder-panel-tab-button*="song-comments"] > span:has(svg)::before{
  content:"";width:16px;height:16px;background-color:currentColor;
  mask-image:url("data:image/svg+xml,…message-circle…");mask-size:16px 16px;
}
```

- 选择器只命中本模组的页签按钮，**不碰**其他模组与宿主界面。
- `:has(svg)` 保证只在宿主真的画了图标（窄侧栏、未选中）时替换；标签模式完全不动。
- `currentColor` 让图标自动跟随常态 / 选中 / hover 颜色，不用写死颜色。
- 图标是内联 SVG mask，不增加文件、不发网络请求。

## 二、剩下的两步

### 1. 模组更新（folium-compound）

链接在 `ISSUE-LINKS.md` 第 2 节，字段：`mod-id=song-comments`、`ref=v1.0.3`、渠道保持不变、更新说明已写好。
**不要重开提交 issue**，已收录模组走 `mod-update.yml`。CI 会从登记的仓库取新版本、检查版本号必须比当前高，
然后给维护者一个与上个签名版本的 diff 链接。

### 2. 上游功能建议（folia-major）

链接在 `ISSUE-LINKS.md` 第 1 节。给宿主提 `playerPanelTabs` 支持 `icon`（lucide 图标名），
理由与代码位置、最小改动方案、向后兼容说明都写在 [`FEATURE-REQUEST.md`](./FEATURE-REQUEST.md) 里。
这条同时是给 `song-info`、`lyric-ai-director` 两个模组的解法——它们有签名、我改不了，只有宿主提供字段才可能区分图标。

---

## 三、审核可能追问的点（答案备好）

- **为什么需要 `platform.netease.read`？** 评论只能通过网易云接口读取；宿主没有为评论提供 typed API，
  `platform.raw` 是唯一正规入口，`comment_hot` / `comment_music` / `search` 三个端点都只要求 read。
- **为什么声明 `platform.raw` 实验项？** manifest 校验强制：声明 `platform.<id>.read` 必须同时声明它。
- **会不会写用户账号？** 不会。没申请 write，代码里没有任何写端点。
- **1.0.2 的说明写着「不注入全局样式」，1.0.3 却注入了？** 是，需要说明：走的是官方 `styles` 注册表
  （宿主包进 `@layer folium-mods`），选择器带 `[data-ponder-panel-tab-button*="song-comments"]`，
  只命中本模组页签按钮；不改宿主 DOM 结构，不影响其他模组，也不需要新权限。
- **`data-ponder-panel-tab-button` 是公开 API 吗？** 不是，是宿主引导系统用的属性。宿主改名后图标会退回拼图，
  面板功能不受影响；已提 feature request，等官方 `icon` 字段落地就删掉这段 CSS。
- **实验接口坏了会不会崩？** 不会。接口不存在 / 端点被拒 / 权限被拒 / 未登录 / 限流 / 网络失败各有文案与重试。

---

## 四、以后每次发版

```bash
# 1. 改代码 → 改 mod.json 的 version → 跑测试
NODE=~/.workbuddy/binaries/node/versions/22.22.2-6/bin/node
$NODE test/smoke.mjs

# 2. 同步到本机验收（--restart 顺便重启 Folia）
./sync.sh --restart

# 3. 提交 + 打 tag（CI 认 tag，不认 main 头）
git add -A && git commit -m "1.0.4: …"
git tag -a v1.0.4 -m "1.0.4"
git push origin main && git push origin v1.0.4

# 4. 重新生成更新表单链接
$NODE test/build_issue_urls.mjs
```

---

## 附：1.0.2 首发记录（已上架，留档）

- 远端仓库 Public，默认分支 `main`，tag `v1.0.2` → `944e64a`。
- 运行截图：`~/Desktop/folia-song-comments-截图.jpg`（Folia 0.7.23，正在播放 + 侧栏「评论」热门列表）。
  截图方式 `screencapture -l <窗口 id>` 整窗截取，未裁剪未后期。
- 表单各栏：模组 id `song-comments`、仓库 `https://github.com/Zhangyx0824/folia-mod-song-comments`、
  目录 `song-comments`、渠道「正式发布 / Release」、许可证 MIT。
- `song-comments/preview.jpg` 不能代替运行截图（那是渲染的介绍图，CI 只认 issue 里的上传附件）。

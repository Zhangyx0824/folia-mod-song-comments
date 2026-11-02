# 上架提交材料 · 歌曲评论 song-comments

## 一、基本信息

| 项 | 内容 |
|---|---|
| mod id | `song-comments` |
| 名称 | 歌曲评论（Song Comments） |
| 版本 | 1.0.0 |
| 作者 | pomepii |
| 仓库 | `https://github.com/Zhangyx0824/folia-mod-song-comments`（待建仓后 push，tag `v1.0.0`） |
| 宿主 | `folia: ">=0.7.21 <0.8.0"`，folium 1（minor 7） |
| 权限 | `platform.netease.read` |
| 实验项 | `platform.raw` |

## 二、提交到 folium-compound 的 issue 文案

标题：

```
[song-comments] 歌曲评论 — 播放页按钮打开侧栏「评论」页签，显示网易云音乐评论
```

正文：

````markdown
### 模组

- id：`song-comments`
- 名称：歌曲评论
- 版本：1.0.0
- 仓库：https://github.com/Zhangyx0824/folia-mod-song-comments
- 下载：仓库 `main` 分支，模组目录为 `song-comments/`

### 做什么

播放页进度条尾部加一个评论按钮，点开后播放器侧栏出现「评论」页签，显示当前歌曲在网易云音乐的评论：热门 / 最新两个视图、分页加载、长评折叠、点赞数与相对时间、回复引用。

来自网易云的曲目用 `sourceRef.mediaId` 精确查询；本地文件、QQ 音乐、Spotify 等没有网易云 ID 的曲目，按「歌名 + 歌手」检索一次并取最接近的曲目，面板顶部会标注这是匹配结果并可重新匹配。

### 用到的宿主接口

| 接口 | 用途 |
|---|---|
| `folium.registries.progressButtons` | 进度条尾部按钮（`slot: "progress.trailing"`，`hideWhenCollapsed`） |
| `folium.registries.playerPanelTabs` | 侧栏「评论」页签 |
| `folium.ui.openPlayerPanel` | 点按钮打开面板并切到本页签 |
| `folium.playback.getState` | 读当前曲目与 `sourceRef` |
| `folium.events.on("playback.songChanged")` | 切歌刷新 |
| `folium.experimental["platform.raw"].request` | `comment_hot` / `comment_music` / `search`（全部 read 权限） |
| `folium.registries.settingsSections` | 三个设置项 |

### 权限说明

- `platform.netease.read`：读取网易云评论与检索结果，使用用户在 Folia 中登录的网易云会话。
- `experimental: ["platform.raw"]`：按 `manifest.cjs` 的校验要求，声明平台直通权限时必须同时声明该实验项。
- **只读**：未申请 `platform.netease.write`，不点赞、不发评论、不关注、不写入任何账号数据。
- 「按歌名匹配」会在启用时把当前曲目的歌名与歌手名发给网易云；该开关可在设置中关闭，关闭后对所有非网易云曲目都不发起检索。

### 自测

- `node test/smoke.mjs`：jsdom 全绿（按钮注册与点击、页签挂载、请求参数与曲目 id、切歌重取、按歌名匹配、关闭匹配、权限报错文案、空列表文案、dispose 后不再请求）。
- 明暗两种主题用 Chromium 台架截图肉眼验收（`test/build_harness.mjs`）。
- 预览图由真实模组代码渲染（`test/build_preview.mjs`），非手绘。

### 已知限制（如实说明）

- 宿主未对 netease 之外的 provider 开放 `platform.raw`，因此 QQ 音乐 / 汽水 / 酷狗的评论无法直接获取，改为「按歌名匹配网易云同名曲目」。
- `platform.raw` 属实验性接口，宿主小版本可能调整行为；模组对「接口不存在 / 端点被拒 / 权限被拒」都做了文案降级与重试，不会崩溃。
````

## 三、提交前置动作（需要手动完成）

1. 在 GitHub 新建空仓库 `folia-mod-song-comments`（MCP 无建仓权限，403）。
2. `git init` → commit → `git tag v1.0.0` → push `main` + tag（SSH 正常）。
3. 打开 https://github.com/Zhangyx0824/folium-compound/issues 新建 issue，粘贴上面第二节的标题与正文。
4. 等 CI 打上 signed / verified 标签即上架。

## 四、审核可能追问的点（答案备好）

- **为什么需要 `platform.netease.read`？** 评论只能通过网易云开放接口读取，宿主没有为评论提供 typed API（`omni` 里没有评论相关成员）；`platform.raw` 是唯一的正规入口。
- **为什么声明 `platform.raw` 实验项？** manifest 校验强制：声明 `platform.<id>.read` 必须同时声明 `platform.raw`。
- **会不会写用户账号？** 不会，未申请 write 权限，代码里也没有任何写端点。
- **歌名匹配是否等于「猜」？** 只在标题归一化后相等或互相包含、且无人为拼凑歌手时才采用；顶部明示这是匹配结果，并给「重新匹配」；用户可整体关闭该行为。

# 歌曲评论 · Song Comments

Folia（Folium 1）模组：播放页进度条右侧多一个评论按钮，点开后播放器侧栏出现「评论」页签，显示当前这首歌在**网易云音乐**的评论。

![预览](song-comments/preview.jpg)

## 功能

- **进度条按钮 → 侧栏页签**：按钮排在进度条尾部（和「歌曲资料」等信息类按钮同区），点一下直接打开侧栏并切到「评论」。小窗（宽 < 600 或高 < 220）自动隐藏按钮，不挤占控件。
- **页签有自己的图标**：侧栏窄到只显示图标时，「评论」页签是对话气泡，不再是所有模组共用的拼图。宿主 0.7.x 的 `playerPanelTabs` 不接受 `icon` 字段（渲染层写死 lucide `Puzzle`），这里用官方 `styles` 注册表注入一条 CSS，用 `[data-ponder-panel-tab-button*="song-comments"]` 只命中自己那个按钮，把 svg 换成 16px 的 mask 图标（`currentColor`，跟随常态/选中/hover 颜色）。放得下文字时仍然是「评论」两个字，与其他页签一致。
- **热门 / 最新**：热门优先走 `comment_hot`（带 `type: 0` 指明是歌曲）；宿主返回结构不认、或者这个端点报错时，自动退到 `comment_music` 自带的 `hotComments`，再退一步按点赞数取前 N 条——所以热门不会空着。热门只有一屏，底部给「查看全部评论」跳到最新。
- **最新**：走 `comment_music` 分页，滚到底点「加载更多」。
- **段落**：昵称、相对时间、正文（超过 150 字折叠，可展开/收起）、点赞数、被回复内容（引用块）。
- **曲目匹配**：来自网易云的曲目直接用 `sourceRef.mediaId` 精确查询；本地文件 / QQ 音乐 / Spotify / 酷狗等没有网易云 ID 的曲目，按「歌名 + 歌手」检索一次，取标题与歌手最接近、时长合理的一首。面板顶部会写明「按歌名匹配到《…》」，并给一个「重新匹配」按钮。
- **状态区分**：没有播放中的歌曲、曲目没有网易云版本、这首没有热门评论、还没有人评论、权限被拒、账号未登录、请求过于频繁、网络失败——每种情况都是不同的文案，不是一句「加载失败」。
- **缓存**：同一首歌同一视图 10 分钟内不重复请求；切歌即失效。

## 设置

| 项 | 默认 | 说明 |
|---|---|---|
| 每页评论条数 | 20 | 5–50，点「加载更多」按此步长追加 |
| 非网易云曲目按歌名匹配 | 开 | 关闭后，没有网易云 ID 的曲目直接显示「没有网易云版本」，不发生任何检索请求 |
| 显示评论者头像 | 开 | 关闭后只显示昵称首字；头像加载失败也会退回首字 |

## 权限与隐私

```json
"permissions": ["platform.netease.read"],
"experimental": ["platform.raw"]
```

- 评论与检索都通过 Folium 的实验性 `platform.raw` 发起，走的是**你在 Folia 里登录的网易云账号会话**，因此启用时信任弹窗会说明「可读取你在网易云音乐上的数据」。
- **只读**：不点赞、不发表评论、不关注、不修改任何数据。写接口（`platform.netease.write`）没有申请。
- 开启「按歌名匹配」时，会把当前曲目的**歌名与歌手名**发给网易云用于检索；关闭后不发送。
- 查询结果只存在内存里，不落盘、不上传。
- 评论内容与头像版权归原作者与网易云音乐，本模组仅作展示。

## 安装

1. 把 `song-comments/` 整个目录放进 `~/Library/Application Support/Folia/mods/`（Windows：`%APPDATA%\Folia\mods\`）。
2. 重启 Folia，在「模组管理」里启用并确认权限（未签名模组会要求确认一次）。
3. 播放任意一首歌，点进度条右侧的评论图标，或直接在侧栏切到「评论」页签。

## 已知限制

- **QQ 音乐、汽水、酷狗的评论拿不到，而且不是「换个接口」的事。** 两条路都堵死：
  - 宿主侧：`platform.raw` 只认 `platform.netease.read/write` 这一组权限，内部端点表（`comment_music` / `comment_hot` / `search` …）也只挂在 NetEase 上。`request('qq', …)` 会在 `describeRawEndpoint` 那一步返回 `unsupported`，连权限都没走到。
  - 自己抓：`folium.net.fetch` 由主进程用 Node 的 fetch 发出，**没有域名白名单**，技术上能打任意 https。但实测（2026-11-26，大陆家宽直连）三家都拿不到：QQ `musicu.fcg` 的 `music.globalComment.CommentRead` 只回 `code 10000` + 空列表（评论读取要登录态 cookie），老的 `fcg_global_comment_hot` 已 404；酷狗 `mobiles.kugou.com/api/v3/comment/list` 直接 `Access Deny !!!`（要签名的 `code` + cookie）；汽水没有公开接口，参数要 `a_bogus` 签名。Spotify / YouTube Music 本身就没有「歌曲评论」这个功能。
  - 结论：要真做多平台评论区，得让用户把自己的登录 cookie 交给模组、再逐平台实现签名算法——维护成本无底洞，且不该出现在一个只读展示的模组里。所以这些曲目的评论走「按歌名 + 歌手匹配网易云同名曲目」，匹配不到就在面板里说清楚是哪个平台的曲目。
- **兼容范围：Folia 0.7.21 及以上，含 0.8.0。** 0.8.0（模组 API 1.10）把公开的 song DTO 砍成 `{id, title, artist, album, source, ref}`：`artist` / `album` 变成字符串、没有 `durationMs` / `coverUrl` / `artists[]`、`sourceRef` 换成 `source`。本模组两种形态都认——0.7 走 `sourceRef.mediaId`，0.8 走 `source === 'netease'` 时的 `id`（宿主 `oe()` 里就是 `String(e.id)`，即平台原生曲目 id），并且只接受纯数字 id，不是就走歌名检索，绝不会把 QQ 的曲目号当网易云 id 发出去。
- `platform.raw` 是**实验性**接口，宿主小版本更新可能改行为。所以：拿不到接口时不报错崩溃，而是在面板里显示「宿主没有开放这个网易云接口」并给重试按钮。
- 面板是标准的播放器侧栏页签，不是浮层——宿主决定宽度与主题，模组只负责内容。
- **页签图标依赖一个非公开属性。** `data-ponder-panel-tab-button` 是宿主引导系统用的，不属于公开 API。宿主改名后图标会退回拼图（面板功能不受影响）。已经向 `chthollyphile/folia-major` 提了 feature request（`FEATURE-REQUEST.md`），等 `playerPanelTabs` 支持 `icon` 字段就改回官方用法并删掉这段 CSS。
- **面板高度只用宿主的 `--pn-tab-room` 上限，绝不自己钉高度。** 宿主的页签容器只保证宽度（`fill: false`），而且**外层容器的高度是从模组这里量出去的**：`ResizeObserver` 量内容区高度 → 写回折叠容器的 `height`。所以「量容器剩下多少、再把根节点钉成那个 px」是个回环——一旦某次量到的是矮内容（例如非网易云曲目只有一行提示），高度就永久锁死在那一档，切到有评论的曲目也长不回来。现在的做法：`max-height: calc(var(--pn-tab-room) - 12px)`，内容矮就自然矮、内容高就撑到上限后列表内部滚动；宿主没有这个变量时不设上限，交给宿主的滚动容器。

## 更新日志

**1.1.1**
- 修：**面板高度会卡在上一首曲目那一档**。现象：当前曲目不是网易云的时候点评论，高度只够显示一行提示；接着点下一曲，即使这首在网易云有评论，高度也不变，评论显示不全。
- 根因不是「量错了」，而是**量的是自己撑出来的空间**：宿主把页签内容的高度用 `ResizeObserver` 量回去当外层折叠容器（`st-t-unfold`）的 `height`，而 1.0.1 的 `fitHeight()` 又用「容器底 − 我的顶」当可用高度、把根节点钉成 px。矮内容（非网易云曲目只有一行状态文案）量出一个矮容器，下次再量还是那么矮——回环锁死，`高度变大 < 40px 就忽略` 的阈值又刚好把它按住。
- 现在只单向给上限：`max-height: calc(var(--pn-tab-room) - 12px)`（`--pn-tab-room` 是宿主下发的页签可用高度，它自己的队列页签也用这个值；自定义属性会继承进 shadow root）。内容矮就自然矮，内容高就撑到上限后内部滚动，不再读取任何由自身高度决定的尺寸。宿主没有这个变量时（老版本）不设上限，让宿主滚动容器接管——宁可整块面板滚，也不锁死。
- 新增：`test/probe_grow.mjs`，按真实面板外壳（底边锚定 + `max-height` + 内容高度回写外层容器 + shadow root）复现「矮内容 → 切歌 → 高度不涨」，并覆盖「无宿主变量」「变量是嵌套 `calc`」两条边界。原 `test/probe_scroll.mjs`（定高滚动容器）仍然通过。
- 测试：jsdom 102 项不变；Chromium 布局探针 6 + 10 项。
- 商店预览图换成真机运行截图（Folia 0.8.0 播放页 + 侧栏评论，1280×720），替掉之前的渲染稿。

**1.1.0**
- 适配 **Folia 0.8.0**（模组 API 1.10）。`mod.json` 的 `folia` 从 `">=0.7.21 <0.8.0"` 改成 `">=0.7.21"`——原来那个上界会让模组在 0.8.0 上**装了但不加载**，而且不一定有显眼报错。
- 0.8.0 的 song DTO 换成 `{id, title, artist, album, source, ref}`（`artist`/`album` 变字符串、`sourceRef` 消失）。新增 `songSourceOf` / `songArtistOf` / `songAlbumOf` 三个归一化函数，两种 DTO 形态都能读；精确命中改用 `source === 'netease'` 时的 `id`，并只认纯数字（别的平台的曲目号绝不会发到网易云接口）。
- 面板状态文案分清两种情况：匹配开关关着 → 「…是关着的，不会去网易云找版本」；开了但没匹配到 → 「在网易云没找到《X》的对应版本（当前是 QQ 音乐的曲目）」。之前两种情况共用一句话，会误导。
- 启动打一行 `ready (Folia 0.8.0 / mod API 1.10)`，每次解析曲目再打一行 `resolve "标题" source=… dtoId=… neteaseId=… via=…`。宿主再改 DTO 形态时，看这行就知道取到了什么。
- 测试：82 → 102 项，新增 0.8.0 DTO 三组场景（NetEase 精确命中 / QQ 曲目走检索且不串号 / 非数字 id 退回检索）、`folia` 上界回归断言、平台名文案断言。

**1.0.3**
- 新增：「评论」页签有自己的图标（对话气泡）。宿主 0.7.x 的 `playerPanelTabs` 会丢掉 `icon` 字段，所以走官方 `styles` 注册表注入一条作用域限死在自己页签按钮上的 CSS：隐藏宿主画的拼图 svg，用 `mask-image` + `background-color: currentColor` 画 16px 气泡。只影响本模组页签，不碰别的模组、不改宿主 DOM、不需要新权限。
- 新增：`test/build_tabicon_harness.mjs`，把宿主的页签按钮结构（`button > span > svg`）连同真实 CSS 一起渲染出来，核对图标尺寸/对齐/选中态。
- 测试：67 → 82 项。

**1.0.2**
- 修：设置页显示成 `pageSize` / `matchBySearch`、组标题显示 `song-comments:settings`。宿主 schema 解析只保留**对象形式**的文案（`label: s.label && typeof s.label === 'object' ? s.label : {}`），传字符串会被静默丢掉并退回原始 key。现在 label / description 一律写成 `{ 'zh-CN': …, en: … }`，并加了断言防回归。

**1.0.1**
- 修：热门页签为空／报错。`comment_hot` 现在带 `type: 0`，并加了 `comment_music.hotComments` → 按点赞排序 两级降级。
- 修：面板不能下滑。不再依赖 `height: 100%`（在 `fill: false` 的容器里会解析成一个偏大的值，导致内容不溢出、内部不滚动、多出来的部分被外层裁掉），改为测量外层滚动容器后钉高。
- 新增：热门底部「查看全部评论」，一键跳到最新。
- 新增：`test/probe_scroll.mjs`，用真实面板容器结构（含 shadow root）在 Chromium 里断言列表确实可滚。

**1.0.0** 首发。

## 开发

```
song-comments/     模组本体（mod.json / client.mjs / preview.jpg / LICENSE）
test/smoke.mjs     jsdom 冒烟测试：按钮、页签、请求参数、热门降级、切歌、dispose
test/probe_scroll.mjs    真 Chrome 里的滚动探针：定高滚动容器下断言列表可滚
test/probe_grow.mjs      真 Chrome 里的高度探针：矮内容 → 切歌后高度要能长回来
test/build_harness.mjs   浏览器台架（明暗两版）用于肉眼验收
test/build_preview.mjs   用真实模组代码渲染商店预览图
test/build_tabicon_harness.mjs  复刻宿主页签按钮结构，核对图标尺寸/对齐/选中态
test/build_submit_url.mjs 生成 folium-compound「模组提交」表单的预填链接
test/build_issue_urls.mjs 生成「功能建议」与「模组更新」两个 issue 的预填链接
sync.sh            同步到本机 Folia 并重写授权摘要（--restart 顺便重启）
```

```bash
NODE=~/.workbuddy/binaries/node/versions/22.22.2-6/bin/node
$NODE test/smoke.mjs            # 全绿即通过
./sync.sh                       # 同步，重启 Folia 生效
./sync.sh --restart             # 同步并重启
```

`song-comments/preview.jpg` 是**真机截图**：Folia 0.8.0 播放页 + 右侧「评论」页签，原始 1920×960，
上下补同色背景成 16:9 后缩到 1280×720（模组市场按 16:9 裁切卡片顶部，比例不对会切掉面板右侧）。

需要重新生成渲染稿时，`test/build_preview.mjs` 仍可用：它把 `client.mjs` 内联进一个模拟播放页，
用真实面板标记截图，所以渲染稿与运行时长得一样。

```bash
$NODE test/build_preview.mjs
"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" --headless=old --no-sandbox \
  --disable-gpu --hide-scrollbars --screenshot=/tmp/preview.png --window-size=1280,680 \
  --virtual-time-budget=2500 "file://$PWD/test/preview.html"
sips -s format jpeg -s formatOptions 88 /tmp/preview.png --out song-comments/preview.jpg
```

## 许可

MIT

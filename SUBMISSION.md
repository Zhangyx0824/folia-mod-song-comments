# 发布记录 · 歌曲评论 song-comments

## 当前状态（v1.2.0）

| 项 | 状态 |
|---|---|
| 已收录版本 | **1.0.2**（已上架） |
| 本次版本 | **1.2.0**：评论里的表情显示成 `[名字]` → 换成系统 emoji |
| 上一个版本 | 1.1.1 修「面板高度卡在上一首那一档」 + 预览图换真机截图，已提交更新 issue **#208** |
| 代码 | `song-comments/client.mjs` · **112 项断言全绿** + 2 个 Chromium 布局探针（6 + 10 项） |
| 真机验证 | Folia **0.8.0**（模组 API 1.10），已同步 + 重新授权，digest 一致 |
| 仓库 | <https://github.com/Zhangyx0824/folia-mod-song-comments> |
| 剩下的事 | 为 1.2.0 再开一个更新 issue（链接由 `test/build_issue_urls.mjs` 生成）→ 维护者审查 → `/sign` |

---

## 一、这次改了什么

### 1. `folia` 上界必须去掉（否则根本不会加载）

```diff
- "folia": ">=0.7.21 <0.8.0"
+ "folia": ">=0.7.21"
```

宿主 `parseHostRange` 的规则是「空格分隔的比较器全部满足才算通过」，所以 0.8.0 被 `<0.8.0` 挡掉，
模组表现为**装了但完全不生效，也没有显眼报错**。改成只有下界后，0.7.21+ 与 0.8.0 都能加载。

### 2. 0.8.0 把公开 song DTO 砍了

真机 dump（2026-11-26，Folia 0.8.0 / API 1.10）：

```js
folium.playback.getState().song
// { id: "121597355", title: "非正式主题曲", artist: "非正式会谈成员",
//   album: "", source: "qq", ref: "song-y" }
```

宿主渲染层的构造函数（`dist/assets` 里）：

```js
oe = e => e ? {
  id:     e.id == null ? null : String(e.id),          // 平台原生曲目 id
  title:  e.name ?? '',
  artist: (e.artists ?? []).map(a => a?.name).filter(Boolean).join(' / '),
  album:  e.album?.name ?? null,
  source: D(e),                                        // online ? providerId : kind
  ref:    ie(e),                                       // song-<base36> 队列令牌
} : null
```

对照 0.7.x：

| 字段 | 0.7.x | 0.8.0 |
|---|---|---|
| 歌手 | `artists[{name}]` 或 `artist` | `artist` 字符串（已拼好 `A / B`） |
| 专辑 | `album` 字符串或 `{name}` | `album` 字符串（可能是 `""`） |
| 时长 / 封面 | `duration` / `coverUrl` | **没有**（评论面板不需要） |
| 音源 | `sourceRef{providerId, mediaId}` | `source` + `ref`（`ref` 是队列令牌，不是曲目 id） |

因此新增三个归一化函数 + 重写 `rawIdOf`：

```js
const songSourceOf = (song) =>
  song?.sourceRef?.providerId ? String(song.sourceRef.providerId)
  : typeof song?.source === 'string' ? song.source : '';

const rawIdOf = (song) => {
  const ref = song?.sourceRef;                                   // 0.7
  if (ref?.providerId === 'netease' && ref.mediaId) return String(ref.mediaId);
  if (typeof song?.source === 'string') {                        // 0.8
    if (song.source !== 'netease') return null;
    const id = song.id == null ? '' : String(song.id);
    return /^\d+$/.test(id) ? id : null;                         // 只认纯数字
  }
  return null;
};
```

那个 `/^\d+$/` 不是多余的：0.8 的 `id` 是**当前平台**的曲目号，
QQ 曲目拿到的就是 QQ 的 `121597355`。少了这道闸，QQ 曲目会被当成网易云 id 去请求评论，拿到别人的评论区。

### 3. 文案分清了「开关关着」和「真的没有」

之前两种情况共用一句「这首曲目没有网易云版本，可在设置里重新启用…」，匹配开关明明开着的时候说这句是误导。
现在：开关关着 → 明说开关关着；开着但没匹配到 → 「在网易云没找到《X》的对应版本（当前是 QQ 音乐的曲目）」。

### 4. 诊断日志

启动打一行 `ready (Folia 0.8.0 / mod API 1.10)`；每次解析曲目打一行

```
resolve "非正式主题曲" source=qq dtoId=121597355 neteaseId=- via=none
```

宿主下次再改 DTO 形态，看这一行就知道取到了什么，不用重新逆向。

---

## 二、为什么不做「多平台评论区切换」

用户提过：网易云版权不够，能不能切到 QQ / 酷狗 / 汽水的评论区。结论是**做不了**，两条路都堵死：

**宿主侧**：`platform.raw` 的权限表只有 `platform.netease.read` / `platform.netease.write`，
端点表（`comment_music` / `comment_hot` / `search` …）也只挂在 NetEase 上。
调用 `request('qq', …)` 会在 `describeRawEndpoint(provider, endpoint)` 返回 null 时抛 `unsupported`，
连权限检查都走不到——换个 providerId 是死路。

**自己抓**：`folium.net.fetch` 由主进程用 Node 的 fetch 发出，读代码确认**没有域名白名单**
（只限 http(s)、5 MB、15–60 s）。所以技术上能打任意站点。但 2026-11-26 在大陆家宽实测三家全堵：

| 平台 | 接口 | 结果 |
|---|---|---|
| QQ 音乐 | `u.y.qq.com/cgi-bin/musicu.fcg` · `music.globalComment.CommentRead` | `req.code 10000`，`CommentList.Total = 0`（评论读取要登录态 cookie） |
| QQ 音乐 | 老 `c.y.qq.com/base/fcgi-bin/fcg_global_comment_hot` | `404`，接口已下线 |
| 酷狗 | `mobiles.kugou.com/api/v3/comment/list` | `Access Deny !!!`（要签名的 `code` + cookie） |
| 汽水 / 抖音 | — | 无公开接口，参数要 `a_bogus` 签名 |
| Spotify / YT Music | — | 产品本身没有「歌曲评论」 |

要真做，就得让用户把自己的登录 cookie 交给模组、再逐平台实现签名算法——维护成本无底洞，
也不该出现在一个只读展示的模组里。所以保留现在的做法：非网易云曲目按「歌名 + 歌手」匹配网易云同名曲目，
匹配不到就在面板里说清楚这是哪个平台的曲目。

---

## 三、提交与剩下的步骤

### 1. 模组更新（folium-compound）· 已提交 #208

<https://github.com/chthollyphile/folium-compound/issues/208>

表单字段：模组 id `song-comments`、版本 `v1.1.1`、渠道「保持不变」、分类「保持不变」、确认项已勾。
标签 `mod-update` 由模板自动带上，CI（`submission-check.yml`）会从登记的仓库取 tag、拉取那一个 commit，
核对版本号必须比当前签名版本（1.0.2）高，并给出与 1.0.2 的对比链接。
**不要重开提交 issue**；后续版本继续开新的更新 issue 即可。

### 2. 上游功能建议（folia-major，可选）

`playerPanelTabs` 支持 `icon` 字段。1.0.3 起本模组自己打了 CSS 补丁，这条主要是替 `song-info`、
`lyric-ai-director` 两个有签名的模组要的。内容在 `FEATURE-REQUEST.md`。

---

## 四、审核可能追问的点（答案备好）

- **为什么需要 `platform.netease.read`？** 评论只能通过网易云接口读取；宿主没有为评论提供 typed API，
  `platform.raw` 是唯一正规入口，`comment_hot` / `comment_music` / `search` 三个端点都只要求 read。
- **为什么声明 `platform.raw` 实验项？** manifest 校验强制：声明 `platform.<id>.read` 必须同时声明它。
- **会不会写用户账号？** 不会。没申请 write，代码里没有任何写端点。
- **为什么只有网易云？** 见第二节。宿主只开放了网易云这一个 provider 的直通权限，其余平台也没有可用的公开接口。
- **`folia` 范围为什么改成只有下界？** 原来的 `<0.8.0` 会让模组在 0.8.0 上静默不加载；代码已经同时兼容两种 DTO。
- **0.8.0 上怎么保证不串号？** `rawIdOf` 只接受 `source === 'netease'` 且 id 为纯数字的情况；
  其他平台的曲目一律走歌名检索，不会把别家的曲目号发给网易云。
- **`data-ponder-panel-tab-button` 是公开 API 吗？** 不是，是宿主引导系统用的属性（0.8.0 仍在用，已核）。
  宿主改名后图标会退回拼图，面板功能不受影响。
- **实验接口坏了会不会崩？** 不会。接口不存在 / 端点被拒 / 权限被拒 / 未登录 / 限流 / 网络失败各有文案与重试。

---

## 五、以后每次发版

```bash
# 1. 改代码 → 改 mod.json 的 version → 跑测试
NODE=~/.workbuddy/binaries/node/versions/22.22.2-6/bin/node
$NODE test/smoke.mjs

# 2. 同步到本机验收。⚠ 必须让 Folia 完全退出后再 sync，否则旧 digest 会被写回去
osascript -e 'tell application "Folia" to quit'; sleep 3
pgrep -x Folia >/dev/null && pkill -TERM -x Folia; sleep 2
./sync.sh
open -a Folia

# 3. 提交 + 打 tag（CI 认 tag，不认 main 头）
git add -A && git commit -m "1.1.1: …"
git tag -a v1.1.1 -m "1.1.1"
git push origin main && git push origin v1.1.1

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

---

## 四、1.1.1 修了什么（审核可能会问）

**现象**：当前曲目不是网易云的时候点评论，面板高度只够一行提示；点下一曲（这首在网易云有评论），高度不变，评论显示不全，且来回切歌都保持那个高度。

**根因**：宿主把页签内容的高度用 `ResizeObserver` 量回去，当外层折叠容器（`st-t-unfold`）的 `height`。1.0.1 的 `fitHeight()` 又用「该容器底 − 自己的顶」算可用高度并把根节点钉成 px——**量的是自己撑出来的空间**，矮内容量出矮容器，下次再量还是那么矮，回环锁死；`高度变大 < 40px 就忽略` 的阈值又刚好把它按住不涨。

**修法**：只单向给上限，不再读任何由自身高度决定的尺寸。`max-height: calc(var(--pn-tab-room) - 12px)`，其中 `--pn-tab-room` 是宿主下发的「页签可用高度」（宿主自己的队列页签也用这个值算高度，自定义属性会继承进 shadow root）。内容矮 → 自然矮；内容高 → 撑到上限后列表内部滚动。宿主没有这个变量时不设上限，交给宿主滚动容器，绝不锁死。

**没有新增权限、没有改数据请求**：只改了布局。验证方式：`test/probe_grow.mjs` 按真实面板外壳（底边锚定 + `max-height` + 内容高度回写 + shadow root）复现了原 bug，覆盖「矮内容 → 切歌 → 高度要长回来 / 切回去要缩回来 / 无宿主变量 / 变量是嵌套 calc」。

---

## 六、商店预览图（1.1.1 换的这张）

`mod.json` 的 `preview` 指向 `song-comments/preview.jpg`，模组市场把卡片顶部裁成 16:9
（`.preview img{object-fit:cover}`），收录检查要求 PNG / JPG / WebP、≥640×360、≤1 MB、宽高比 1.5–2.0。

这次换成 Folia 0.8.0 真机截图（播放页 + 右侧「评论」页签），原始 1920×960 是 2:1，直接提交会被
`object-fit:cover` 左右各切掉约 5.5%——右侧评论面板正好在那一刀里。所以按 16:9 处理：

1. 去掉截图最外 2px（窗口圆角和一道浅色描边）；
2. 上下各补 61px 背景色（取内侧边缘行平均 RGB `19,18,14`），**不裁左右**，面板完整；
3. 缩到 1280×720，JPEG q92，约 137 KB。

`test/build_preview.mjs` 的渲染稿路径保留作备用（改了面板结构又来不及真机截图时用）。

---

## 七、1.2.0：评论表情（审核可能会问）

**现象**：评论区里本该是表情的地方，显示成一串 `[大笑]`、`[哭哭]`、`[认可]`。

**原因**：网易云在接口里就把表情存成这种方括号标记，只有它自己的客户端和网页端会替换成图，模组之前是原样输出的。

**为什么不用网易云那张图**：
- 官方资源是 `s1.music.126.net/style/web2/emt/emoji_<id>.png`，**21×21 的位图**，在高分屏上会糊；
- 这套资源是网页版时代的，挂在老 CDN 上，随时可能失效；
- 一屏评论要额外拉几十张图，面板打开会明显变慢。

**做法**：换成系统 emoji（矢量、随系统主题、零额外请求）。名字表 100 条：
- 59 条来自网页端 `core.js` 里那张官方 id 表（`{"大笑":"86","爱心":"33",…}`，也就是 `emoji_<id>.png` 的编号表），按编号语义给出字形；
- 其余是新版云村表情（`[哭哭]`、`[装可爱]`、`[认可]`…），官方 id 表里没有，按名字语义补。

**兜底原则**：表里查不到的名字**原样保留**（`[神秘表情]` 还是 `[神秘表情]`）。不猜、不删——配一个错的表情比露出标记更糟。想补名字只需在 `client.mjs` 的 `EMOJI_MAP` 里加一行。

**没有新增权限、没有新增请求**：仍然只用 `platform.netease.read` + `experimental platform.raw`，表情替换是纯前端字符串处理。

**验证**：jsdom 102 → 112 项（表情替换、同一行多个表情、未收录兜底、`<script>` 仍按文本转义）；另外抓了 160 条真实评论统计表情标记，命中率 100%。「展开 / 收起」的阈值改成按看得见的字数算，几个表情不会把短评论误判成长评论。

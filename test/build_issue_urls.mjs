// Builds the two GitHub links that are left for a human to click:
//   1. feature request to the host (folia-major)  — markdown template, so title + body
//   2. mod update for an already-listed mod (folium-compound) — issue form, so field ids
//
//   node test/build_issue_urls.mjs
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../song-comments/mod.json'), 'utf8'));

const q = (value) => encodeURIComponent(value).replace(/%20/g, '%20');
const REPO = 'https://github.com/Zhangyx0824/folia-mod-song-comments';

/* ----------------------------------------------------------- 1. 功能建议 */

const featureBody = `**需求描述**

\`folium.registries.playerPanelTabs.register()\` 注册的模组页签**没法自定义图标**：宿主在渲染层统一填 lucide 的 \`Puzzle\`（内置页签如封面/队列/歌词各有各的图标）。侧栏窄到放不下文字时，宿主的降级策略是「未选中的页签只显示图标」，于是所有模组页签显示为完全相同的拼图，只靠 hover tooltip 区分。装两个以上页签类模组就没法辨认了。

现有受影响的社区模组（作者各不相同，都改不了宿主）：\`song-info\`（歌曲资料）、\`lyric-ai-director\`（AI 歌词）、\`song-comments\`（评论）。

**建议方案**

注册项新增可选字段 \`icon\`，取值为 lucide 图标名：

\`\`\`js
folium.registries.playerPanelTabs.register({
  id: 'song-comments',
  label: { 'zh-CN': '评论', en: 'Comments' },
  icon: 'message-circle',   // ← 新增，可选
  order: 120,
  mount,
});
\`\`\`

宿主已经有 1600+ 个 lucide 图标和 \`dynamicIconImports\`，渲染处一行就能接上：

\`\`\`js
nt.forEach((e) => rt.push({ id: e.id, label: e.label, icon: resolveIcon(e.icon) ?? E }));
\`\`\`

- 向后兼容：没传 \`icon\` 就保持现在的拼图，已有模组不用改。
- 不新增权限，纯渲染。
- 传了不认识的图标名时静默回退到 \`Puzzle\`，别抛错、别让页签消失。

**可替代方案**

1. 模组自己注入 CSS 覆盖（例如 \`styles\` 注册表 + \`[data-ponder-panel-tab-button*="<modId>"]\`，把宿主画的 svg 换成自己的 mask 图标）。我现在就在 \`song-comments\` 里这么干，但 \`data-ponder-panel-tab-button\` 是内部属性，不属于公开 API，宿主改名就断；而且只能改自己的页签，救不了别人的模组。
2. 宿主内置 mod id → 图标映射表：不可维护。

**定位到的代码（0.7.23）**

\`\`\`js
// dist/assets/service-*.js —— 注册项转页签列表时只取 id / label
lt = () => [...t].sort(...).map((t) => ({ id: ct(t.id), label: f(t.def.label, e.language, t.name) }));

// 注册校验只检查 mount，所以传 icon 不会报错，但会被丢掉
N = m('playerPanelTabs', { validate: (e) => { if (typeof e.mount !== 'function') throw Error(...); return e; } });

// dist/assets/bootstrap-*.js —— 模组页签统一 icon: E（lucide Puzzle）
nt.forEach((e) => rt.push({ id: e.id, label: e.label, icon: E }));
\`\`\`

**环境**：Folia 0.7.23 / macOS。复现：装两个以上带侧栏页签的模组，把侧栏拖窄到只显示图标。`;

// 「功能建议」是 markdown 模板（不是 issue form）：模板内容会和 body 参数打架，
// 所以不带 template=，直接把 title/body 塞进去，标签用 labels= 补上。
const featureUrl =
  'https://github.com/chthollyphile/folia-major/issues/new' +
  '?labels=' + encodeURIComponent('enhancement') +
  '&title=' + q('[FEATURE] playerPanelTabs 支持自定义页签图标，现在所有模组页签都是同一个拼图') +
  '&body=' + q(featureBody);

/* ------------------------------------------------------------- 2. 模组更新 */

const changes = `1.2.0 · 评论里的表情不再显示成 [名字]

【现象】评论区里本该是表情的地方，显示成一串 [大笑]、[哭哭]、[认可]。

【原因】网易云在接口里就把表情存成这种方括号标记，只有它自己的客户端和网页端会替换成图，模组之前是原样输出的。

【为什么不用官方那张图】官方资源是 s1.music.126.net/style/web2/emt/emoji_<id>.png，21×21 的位图，高分屏上会糊；这套资源属于网页版时代，挂在老 CDN 上随时可能失效；一屏评论还要额外拉几十张图。所以换成系统 emoji：矢量、随系统主题、零额外请求。

【怎么对应】名字表 100 条。59 条来自网页端 core.js 里那张官方 id 表（{"大笑":"86","爱心":"33",…}，也就是 emoji_<id>.png 的编号表），按编号语义给字形；其余是新版云村表情（[哭哭]、[装可爱]、[认可]…），官方表里没有，按名字语义补。表里查不到的名字原样保留，不猜也不删——配一个错的表情比露出标记更糟。想补名字在 EMOJI_MAP 里加一行就行。

【其他】"展开 / 收起"的 150 字阈值改成按看得见的字数算，几个表情不会把短评论误判成长评论。没有新增权限、没有新增请求，仍是只读的 platform.netease.read + experimental platform.raw。

【验证】jsdom 102 → 112 项（表情替换、同行多个表情、未收录兜底、<script> 仍按文本转义）；另抓 160 条真实评论统计表情标记，命中率 100%。

---

1.1.1 · 修「面板高度卡在上一首那一档」；商店预览图换成真机运行截图

【预览图】之前那张是渲染稿；这次换成 Folia 0.8.0 真机截图（播放页 + 右侧「评论」页签）。原图 1920×960，按模组市场卡片 16:9 的裁切比例，上下补同色背景成 16:9 后缩到 1280×720，没有左右裁切，右侧评论面板完整。

【现象】当前曲目不是网易云的时候点评论，面板高度只够显示一行提示；接着点下一曲（这首在网易云有评论），高度不变，评论显示不全，之后来回切歌都保持那个高度。

【根因】宿主把页签内容的高度用 ResizeObserver 量回去，当外层折叠容器的 height；而 1.0.1 修"滑不动"时是拿"该容器底 − 自己的顶"算可用高度、再把根节点钉成 px。等于量的是自己撑出来的空间：矮内容量出矮容器，下次再量还是那么矮，回环锁死。

【修法】只单向给上限，不再读任何由自身高度决定的尺寸：max-height 取宿主下发的页签可用高度 --pn-tab-room（宿主自己的队列页签也用这个值）减 12px。内容矮就自然矮，内容高就撑到上限后列表内部滚动；宿主没有这个变量时不设上限，交给宿主的滚动容器，绝不锁死。只改布局，权限与数据请求都没动。

1.1.0 · 适配 Folia 0.8.0

【兼容】Folia 0.8.0（模组 API 1.10）把公开的歌曲数据砍成了 { id, title, artist, album, source, ref }：歌手与专辑变成字符串、sourceRef 消失、时长与封面不再提供。本版本同时兼容 0.7.x 与 0.8.0，两个形态都能读；mod.json 的 folia 范围从 ">=0.7.21 <0.8.0" 改成 ">=0.7.21"，原来那个上界会让模组在 0.8.0 上静默不加载。

【精确匹配】0.8.0 下网易云曲目改用 source === 'netease' 时的 id（宿主里就是 String(e.id)，即平台原生曲目 id）。这里加了纯数字校验：0.8 的 id 是"当前平台"的曲目号，QQ 曲目拿到的是 QQ 号码，绝不能当成网易云 id 去请求评论，否则会显示别人的评论区。

【文案】之前"匹配开关关着"和"真的没匹配到"共用一句话，会误导。现在分开说：开关关着就明说开关关着；开着但没匹配到就说"在网易云没找到《X》的对应版本（当前是 QQ 音乐的曲目）"。

【页签图标（1.0.3 起）】侧栏的"评论"页签显示对话气泡图标，不再是所有模组共用的拼图。宿主不接受 playerPanelTabs 的 icon 字段，所以用官方 styles 注册表注入一条 CSS，选择器只命中本模组页签按钮，把宿主画的 svg 换成 16px 的 mask 图标（currentColor，跟随常态/选中/hover）。不碰其他模组、不改宿主 DOM、不需要新权限。

【说明】1.0.2 的说明写着"不注入全局样式"，这条需要修正：之后确实通过官方 styles 注册表注入了一条 CSS（宿主会包进 @layer folium-mods），作用域限死在本模组页签。权限未变，仍是 platform.netease.read（只读）+ experimental platform.raw。

【未做】没有实现多平台评论区切换。宿主只对模组开放了网易云一个平台的直通权限；自己调其他平台接口也走不通（QQ 评论读取要登录 cookie、老接口已 404，酷狗返回 Access Deny，汽水要签名，Spotify 与 YouTube Music 本身没有歌曲评论）。非网易云曲目继续按"歌名 + 歌手"匹配网易云同名曲目。

【其他】测试从 82 项加到 102 项，新增 0.8.0 歌曲数据的三种场景（网易云精确命中 / QQ 曲目走检索且不串号 / 非数字 id 退回检索）、folia 范围回归断言、平台名文案断言。`;

// 正文走文件，不进 URL：带 changes 的链接有一万四千多字符，浏览器和表单都可能截断
// （上次就踩过——URL 一长，模板里没写进 URL 的下拉框还会被清成「无」）。
const updateUrl =
  'https://github.com/chthollyphile/folium-compound/issues/new' +
  '?template=mod-update.yml' +
  '&title=' + q('[模组更新] 歌曲评论 song-comments') +
  '&mod-id=' + encodeURIComponent(MANIFEST.id) +
  '&ref=' + encodeURIComponent('v' + MANIFEST.version);

fs.writeFileSync(path.resolve(__dirname, '../UPDATE-BODY.md'), changes + '\n');

const out = [
  '# 提交记录与剩下的动作（v' + MANIFEST.version + '）',
  '',
  '## 1. 模组更新（folium-compound）· 待提交',
  '',
  '- 上一次：**#208**（v1.1.1，CI 格式检查通过，等维护者 `/sign`）',
  '- 本次：**v' + MANIFEST.version + '**，要为它新开一个更新 issue（不要往 #208 里追加）',
  '',
  '### 步骤',
  '',
  '1. 打开下面的链接（只带 template / title / mod-id / ref 四个字段）：',
  '',
  '   ' + updateUrl,
  '',
  '2. 表单里 **渠道 = 保持不变**、**分类 = 保持不变**。URL 里带参数时，没写进 URL 的下拉框会被清成「无」，所以这两项要手动选回来。',
  '3. 正文从 `UPDATE-BODY.md` 整段粘进「更新说明」框（不要用 URL 传，太长会被截断）。',
  '4. 勾上确认项，提交。标签 `mod-update` 由模板自动带上；没有这个标签 CI 不会跑。',
  '',
  '## 2. 上游 feature request（folia-major）',
  '',
  featureUrl,
  '',
].join('\n');

fs.writeFileSync(path.resolve(__dirname, '../ISSUE-LINKS.md'), out);
console.log('wrote ISSUE-LINKS.md');
console.log('feature url chars:', featureUrl.length, '| update url chars:', updateUrl.length);

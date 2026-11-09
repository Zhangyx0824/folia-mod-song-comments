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

const changes = `1.0.3 · 页签有自己的图标

【界面】播放器侧栏的「评论」页签现在显示对话气泡图标，不再是所有模组共用的拼图。仅当侧栏窄到只显示图标时可见（这是宿主的降级策略）；放得下文字时仍然是「评论」两个字，和其他页签一致。

【实现】宿主 0.7.x 的 playerPanelTabs 不接受 icon 字段（渲染层统一写死 lucide Puzzle），所以本模组改用官方 styles 注册表注入一条 CSS，用 [data-ponder-panel-tab-button*="song-comments"] 只匹配自己那个页签按钮，把宿主画的 svg 换成 16px 的 mask 图标（currentColor，跟随常态/选中/hover 颜色）。不碰其他模组、不改宿主 DOM、不需要新权限。

【说明】提交 1.0.2 时说明里写的「不注入全局样式」现在需要修正：本版本确实注入了一条全局 CSS，但它通过官方 styles 注册表（宿主会包进 @layer folium-mods），选择器只命中本模组页签，不影响其他模组与宿主界面。权限未变，仍是 platform.netease.read（只读）+ experimental platform.raw。

【风险】data-ponder-panel-tab-button 是宿主引导系统用的属性，不是公开 API。宿主改名后图标会退回拼图，但面板功能不受影响；已向上游提 feature request，等 playerPanelTabs 支持 icon 字段后立刻改回官方用法并删掉这段 CSS。

【其他】测试项从 67 加到 82 项，新增页签图标样式的作用域、遮罩、currentColor、重复激活不重复注入、以及没有 styles 注册表时的兜底。`;

const updateUrl =
  'https://github.com/chthollyphile/folium-compound/issues/new' +
  '?template=mod-update.yml' +
  '&title=' + q('[模组更新] 歌曲评论 song-comments') +
  '&mod-id=' + encodeURIComponent(MANIFEST.id) +
  '&ref=' + encodeURIComponent('v' + MANIFEST.version) +
  '&changes=' + q(changes);

const out = [
  '# 剩下的两个点击动作（v' + MANIFEST.version + '）',
  '',
  '## 1. 上游 feature request（folia-major）',
  '',
  featureUrl,
  '',
  '## 2. 模组更新（folium-compound）',
  '',
  updateUrl,
  '',
].join('\n');

fs.writeFileSync(path.resolve(__dirname, '../ISSUE-LINKS.md'), out);
console.log('wrote ISSUE-LINKS.md');
console.log('feature url chars:', featureUrl.length, '| update url chars:', updateUrl.length);

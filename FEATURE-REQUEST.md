# 上游 feature request · 模组页签支持自定义图标

> 提给 **chthollyphile/folia-major**（宿主），不是 folium-compound（那边只收上架/更新）。
> 表单：功能建议（markdown 模板，无 form 字段，直接给 title + body）。

## 为什么提

宿主 `playerPanelTabs.register()` 只认 `id` / `label` / `order` / `mount`，
页签按钮的图标是渲染层写死的一个 lucide `Puzzle`：

```js
// dist/assets/service-*.js —— 把注册项转成页签列表，只取 id 和 label
lt = () => [...t]
  .sort((a, b) => (a.def.order ?? 500) - (b.def.order ?? 500) || a.id.localeCompare(b.id))
  .map((t) => ({ id: ct(t.id), label: f(t.def.label, e.language, t.name) }));

// dist/assets/bootstrap-*.js —— 模组页签统一用 E（lucide Puzzle），内置页签各有各的
nt.forEach((e) => rt.push({ id: e.id, label: e.label, icon: E }));
```

注册校验也只检查一件事，所以传 `icon` 不报错、直接丢弃：

```js
N = m('playerPanelTabs', {
  validate: (e) => {
    if (typeof e.mount !== 'function') throw Error('playerPanelTabs.register: mount must be a function');
    return e;
  },
});
```

后果：侧栏窄到放不下文字时（宿主的降级策略是「未选中的页签只显示图标」），
**所有模组页签长得一模一样**，只能靠悬停 tooltip 区分。装两个以上页签类模组就没法用了。

影响到的现有模组（都是社区模组，作者各不相同，改不了宿主）：
`song-info`（歌曲资料）、`lyric-ai-director`（AI 歌词）、`song-comments`（评论）。

## 建议方案

`playerPanelTabs.register` 接受一个可选的 `icon`，取值是 **lucide 图标名**：

```js
folium.registries.playerPanelTabs.register({
  id: 'song-comments',
  label: { 'zh-CN': '评论', en: 'Comments' },
  icon: 'message-circle',   // ← 新增，可选
  order: 120,
  mount,
});
```

渲染处一行就能接上，宿主已经有 1600+ 个 lucide 图标和 `dynamicIconImports`：

```js
nt.forEach((e) => rt.push({ id: e.id, label: e.label, icon: resolveIcon(e.icon) ?? E }));
```

- **向后兼容**：没传 `icon` 就是现在的拼图，已有模组不用改、不会碎。
- **不新增权限**：只是渲染，不涉及数据。
- 传了宿主不认识的图标名时，静默回退到 `Puzzle`（别抛错，别让页签消失）。

顺带一个可选项（不强求，属于设计决定）：现在选中态只显示文字、不显示图标，
如果希望选中态也带图标，得同时放宽 `iconOnly` 的判定——这条可以单独讨论。

## 可替代方案（为什么我不建议）

1. **模组自己注入 CSS 覆盖**：我正在 `song-comments` 里用这个办法（`styles` 注册表 +
   `[data-ponder-panel-tab-button*="<modId>"]` 选择器，把宿主画的 svg 换成自己的 mask 图标）。
   它能用，但依赖 `data-ponder-panel-tab-button` 这个内部属性——不属于公开 API，
   宿主换个属性名就全断；而且**只能改自己的页签**，改不了别人的模组，解决不了 `song-info`
   和 `lyric-ai-director`。
2. **宿主内置一张 mod id → 图标的映射表**：不可维护，每上一个新模组都得改宿主。

## 环境

- Folia 0.7.23（macOS，Apple Silicon）
- 相关实现：`dist/assets/service-*.js`（注册表 + 页签列表）、`dist/assets/bootstrap-*.js`（分段控件渲染）
- 具体现象可复现：装两个以上带侧栏页签的模组，把播放器侧栏拖窄到只显示图标

---

## 附：给 song-info / lyric-ai-director 作者的留言（宿主支持后再发）

> 宿主合入 `playerPanelTabs` 的 `icon` 字段后，只要在 `register()` 里加一行就能有自己的图标：
>
> ```js
> folium.registries.playerPanelTabs.register({
>   id: '...', label: { 'zh-CN': '...', en: '...' },
>   icon: 'message-circle',   // lucide 图标名，见 https://lucide.dev/icons
>   mount,
> });
> ```
>
> 现在侧栏放不下文字时，所有模组页签都是同一个拼图图标；加上这一行就能区分了。
> 不传则保持原样，不影响旧版本。

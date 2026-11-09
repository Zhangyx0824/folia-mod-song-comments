// Renders the host's real panel-tab button markup (button > span > svg, see
// service-*.js Yz) with the mod's actual tab-icon CSS, so the icon can be
// checked against the puzzle icons it replaces.
//
//   node test/build_tabicon_harness.mjs
//   chrome --headless --screenshot=... file://.../test/tabicon.html
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SRC = fs.readFileSync(path.resolve(__dirname, '../song-comments/client.mjs'), 'utf8');

const grab = (name) => {
  const match = SRC.match(new RegExp('const ' + name + ' =\\s*([\\s\\S]*?);\\n'));
  if (!match) throw new Error(`cannot find ${name} in client.mjs`);
  return match[1];
};

const maskValue = Function('return ' + grab('TAB_ICON_MASK'))();
const cssTemplate = SRC.match(/const TAB_ICON_CSS = `([\s\S]*?)`;/);
if (!cssTemplate) throw new Error('cannot find TAB_ICON_CSS in client.mjs');
const TAB_SEL = '[data-ponder-panel-tab-button*="song-comments"]';
const tabCss = cssTemplate[1]
  .replace(/\$\{TAB_ICON_MASK\}/g, maskValue)
  .replace(/\$\{TAB_SEL\}/g, TAB_SEL);

const PUZZLE =
  '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
  '<path d="M19.439 7.85c-.049.322.059.648.289.878l1.568 1.568c.47.47.706 1.087.706 1.704s-.235 1.233-.706 1.704l-1.611 1.611a.98.98 0 0 1-.837.276c-.47-.07-.802-.48-.968-.925a2.501 2.501 0 1 0-3.214 3.214c.446.166.855.497.925.968a.979.979 0 0 1-.276.837l-1.61 1.61a2.404 2.404 0 0 1-1.705.707 2.402 2.402 0 0 1-1.704-.706l-1.568-1.568a1.026 1.026 0 0 0-.877-.29c-.493.074-.84.504-1.02.968a2.5 2.5 0 1 1-3.237-3.237c.464-.18.894-.527.967-1.02a1.026 1.026 0 0 0-.289-.877l-1.568-1.568A2.402 2.402 0 0 1 1.998 12c0-.617.236-1.234.706-1.704L4.23 8.77c.24-.24.581-.353.917-.303.515.077.877.528 1.073 1.01a2.5 2.5 0 1 0 3.259-3.259c-.482-.196-.933-.558-1.01-1.073-.05-.336.062-.676.303-.917l1.525-1.525A2.402 2.402 0 0 1 12 1.998c.617 0 1.234.236 1.704.706l1.568 1.568c.23.23.556.338.877.29.493-.074.84-.504 1.02-.968a2.5 2.5 0 1 1 3.237 3.237c-.464.18-.894.527-.967 1.02Z"/></svg>';

const TABS = [
  { id: 'folium:panelTab:song-info:song-info', label: '歌曲资料' },
  { id: 'folium:panelTab:lyric-ai-director:lyric-ai-director', label: 'AI 歌词' },
  { id: 'folium:panelTab:song-comments:song-comments', label: '评论' },
  { id: 'folium:panelTab:k3panel:k3panel', label: 'K3' },
];

// 只复刻 Yz 里跟按钮盒模型有关的那几条：flex row + p-0.5 + h-9，未选中项 flex-[1_1_36px]，
// 选中项按标签宽度撑开。
const tabBar = ({ selected, iconMode }) =>
  `<div class="bar${iconMode ? ' narrow' : ''}">` +
  TABS.map((tab) => {
    const on = tab.id === selected;
    const icon = !on && iconMode ? PUZZLE : '';
    const label = on || !iconMode ? `<span class="lbl">${tab.label}</span>` : '';
    return (
      `<button type="button" class="tab${on ? ' on' : ''}" data-ponder-panel-tab-button="${tab.id}" aria-pressed="${on}">` +
      `<span class="lblwrap">${icon}${label}</span></button>`
    );
  }).join('') +
  '</div>';

const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><style>
  :root{--st-fill:#26262b;--st-raise:#33333a;--st-t1:#ececf0;--st-t2:#9a9aa4;}
  html,body{margin:0;background:#141417;font-family:-apple-system,"PingFang SC",system-ui;}
  #stage{padding:22px 20px;display:flex;flex-direction:column;gap:26px;}
  .cap{font-size:11px;letter-spacing:.02em;color:#6f6f7a;margin-bottom:8px;}
  .bar{display:flex;width:100%;background:var(--st-fill);padding:2px;height:36px;border-radius:10px;box-sizing:border-box;}
  .bar.narrow{width:196px;}
  .tab{display:flex;flex:1 1 36px;min-width:0;height:100%;align-items:center;justify-content:center;
    border:0;background:transparent;color:var(--st-t2);font-size:13px;font-family:inherit;
    position:relative;border-radius:8px;cursor:pointer;padding:0;}
  .bar:not(.narrow) .tab{flex:0 1 auto;padding:0 10px;}
  .tab.on{flex:0 1 auto;padding:0 10px;color:var(--st-t1);}
  .tab.on::before{content:"";position:absolute;inset:0;background:var(--st-raise);border-radius:8px;
    box-shadow:0 1px 2px rgba(0,0,0,.2);}
  .lblwrap{position:relative;display:flex;min-width:0;align-items:center;gap:6px;}
  .lbl{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
  ${tabCss}
</style></head><body><div id="stage">
  <div><div class="cap">窄侧栏 · 图标模式（未选中的页签显示图标）</div>${tabBar({ selected: '', iconMode: true })}</div>
  <div><div class="cap">窄侧栏 · 选中本模组（选中项显示文字）</div>${tabBar({ selected: 'folium:panelTab:song-comments:song-comments', iconMode: true })}</div>
  <div><div class="cap">宽侧栏 · 标签模式（宿主本来就不画图标）</div>${tabBar({ selected: '', iconMode: false })}</div>
</div></body></html>`;

const out = path.resolve(__dirname, 'tabicon.html');
fs.writeFileSync(out, html);
console.log('wrote', out);

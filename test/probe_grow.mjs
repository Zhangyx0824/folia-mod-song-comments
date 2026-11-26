// Reproduce the "height sticks at the previous value" bug against the real
// player-panel shell:
//
//   panel[st-window]  max-height: <room>, overflow-y:auto, flex column
//     header                                     (variable height)
//     div[st-t-unfold] height = measured(content) + consts, overflow:hidden, shrink
//       div[line]
//       div[st-scroll] flex:1, overflow-y:auto
//         div[st-page-in]  ← 模组挂在这里，ResizeObserver 量高度回写给 st-t-unfold
//     div[dock]                                  (tab switcher)
//
// The feedback loop (page-in height → st-t-unfold height → available height) is
// what made `fitHeight()` stick: it measured the space that its own pinned
// height had just created.
//
//   node test/probe_grow.mjs
//   "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
//     --headless=new --disable-gpu --dump-dom --virtual-time-budget=8000 \
//     "file://$PWD/test/grow-probe.html"
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.join(__dirname, '../song-comments/client.mjs'), 'utf8')
  .replace('export default function activate', 'function activate');

const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><style>
  html,body{margin:0;height:100%;background:#111114;color:#eee;font-family:-apple-system,system-ui;}
  /* st-window：底边锚定、有 max-height，自身可滚 */
  .panel{position:fixed;right:8px;bottom:8px;width:360px;display:flex;flex-direction:column;
    overflow-y:auto;overflow-x:hidden;background:#17171b;border-radius:20px;padding:12px;
    max-height:520px;box-sizing:border-box;}
  .head{height:150px;flex:none;background:#1d1d22;}
  .unfold{display:flex;min-height:0;flex-shrink:1;flex-direction:column;overflow:hidden;
}
  .line{height:1px;flex:none;background:#2a2a31;}
  .scroll{min-height:0;flex:1;overflow-y:auto;overscroll-behavior:contain;padding-top:8px;padding-left:12px;}
  .page-in{}
  .dock{height:56px;flex:none;background:#1d1d22;}
  #result{position:fixed;left:0;top:0;right:380px;font:12px/1.55 monospace;white-space:pre-wrap;}
</style></head><body>
<div class="panel" id="panel">
  <div class="head"></div>
  <div class="unfold" id="unfold">
    <div class="line"></div>
    <div class="scroll" id="scroll">
      <div class="page-in" id="pageIn"></div>
    </div>
  </div>
  <div class="dock"></div>
</div>
<pre id="result">pending</pre>
<script type="module">
${source}

const PANEL = document.getElementById('panel');
const UNFOLD = document.getElementById('unfold');
const PAGE = document.getElementById('pageIn');

// 宿主给页签内容的可用高度（真实宿主是 --pn-tab-room，继承到 shadow 里）。
// 与上面 .panel 的 520px / header 150 / dock 56 对上，等于「面板高度 − 上下留白 − 头 − 底栏」。
PANEL.style.setProperty('--pn-tab-room', '293px');

// 宿主把 pageIn 量到的高度写回 st-t-unfold。真实宿主用 ResizeObserver；
// 无头浏览器里的 RO 投递不稳定，这里换成轮询（对被测代码等价）。
const syncUnfold = () => {
  const h = Math.ceil(PAGE.getBoundingClientRect().height);
  if (h <= 0) return;
  const next = h + 9 + 'px';
  if (UNFOLD.style.height !== next) UNFOLD.style.height = next;
};
setInterval(syncUnfold, 40);
syncUnfold();

const COMMENTS = Array.from({ length: 14 }, (_, i) => ({
  commentId: 'c' + i,
  content: '第 ' + (i + 1) + ' 条评论，内容足够长，用来把列表撑出滚动条。' + '补'.repeat(24),
  time: Date.now() - i * 3600e3,
  likedCount: 2000 - i * 10,
  user: { nickname: '听众' + i, avatarUrl: '' },
}));

// 先播 QQ 音乐曲目：没有网易云 id，也搜不到 → 只有一行状态文案（内容很矮）
let song = { id: 'song-y', source: 'qq', title: '晴天', artist: '周杰伦', album: '叶惠美' };
let onSongChanged = () => {};

const folium = {
  env: { context: 'main' },
  log: { info() {}, warn() {} },
  host: { folium: { major: 1, minor: 10 }, folia: '0.8.0' },
  registries: {
    settingsSections: { register: () => ({ settings: { get: () => ({}), onChange: () => () => {} } }) },
    progressButtons: { register: () => ({ unregister() {} }) },
    playerPanelTabs: { register: (def) => { window.__tab = def; return { unregister() {} }; } },
    styles: { register: () => ({ unregister() {} }) },
  },
  experimental: { 'platform.raw': { describe: () => ({ supported: true }),
    request: async (_provider, endpoint) => {
      if (endpoint === 'search') return { body: { result: { songs: [] } } };
      return { body: { total: 5000, hotComments: COMMENTS } };
    } } },
  playback: { getState: () => ({ song }) },
  events: { on: (_name, handler) => { onSongChanged = handler; return () => {}; } },
  ui: { openPlayerPanel() {} },
};

activate(folium);

// 复刻 modSystem：一张 shadow root 里的挂载点
const shadowHost = document.createElement('div');
PAGE.appendChild(shadowHost);
const shadow = shadowHost.attachShadow({ mode: 'open' });
const mountPoint = document.createElement('div');
shadow.appendChild(mountPoint);
window.__tab.mount(mountPoint, { locale: 'zh-CN' });

const root = mountPoint.querySelector('.sc-root');
const body = mountPoint.querySelector('.sc-body');

const snap = (label) => {
  const r = root.getBoundingClientRect();
  const b = body.getBoundingClientRect();
  return {
    label,
    rootH: Math.round(r.height),
    rootTop: Math.round(r.top),
    rootMaxH: root.style.maxHeight || '(none)',
    computedMaxH: getComputedStyle(root).maxHeight,
    bodyH: Math.round(b.height),
    bodyScrollH: body.scrollHeight,
    bodyScrollable: body.scrollHeight > body.clientHeight + 4,
    bodyOverflowY: getComputedStyle(body).overflowY,
    items: mountPoint.querySelectorAll('.sc-item').length,
    panelScrollable: PANEL.scrollHeight > PANEL.clientHeight + 4,
    hostScrollable: (() => { const s = document.getElementById('scroll'); return s.scrollHeight > s.clientHeight + 4; })(),
    rootInsidePanel: Math.round(PANEL.getBoundingClientRect().bottom - r.bottom),
    lastItemVisibleBottom: (() => {
      const items = mountPoint.querySelectorAll('.sc-item');
      if (!items.length) return null;
      const last = items[items.length - 1].getBoundingClientRect();
      return Math.round(last.bottom - b.top);
    })(),
  };
};

const out = [];
const step = (label, ms) => new Promise((resolve) => setTimeout(() => { out.push(snap(label)); resolve(); }, ms));

(async () => {
  await step('A: QQ 曲目（内容很矮）', 500);

  song = { id: '121597355', source: 'netease', title: '夜航西飞', artist: '陈婧霏', album: '夜航西飞' };
  onSongChanged();
  await step('B: 切到网易云曲目（14 条评论）', 900);

  song = { id: 'song-z', source: 'qq', title: '稻香', artist: '周杰伦', album: '魔杰座' };
  onSongChanged();
  await step('C: 再切回 QQ 曲目', 900);

  song = { id: '121597355', source: 'netease', title: '夜航西飞', artist: '陈婧霏', album: '夜航西飞' };
  onSongChanged();
  await step('D: 又切回网易云曲目', 900);

  // E: 老宿主没有 --pn-tab-room → 不设上限，交给宿主的滚动容器
  PANEL.style.removeProperty('--pn-tab-room');
  await step("E: 没有宿主变量", 2400);
  // F: 真实宿主的变量是 calc(var(--pn-room) - 57px) 这种嵌套形态，必须还能解析
  PANEL.style.setProperty('--pn-room', 'calc(100dvh - 400px)');
  PANEL.style.setProperty('--pn-tab-room', 'calc(var(--pn-room) - 57px)');
  await step("F: 宿主变量是嵌套 calc", 2400);

  const a = out[1];
  const short = out[0];
  const noVar = out[4];
  const nested = out[5];
  const checks = [
    ['B 的评论条数 = 14', a.items === 14],
    ['B 的正文区确实变高了（比 A 高 60px 以上）', a.bodyH > short.bodyH + 60],
    ['B 能滚到最后一条', a.bodyScrollable],
    ['B 没有把面板撑出滚动条（父子不双滚）', a.panelScrollable === false],
    ['C 回到矮内容高度（不残留 B 的高度）', Math.abs(out[2].rootH - short.rootH) < 24],
    ['D 与 B 高度一致（不被 C 带坏）', Math.abs(out[3].rootH - a.rootH) < 24],
    ['E 没有宿主变量时不设上限', !noVar.rootMaxH || noVar.rootMaxH === '(none)'],
    ['E 内容仍然能看全（交给宿主滚动）', noVar.panelScrollable || noVar.hostScrollable || noVar.bodyScrollable],
    ['F 嵌套 calc 的上限还能解析成 px', parseFloat(nested.computedMaxH) > 0],
    ['F 上限生效（内容不再自然铺开）', nested.rootH < noVar.rootH - 40],
  ];
  const failed = checks.filter(([, ok]) => !ok);
  document.getElementById('result').textContent =
    JSON.stringify({ snapshots: out, checks, failed: failed.map(([n]) => n) }, null, 1);
})();
</script></body></html>`;

fs.writeFileSync(path.join(__dirname, 'grow-probe.html'), html);
console.log('wrote test/grow-probe.html');

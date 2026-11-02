// Build a layout probe that reproduces the host's panel-tab shell
// (shadow root + fill:false + a scrolling ancestor) and asserts that the mod's
// self-measuring root actually ends up with a scrollable list.
//   node test/probe_scroll.mjs
//   chrome --headless --dump-dom --virtual-time-budget=3000 file://.../scroll-probe.html
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.join(__dirname, '../song-comments/client.mjs'), 'utf8')
    .replace('export default function activate', 'function activate');

const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><style>
  html,body{margin:0;height:100%;background:#111114;color:#eee;font-family:-apple-system,system-ui;}
  .panel{width:360px;height:520px;display:flex;flex-direction:column;overflow:hidden;background:#17171b;}
  .panel-head{height:44px;flex:none;}
  .panel-scroll{flex:1;min-height:0;overflow-y:auto;}
  .card{width:100%;}
  #result{position:fixed;right:0;top:0;width:420px;font:12px/1.6 monospace;white-space:pre-wrap;}
</style></head><body>
<div class="panel"><div class="panel-head"></div><div class="panel-scroll" id="scroller"></div></div>
<pre id="result">pending</pre>
<script type="module">
${source}

const COMMENTS = Array.from({ length: 12 }, (_, i) => ({
  commentId: 'c' + i,
  content: '第 ' + (i + 1) + ' 条评论，内容足够长，用来把列表撑出滚动条。' + '补'.repeat(20),
  time: Date.now() - i * 3600e3,
  likedCount: 1000 - i * 10,
  user: { nickname: '听众' + i, avatarUrl: '' },
}));

const fakeSong = { id: '1901371647', title: '夜航西飞', artist: '陈婧霏', album: '夜航西飞',
  sourceRef: { kind: 'online', providerId: 'netease', mediaId: '1901371647' } };

const folium = {
  env: { context: 'main' },
  log: { info() {}, warn() {} },
  host: { folium: { major: 1, minor: 7 }, folia: '0.7.23' },
  registries: {
    settingsSections: { register: () => ({ settings: { get: () => ({}), onChange: () => () => {} } }) },
    progressButtons: { register: () => ({ unregister() {} }) },
    playerPanelTabs: { register: (def) => { window.__tab = def; return { unregister() {} }; } },
  },
  experimental: { 'platform.raw': { describe: () => ({ supported: true }),
    request: async () => ({ body: { total: 4821, hotComments: COMMENTS } }) } },
  playback: { getState: () => ({ song: fakeSong }) },
  events: { on: () => () => {} },
  ui: { openPlayerPanel() {} },
};

activate(folium);

// 模仿宿主：面板里是可滚动内容区，模组被放进一个宽度 100%、高度 auto 的卡片里，
// 而且卡片里面还有一层 shadow root（modSystem 用 shadow: true 挂载）。
const scroller = document.getElementById('scroller');
const card = document.createElement('div');
card.className = 'card';
const shadowHost = document.createElement('div');
card.appendChild(shadowHost);
scroller.appendChild(card);
const shadow = shadowHost.attachShadow({ mode: 'open' });
const mountPoint = document.createElement('div');
shadow.appendChild(mountPoint);

window.__tab.mount(mountPoint, { locale: 'zh-CN' });

setTimeout(() => {
  const root = mountPoint.querySelector('.sc-root');
  const body = mountPoint.querySelector('.sc-body');
  const checks = [];
  const check = (label, value, extra) => checks.push({ label, value, extra });

  const scrollerRect = scroller.getBoundingClientRect();
  check('scroller height', Math.round(scrollerRect.height));
  check('root style height', root.style.height);
  check('root clientHeight', root.clientHeight);
  check('root scrollHeight', root.scrollHeight);
  check('body overflowY', getComputedStyle(body).overflowY);
  check('body clientHeight', body.clientHeight);
  check('body scrollHeight', body.scrollHeight);
  check('items', mountPoint.querySelectorAll('.sc-item').length);

  body.scrollTop = 240;
  check('body scrollTop after set', body.scrollTop);
  check('list actually overflows', body.scrollHeight > body.clientHeight + 20);
  check('root does not overflow the host', root.scrollHeight <= root.clientHeight + 1);

  check('page scrollHeight', document.documentElement.scrollHeight);
  check('page innerHeight', window.innerHeight);

  document.getElementById('result').textContent = JSON.stringify(checks, null, 1);
}, 400);
</script></body></html>`;

fs.writeFileSync(path.join(__dirname, 'scroll-probe.html'), html);
console.log('wrote test/scroll-probe.html');

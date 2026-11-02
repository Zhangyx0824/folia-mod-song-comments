// Build the store preview: a mock player screen with the real panel mounted, so
// the preview is the mod's own markup instead of a hand-drawn picture.
//   node test/build_preview.mjs
//   chrome --headless --screenshot=preview.png --window-size=1280,680 file://.../test/preview.html
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(path.join(__dirname, '../song-comments/client.mjs'), 'utf8')
    .replace('export default function activate', 'function activate');

const NOW = Date.now();
const COMMENTS = [
    ['清和', 12800, '前奏一响就知道是它。十年前在网吧听见，现在还在听。', NOW - 1000 * 60 * 60 * 5],
    ['路人甲', 3421, '副歌那句转音真的太难了，KTV 里点这首基本是自杀。', NOW - 1000 * 60 * 60 * 26],
    ['小满', 986, '2024 年还在听的扣 1。这一句我唱了十年，还是跑调。', NOW - 1000 * 60 * 60 * 24 * 9],
    ['一只猫', 231, '把这首歌推荐给了一个很重要的的人，希望她过得好。', NOW - 1000 * 60 * 60 * 24 * 40],
    ['南方有雨', 87, '听到 2:14 那里起鸡皮疙瘩。', NOW - 1000 * 60 * 60 * 24 * 200],
];

const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><style>
  *{box-sizing:border-box}
  html,body{margin:0;width:1280px;height:680px;overflow:hidden;
    font-family:-apple-system,"PingFang SC",system-ui,sans-serif;color:#ececf0;
    background:
      radial-gradient(1200px 700px at 15% 8%, #3a2b3f 0%, rgba(58,43,63,0) 55%),
      radial-gradient(900px 600px at 78% 88%, #24303f 0%, rgba(36,48,63,0) 60%),
      #0c0c10;}
  .wrap{position:relative;width:1280px;height:680px}
  .glow{position:absolute;left:40px;top:40px;width:520px;height:520px;border-radius:50%;
    background:radial-gradient(circle,rgba(214,166,255,.16),rgba(214,166,255,0) 68%);filter:blur(6px)}
  .now{position:absolute;left:96px;top:120px;display:flex;gap:26px;align-items:center}
  .cover{width:150px;height:150px;border-radius:18px;box-shadow:0 18px 44px rgba(0,0,0,.5);
    background:linear-gradient(140deg,#7f6ac9,#c98fa4 52%,#4a4a7d);position:relative;overflow:hidden}
  .cover:after{content:"";position:absolute;inset:0;background:radial-gradient(circle at 30% 25%,rgba(255,255,255,.4),transparent 55%)}
  .meta .t{font-size:26px;font-weight:700;letter-spacing:.01em}
  .meta .a{font-size:14px;opacity:.55;margin-top:8px}
  .lyrics{position:absolute;left:96px;top:330px;width:600px;text-align:left}
  .lyrics div{font-size:26px;line-height:1.9;color:rgba(236,236,240,.28);letter-spacing:.02em}
  .lyrics .on{color:#fff;font-size:28px;font-weight:600}
  .bar{position:absolute;left:96px;right:486px;bottom:74px;height:2px;border-radius:2px;background:rgba(255,255,255,.16)}
  .bar i{position:absolute;left:0;top:0;height:2px;width:196px;border-radius:2px;background:#ececf0}
  .bar b{position:absolute;left:196px;top:-4px;width:10px;height:10px;border-radius:50%;background:#fff;box-shadow:0 0 0 4px rgba(255,255,255,.14)}
  .times{position:absolute;left:96px;right:486px;bottom:46px;display:flex;justify-content:space-between;font-size:11px;opacity:.4}
  .icons{position:absolute;right:486px;bottom:88px;display:flex;gap:12px;align-items:center}
  .ico{width:22px;height:22px;border-radius:50%;background:rgba(255,255,255,.22)}
  .callout{width:26px;height:26px;border-radius:8px;
    background:rgba(255,255,255,.14);border:1px solid rgba(255,255,255,.5);display:flex;align-items:center;justify-content:center}
  .hint{position:absolute;right:486px;bottom:130px;font-size:12px;padding:5px 11px;border-radius:999px;
    background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.16);white-space:nowrap;opacity:.9}
  .panel{position:absolute;right:40px;top:32px;width:404px;height:616px;border-radius:18px;
    background:rgba(23,23,28,.92);border:1px solid rgba(255,255,255,.09);
    box-shadow:0 30px 70px rgba(0,0,0,.55);padding:20px 20px 14px;display:flex;
    --folium-primary:#ececf0;--folium-font:-apple-system,"PingFang SC",system-ui}
  .panel > div{flex:1;min-height:0}
  .tag{position:absolute;right:56px;top:8px;font-size:11px;opacity:.45;letter-spacing:.08em}
</style></head><body><div class="wrap">
  <div class="glow"></div>
  <div class="now"><div class="cover"></div><div class="meta"><div class="t">夜航西飞</div><div class="a">陈婧霏 · 夜航西飞</div></div></div>
  <div class="lyrics">
    <div>把行李放在心里 就不算流浪</div>
    <div class="on">夜航西飞 我在云上看你</div>
    <div>风把灯吹亮 又把灯吹熄</div>
  </div>
  <div class="bar"><i></i><b></b></div>
  <div class="times"><span>1:12</span><span>4:38</span></div>
  <div class="icons"><div class="ico"></div><div class="ico"></div>
  <div class="callout"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg></div>
  </div>
  <div class="hint">进度条右侧评论按钮 · 点开是侧栏「评论」页签</div>
  <div class="panel"><div id="host"></div></div>
</div>
<script type="module">
${source}

const COMMENTS = ${JSON.stringify(COMMENTS)};
const reply = (endpoint) => {
    if (endpoint === 'comment_hot') {
        return {
            total: 24816,
            hotComments: COMMENTS.map(([nickname, likedCount, content, time], index) => ({
                commentId: 'c' + index,
                content,
                time,
                likedCount,
                user: { nickname, avatarUrl: '' },
                ...(index === 2 ? { beReplied: [{ user: { nickname: '楼主' }, content: '这首是我大学室友循环了四年的歌。' }] } : {}),
            })),
        };
    }
    return { total: 24816, comments: [] };
};

const fakeSong = { id: '1901371647', title: '夜航西飞', artist: '陈婧霏', album: '夜航西飞',
  sourceRef: { kind: 'online', providerId: 'netease', mediaId: '1901371647' } };

const folium = {
  env: { context: 'main' },
  log: { info() {}, warn() {} },
  host: { folium: { major: 1, minor: 7 }, folia: '0.7.23' },
  registries: {
    settingsSections: { register: () => ({ settings: { get: () => ({}), onChange: () => () => {} } }) },
    progressButtons: { register: (t) => { window.__button = t; return { unregister() {} }; } },
    playerPanelTabs: { register: (t) => { window.__tab = t; return { unregister() {} }; } },
  },
  experimental: { 'platform.raw': { describe: () => ({ supported: true }),
    request: async (providerId, endpoint) => ({ body: reply(endpoint) }) } },
  playback: { getState: () => ({ song: fakeSong, state: 'playing', position: 72, duration: 278 }) },
  events: { on: () => () => {} },
  ui: { openPlayerPanel() {} },
};

activate(folium);
window.__tab.mount(document.getElementById('host'), { locale: 'zh-CN' });
</script></body></html>`;

fs.writeFileSync(path.join(__dirname, 'preview.html'), html);
console.log('wrote test/preview.html');

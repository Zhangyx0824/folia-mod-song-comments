// Build a Chromium harness that mounts the panel with mocked data, so the
// layout can be checked by eye (jsdom cannot see anything).
//   node test/build_harness.mjs && open test/harness.html
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
    ['一只猫', 231, '把这首歌推荐给了一个很重要的人，希望她过得好。', NOW - 1000 * 60 * 60 * 24 * 40],
    ['南方有雨', 87, '听到 2:14 那里起鸡皮疙瘩。', NOW - 1000 * 60 * 60 * 24 * 200],
];

const replySource = `(endpoint) => {
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
}`;

const html = `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><style>
  html,body{margin:0;height:100%;background:#111114;font-family:-apple-system,"PingFang SC",system-ui;}
  #stage{display:flex;height:100%;align-items:center;justify-content:center;gap:24px;}
  .panel{width:380px;height:600px;background:#17171b;border-radius:16px;padding:18px 18px 14px;box-sizing:border-box;
    --folium-primary:#ececf0;--folium-font:-apple-system,"PingFang SC",system-ui;display:flex;}
  .panel > div{flex:1;min-height:0;}
  body.light{background:#e9e9ec;}
  body.light .panel{background:#fbfbfc;--folium-primary:#1b1b1f;box-shadow:0 4px 24px rgba(0,0,0,.08);}
</style></head><body><div id="stage"><div class="panel"><div id="host"></div></div></div>
<script>if (location.search.indexOf('light') !== -1) document.body.classList.add('light');</script>
<script type="module">
${source}

const COMMENTS = ${JSON.stringify(COMMENTS)};
const reply = ${replySource};

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
  playback: { getState: () => ({ song: fakeSong, state: 'playing', position: 30, duration: 230 }) },
  events: { on: () => () => {} },
  ui: { openPlayerPanel() {} },
};

activate(folium);
window.__tab.mount(document.getElementById('host'), { locale: 'zh-CN' });
</script></body></html>`;

fs.writeFileSync(path.join(__dirname, 'harness.html'), html);
console.log('wrote test/harness.html');

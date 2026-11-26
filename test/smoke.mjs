// Smoke test: load the mod's client entry against a fake Folium host and a
// minimal DOM (jsdom), mount the progress button and the panel tab, and check
// the three things that matter: the button opens the panel, comments are asked
// for through the experimental platform.raw with the right song id, and a track
// with no NetEase id goes through the search match.
// Run with:
//   node test/smoke.mjs
import { createRequire } from 'module';
import path from 'path';
import fs from 'fs';
import { pathToFileURL, fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// jsdom lives in the managed workspace; ESM ignores NODE_PATH, so resolve it
// explicitly.
const require = createRequire('/Users/pomepii/.workbuddy/binaries/node/workspace/node_modules/');
const { JSDOM } = require('jsdom');

const MOD_DIR = path.resolve(__dirname, '../song-comments');
const CLIENT = path.join(MOD_DIR, 'client.mjs');
const MANIFEST = JSON.parse(fs.readFileSync(path.join(MOD_DIR, 'mod.json'), 'utf8'));

const dom = new JSDOM('<!doctype html><html><body><div id="button-host"></div><div id="panel-host"></div></body></html>', {
    pretendToBeVisual: true,
});
const { window } = dom;
global.window = window;
global.document = window.document;
global.Element = window.Element;
global.HTMLElement = window.HTMLElement;
global.Node = window.Node;
// Node 22 exposes `navigator` as a getter-only global; jsdom's one has to be
// installed with defineProperty.
Object.defineProperty(global, 'navigator', { value: window.navigator, configurable: true, writable: true });

let failures = 0;
const ok = (condition, label, detail) => {
    if (condition) {
        console.log(`  ok   ${label}`);
        return true;
    }
    failures += 1;
    console.log(`  FAIL ${label}${detail === undefined ? '' : ` — ${detail}`}`);
    return false;
};
const eq = (actual, expected, label) => ok(actual === expected, label, `got ${JSON.stringify(actual)}`);

const flush = (ms = 30) => new Promise((resolve) => setTimeout(resolve, ms));

const commentBody = (likedCount, content) => ({
    commentId: `${content.length}-${likedCount}`,
    content,
    time: Date.now() - 36e5,
    likedCount,
    user: { nickname: '听众', avatarUrl: '' },
});

const makeHost = ({ getSong, settings = {}, reply } = {}) => {
    const calls = [];
    const opened = [];
    const listeners = new Map();
    const registrations = { settingsSections: [], progressButtons: [], playerPanelTabs: [], styles: [] };
    const host = {
        env: { context: 'main' },
        log: { info() {}, warn() {} },
        host: { folium: { major: 1, minor: 7 }, folia: '0.7.23' },
        registries: {
            settingsSections: {
                register: (definition) => {
                    registrations.settingsSections.push(definition);
                    return { settings: { get: () => settings, onChange: () => () => {} } };
                },
            },
            progressButtons: {
                register: (definition) => {
                    registrations.progressButtons.push(definition);
                    return { unregister() {} };
                },
            },
            playerPanelTabs: {
                register: (definition) => {
                    registrations.playerPanelTabs.push(definition);
                    return { unregister() {} };
                },
            },
            styles: {
                register: (definition) => {
                    registrations.styles.push(definition);
                    return { unregister() {} };
                },
            },
        },
        experimental: {
            'platform.raw': {
                describe: () => ({ supported: true }),
                request: async (providerId, endpoint, params) => {
                    calls.push({ providerId, endpoint, params });
                    return { body: reply(endpoint, params) };
                },
            },
        },
        playback: {
            getState: () => {
                const song = getSong();
                return {
                    song,
                    state: 'playing',
                    position: 12,
                    duration: 200,
                    liked: false,
                    canLike: true,
                };
            },
        },
        events: {
            on: (name, listener) => {
                listeners.set(name, listener);
                return () => listeners.delete(name);
            },
        },
        ui: { openPlayerPanel: (id) => opened.push(id) },
    };
    return { host, calls, opened, listeners, registrations };
};

const neteaseSong = {
    id: '1901371647',
    title: '测试歌曲',
    artist: '歌手A',
    album: '测试专辑',
    sourceRef: { kind: 'online', providerId: 'netease', mediaId: '1901371647' },
};

const qqSong = {
    id: 'qq-77',
    title: '测试歌曲',
    artist: '歌手A',
    album: '测试专辑',
    sourceRef: { kind: 'online', providerId: 'qq', mediaId: '77' },
};

const replyFor = (endpoint) => {
    if (endpoint === 'comment_hot') {
        return { total: 1234, hotComments: [commentBody(2300, '热门第一条'), commentBody(12, '热门第二条')] };
    }
    if (endpoint === 'comment_music') {
        return { total: 1234, comments: [commentBody(3, '最新一条')] };
    }
    if (endpoint === 'search') {
        return { result: { songs: [{ id: 999, name: '测试歌曲', artists: [{ name: '歌手A' }], duration: 200000 }] } };
    }
    return {};
};

const activateWith = async (options) => {
    const built = makeHost({ ...options, reply: replyFor });
    const module = await import(pathToFileURL(CLIENT).href);
    const disposer = module.default(built.host);
    await flush(0);
    return { ...built, disposer };
};

console.log('manifest');
ok(MANIFEST.folium === 1, 'folium is 1');
ok((MANIFEST.permissions || []).includes('platform.netease.read'), 'declares platform.netease.read');
ok((MANIFEST.experimental || []).includes('platform.raw'), 'declares the platform.raw experimental opt-in');
ok(MANIFEST.client === 'client.mjs', 'client entry is client.mjs');
// 0.7 时代的 ">=0.7.21 <0.8.0" 会让模组在 0.8.0 上直接不加载（表现为装了但没生效）。
ok(/>=/.test(String(MANIFEST.folia)), 'folia range has a lower bound');
ok(!/<\s*0\.8/.test(String(MANIFEST.folia)), 'folia range does not cut 0.8.0 off');

console.log('\nsettings schema');
{
    // 宿主的 schema 解析只保留对象形式的 label / description：
    //   label: s.label && typeof s.label === 'object' ? s.label : {}
    // 传字符串会静默丢掉，界面就退回显示 pageSize 这种原始 key。
    const allowedTypes = new Set(['number', 'text', 'boolean', 'select', 'color']);
    const ctx = await activateWith({ getSong: () => neteaseSong });
    const section = ctx.registrations.settingsSections[0];
    eq(section.id, 'settings', 'section id stays stable across versions');
    ok(typeof section.label === 'object' && typeof section.label?.['zh-CN'] === 'string', 'section label is an i18n object');
    ok(typeof section.label?.en === 'string', 'section label has an english fallback');
    ok(typeof section.description === 'object' && section.description?.['zh-CN'], 'section description is an i18n object');
    eq(section.settings.length, 3, 'three settings fields');
    section.settings.forEach((field) => {
        ok(typeof field.label === 'object' && typeof field.label?.['zh-CN'] === 'string', `${field.key} shows a chinese label`);
        ok(typeof field.label?.en === 'string', `${field.key} has an english label`);
        ok(allowedTypes.has(field.type), `${field.key} uses a type the host can render`);
        ok(field.description === undefined || typeof field.description === 'object', `${field.key} description is an i18n object`);
    });
    ctx.disposer?.();
}

console.log('\ntab icon');
{
    // 宿主 0.7.x 不认 playerPanelTabs 的 icon 字段，三个模组页签长得一模一样。
    // 模组用 styles 注册表只覆盖自己那个按钮：宿主画了图标（窄侧栏、未选中）就换成评论气泡。
    document.documentElement.removeAttribute('data-song-comments-tab-icon');
    const ctx = await activateWith({ getSong: () => neteaseSong });
    const entries = ctx.registrations.styles;
    eq(entries.length, 1, 'one style sheet registered for the tab icon');
    eq(entries[0].id, 'tab-icon', 'style entry id stays stable');
    const css = entries[0].css;
    ok(css.includes('[data-ponder-panel-tab-button*="song-comments"]'), 'scoped to this mod tab only by its data attribute');
    ok(/\.sc-root|\.sc-body/.test(css) === false, 'global sheet carries no panel internals');
    ok(/display:none/.test(css), 'host puzzle icon is hidden');
    ok(/mask-image/.test(css), 'replacement is drawn with a mask');
    ok(/currentColor/.test(css), 'icon inherits the button colour (normal / selected / hover)');
    ok(/data:image\/svg\+xml/.test(css), 'mask is inline svg — no network asset, no extra file');
    ok(/:has\(svg\)/.test(css), 'replacement only appears where the host actually drew an icon');
    ok(/\sp{0,}>\s*span:has\(svg\)::before/.test(css.replace(/\n/g, ' ')) || /span:has\(svg\)::before/.test(css), 'matches the host button > span > svg layout');
    ok(/16px/.test(css), 'icon keeps the host icon size (16px)');

    // 重复激活（模组热重载）不应该再注入第二份。
    const again = await activateWith({ getSong: () => neteaseSong });
    eq(again.registrations.styles.length, 0, 're-activation does not register a second sheet');
    ctx.disposer?.();
}

console.log('\ntab icon (host without a styles registry)');
{
    document.documentElement.removeAttribute('data-song-comments-tab-icon');
    const built = makeHost({ getSong: () => neteaseSong, reply: replyFor });
    delete built.host.registries.styles;
    const module = await import(pathToFileURL(CLIENT).href);
    module.default(built.host);
    await flush(0);
    const injected = document.head.querySelector('style[data-song-comments-tab-icon]');
    ok(injected !== null, 'falls back to an inline <style> in head');
    ok(injected !== null && injected.textContent.includes('data-ponder-panel-tab-button*="song-comments"'), 'fallback sheet has the same scoped rules');
    delete document.documentElement.dataset.songCommentsTabIcon;
}

console.log('\nbutton');
{
    const ctx = await activateWith({ getSong: () => neteaseSong });
    eq(ctx.registrations.settingsSections.length, 1, 'settings section registered');
    eq(ctx.registrations.progressButtons.length, 1, 'progress button registered');
    eq(ctx.registrations.playerPanelTabs.length, 1, 'panel tab registered');
    const button = ctx.registrations.progressButtons[0];
    eq(button.slot, 'progress.trailing', 'button sits at the trailing end of the progress bar');
    eq(button.hideWhenCollapsed, true, 'button hides when the chrome collapses');
    ok(/svg/i.test(button.icon === undefined ? '' : String(button.icon)) === false, 'no bogus icon field');

    const hostElement = document.getElementById('button-host');
    const disposeButton = button.mount(hostElement, { getColors: () => ({ text: '#ffffff' }) });
    const element = hostElement.querySelector('button');
    ok(element !== null, 'button element mounted');
    eq(element.querySelectorAll('svg').length, 1, 'button draws one icon');
    element.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    eq(ctx.opened[0], 'song-comments', 'clicking opens the song-comments panel tab');
    disposeButton();
    eq(hostElement.children.length, 0, 'button unmounts clean');
    ctx.disposer?.();
}

console.log('\npanel (NetEase track)');
{
    const state = { song: neteaseSong };
    const ctx = await activateWith({ getSong: () => state.song });
    const tab = ctx.registrations.playerPanelTabs[0];
    eq(tab.label['zh-CN'], '评论', 'tab label is 评论');
    const hostElement = document.getElementById('panel-host');
    hostElement.innerHTML = '';
    const disposePanel = tab.mount(hostElement, { locale: 'zh-CN' });
    await flush(40);

    const first = ctx.calls[0];
    eq(first.providerId, 'netease', 'asked NetEase');
    eq(first.endpoint, 'comment_hot', 'asked for the hot comments first');
    eq(first.params.id, '1901371647', 'asked for the playing track id');
    eq(first.params.limit, 20, 'page size defaults to 20');
    eq(first.params.type, 0, 'hot comments are asked with type 0 (song)');

    const root = hostElement.querySelector('.sc-root');
    ok(root !== null, 'panel root mounted');
    eq(root.querySelector('.sc-song').textContent, '测试歌曲', 'header shows the title');
    eq(root.querySelectorAll('.sc-item').length, 2, 'two hot comments rendered');
    ok(/1234/.test(root.querySelector('.sc-count').textContent), 'header shows the comment count');
    ok(/来自网易云音乐/.test(root.querySelector('.sc-match').textContent), 'exact match is labelled');
    ok(root.querySelector('.sc-like') !== null, 'like counts render');
    ok(root.querySelector('[data-act="all"]') !== null, 'hot view offers a way into the full list');

    // 「查看全部评论」和「最新」页签走的是同一条切换路径，这里用前者验证。
    const allButton = root.querySelector('[data-act="all"]');
    allButton.dispatchEvent(new window.MouseEvent('click', { bubbles: true }));
    await flush(40);
    const last = ctx.calls[ctx.calls.length - 1];
    eq(last.endpoint, 'comment_music', 'switching to 最新 asks for the full comment list');
    eq(root.querySelectorAll('.sc-item').length, 1, 'newest list rendered');
    ok(root.querySelector('.sc-tab.is-on').dataset.tab === 'new', 'active tab highlight follows');
    ok(root.querySelector('[data-tab="new"]') !== null, 'the 最新 tab is still there');

    state.song = { ...neteaseSong, id: '42', title: '另一首', sourceRef: { kind: 'online', providerId: 'netease', mediaId: '42' } };
    ctx.listeners.get('playback.songChanged')?.();
    await flush(40);
    eq(ctx.calls[ctx.calls.length - 1].params.id, '42', 'song change refetches for the new track');
    eq(root.querySelector('.sc-song').textContent, '另一首', 'header follows the song change');

    disposePanel();
    eq(hostElement.children.length, 0, 'panel unmounts clean');
    const before = ctx.calls.length;
    ctx.listeners.get('playback.songChanged')?.();
    await flush(40);
    eq(ctx.calls.length, before, 'no requests after dispose');
    ctx.disposer?.();
}

console.log('\npanel (QQ Music track, matched by title)');
{
    const ctx = await activateWith({ getSong: () => qqSong });
    const tab = ctx.registrations.playerPanelTabs[0];
    const hostElement = document.getElementById('panel-host');
    hostElement.innerHTML = '';
    const disposePanel = tab.mount(hostElement, { locale: 'zh-CN' });
    await flush(60);

    eq(ctx.calls[0].endpoint, 'search', 'searches NetEase when the track has no NetEase id');
    eq(ctx.calls[0].params.keywords, '测试歌曲 歌手A', 'search keywords are title + artist');
    const commentCall = ctx.calls.find((call) => call.endpoint === 'comment_hot');
    eq(commentCall.params.id, '999', 'comments are asked for the matched NetEase id');

    const root = hostElement.querySelector('.sc-root');
    ok(/按歌名匹配到/.test(root.querySelector('.sc-match').textContent), 'matched track is labelled as a match');
    ok(root.querySelector('[data-act="rematch"]') !== null, 'a re-match button is offered');

    disposePanel();
    ctx.disposer?.();
}

console.log('\npanel (no NetEase version, matching off)');
{
    const ctx = await activateWith({ getSong: () => qqSong, settings: { matchBySearch: false } });
    const tab = ctx.registrations.playerPanelTabs[0];
    const hostElement = document.getElementById('panel-host');
    hostElement.innerHTML = '';
    const disposePanel = tab.mount(hostElement, { locale: 'zh-CN' });
    await flush(60);

    eq(ctx.calls.length, 0, 'no request when matching is turned off');
    const text = hostElement.querySelector('.sc-state').textContent;
    ok(/关着/.test(text), 'says the title-matching switch is off');
    ok(/不会去网易云找版本/.test(text), 'explains why there are no comments');
    disposePanel();
    ctx.disposer?.();
}

console.log('\npanel (permission error)');
{
    const built = makeHost({ getSong: () => neteaseSong, reply: replyFor });
    built.host.experimental['platform.raw'].request = async () => {
        const error = new Error('permission-denied:platform.netease.read');
        error.code = 'permission-denied:platform.netease.read';
        throw error;
    };
    const module = await import(pathToFileURL(CLIENT).href);
    module.default(built.host);
    const tab = built.registrations.playerPanelTabs[0];
    const hostElement = document.getElementById('panel-host');
    hostElement.innerHTML = '';
    const disposePanel = tab.mount(hostElement, { locale: 'zh-CN' });
    await flush(60);
    const state = hostElement.querySelector('.sc-state.is-err');
    ok(state !== null, 'error state rendered');
    ok(/权限/.test(state.textContent), 'permission failure is explained in plain words');
    ok(state.querySelector('[data-act="refresh"]') !== null, 'error state offers a retry');
    disposePanel();
}

console.log('\npanel (hot comments fall back when the endpoint misbehaves)');
{
    // A. comment_hot 抛错 → 用 comment_music 自带的 hotComments
    const throwing = makeHost({
        getSong: () => neteaseSong,
        reply: (endpoint) => {
            if (endpoint === 'comment_hot') {
                const error = new Error('boom');
                error.code = 'unavailable';
                throw error;
            }
            if (endpoint === 'comment_music') {
                return { total: 88, hotComments: [commentBody(500, '降级拿到的热门')], comments: [commentBody(9, '普通评论')] };
            }
            return {};
        },
    });
    const modA = await import(pathToFileURL(CLIENT).href);
    modA.default(throwing.host);
    const tabA = throwing.registrations.playerPanelTabs[0];
    const hostA = document.getElementById('panel-host');
    hostA.innerHTML = '';
    const disposeA = tabA.mount(hostA, { locale: 'zh-CN' });
    await flush(80);
    const itemsA = hostA.querySelectorAll('.sc-item');
    eq(itemsA.length, 1, 'falls back to the hotComments carried by comment_music');
    ok(/降级拿到的热门/.test(itemsA[0].textContent), 'the fallback list is the hot one, not the newest');
    ok(throwing.calls.some((call) => call.endpoint === 'comment_music'), 'the fallback really hit comment_music');
    ok(hostA.querySelector('.sc-state.is-err') === null, 'no error state when the fallback works');
    disposeA();

    // B. comment_hot 返回了不认识的形状 → 同样降级
    const odd = makeHost({
        getSong: () => neteaseSong,
        reply: (endpoint) => (endpoint === 'comment_hot'
            ? { code: 400, msg: '参数错误' }
            : { total: 12, comments: [commentBody(70, '赞最多的'), commentBody(3, '赞少的')] }),
    });
    const modB = await import(pathToFileURL(CLIENT).href);
    modB.default(odd.host);
    const tabB = odd.registrations.playerPanelTabs[0];
    const hostB = document.getElementById('panel-host');
    hostB.innerHTML = '';
    const disposeB = tabB.mount(hostB, { locale: 'zh-CN' });
    await flush(80);
    const itemsB = hostB.querySelectorAll('.sc-item');
    eq(itemsB.length, 2, 'unrecognised hot payload still shows comments');
    ok(/赞最多的/.test(itemsB[0].textContent), 'sorts by likes when only plain comments came back');
    disposeB();

    // C. comment_hot 把热门塞在 comments 里 → 直接用，不再多打一次
    const packed = makeHost({
        getSong: () => neteaseSong,
        reply: (endpoint) => (endpoint === 'comment_hot'
            ? { total: 30, comments: [commentBody(900, '塞在 comments 里的热门')] }
            : { total: 30, comments: [] }),
    });
    const modC = await import(pathToFileURL(CLIENT).href);
    modC.default(packed.host);
    const tabC = packed.registrations.playerPanelTabs[0];
    const hostC = document.getElementById('panel-host');
    hostC.innerHTML = '';
    const disposeC = tabC.mount(hostC, { locale: 'zh-CN' });
    await flush(80);
    ok(/塞在 comments 里的热门/.test(hostC.querySelector('.sc-item').textContent), 'hot payload under comments is used as-is');
    eq(packed.calls.filter((call) => call.endpoint === 'comment_music').length, 0, 'no extra request when the hot payload is usable');
    disposeC();
}

console.log('\npanel (empty comment list)');
{
    const built = makeHost({
        getSong: () => neteaseSong,
        reply: (endpoint) => (endpoint === 'comment_hot' ? { total: 0, hotComments: [] } : { total: 0, comments: [] }),
    });
    const module = await import(pathToFileURL(CLIENT).href);
    module.default(built.host);
    const tab = built.registrations.playerPanelTabs[0];
    const hostElement = document.getElementById('panel-host');
    hostElement.innerHTML = '';
    const disposePanel = tab.mount(hostElement, { locale: 'zh-CN' });
    await flush(60);
    ok(/热门评论/.test(hostElement.querySelector('.sc-state').textContent), 'empty hot list points at 最新');
    disposePanel();
}

console.log('panel (0.8.0 DTO: NetEase track, id is the provider id)');
{
    // 0.8.0 的公开 DTO：{ id, title, artist, album, source, ref }，没有 sourceRef。
    const song = {
        id: '1901371647',
        title: '测试歌曲',
        artist: '歌手A',
        album: '测试专辑',
        source: 'netease',
        ref: 'song-c9',
    };
    const built = makeHost({ getSong: () => song, reply: replyFor });
    built.host.host = { folium: { major: 1, minor: 10 }, folia: '0.8.0' };
    const module = await import(pathToFileURL(CLIENT).href);
    module.default(built.host);
    const tab = built.registrations.playerPanelTabs[0];
    const hostElement = document.getElementById('panel-host');
    hostElement.innerHTML = '';
    const disposePanel = tab.mount(hostElement, { locale: 'zh-CN' });
    await flush(60);

    const commentCall = built.calls.find((call) => call.endpoint === 'comment_hot');
    ok(commentCall !== undefined, 'asks for comments');
    eq(commentCall.params.id, '1901371647', 'uses the provider-native id from the 0.8 DTO');
    eq(built.calls.filter((call) => call.endpoint === 'search').length, 0, 'a NetEase track needs no search');
    const root = hostElement.querySelector('.sc-root');
    ok(/来自网易云音乐/.test(root.querySelector('.sc-match').textContent), 'labelled as a direct hit');
    eq(root.querySelector('.sc-artist').textContent, '歌手A · 测试专辑', 'artist + album read from the flat 0.8 fields');
    disposePanel();
}

console.log('panel (0.8.0 DTO: QQ track, provider id must not be used as a NetEase id)');
{
    const song = { id: '97773', title: '测试歌曲', artist: '歌手A', album: '测试专辑', source: 'qq', ref: 'song-c1' };
    const built = makeHost({ getSong: () => song, reply: replyFor });
    built.host.host = { folium: { major: 1, minor: 10 }, folia: '0.8.0' };
    const module = await import(pathToFileURL(CLIENT).href);
    module.default(built.host);
    const tab = built.registrations.playerPanelTabs[0];
    const hostElement = document.getElementById('panel-host');
    hostElement.innerHTML = '';
    const disposePanel = tab.mount(hostElement, { locale: 'zh-CN' });
    await flush(60);

    eq(built.calls[0].endpoint, 'search', 'searches by title when the track is not NetEase');
    eq(built.calls[0].params.keywords, '测试歌曲 歌手A', 'keywords come from the flat artist field');
    const commentCall = built.calls.find((call) => call.endpoint === 'comment_hot');
    eq(commentCall.params.id, '999', 'asks for the matched NetEase id');
    ok(
        built.calls.every((call) => call.params.id !== '97773'),
        'never passes the QQ song id to a NetEase endpoint'
    );
    ok(/按歌名匹配到/.test(hostElement.querySelector('.sc-match').textContent), 'match is labelled');
    disposePanel();
}

console.log('panel (0.8.0 DTO: NetEase track with a non-numeric id)');
{
    // 万一宿主把 id 换成了内部令牌，也不能拿它去查评论——退回歌名检索。
    const song = { id: 'song-c9', title: '测试歌曲', artist: '歌手A', album: null, source: 'netease', ref: 'song-c9' };
    const built = makeHost({ getSong: () => song, reply: replyFor });
    const module = await import(pathToFileURL(CLIENT).href);
    module.default(built.host);
    const tab = built.registrations.playerPanelTabs[0];
    const hostElement = document.getElementById('panel-host');
    hostElement.innerHTML = '';
    const disposePanel = tab.mount(hostElement, { locale: 'zh-CN' });
    await flush(60);
    eq(built.calls[0].endpoint, 'search', 'falls back to search instead of trusting a non-numeric id');
    disposePanel();
}

console.log('panel (no match: the source platform is named)');
{
    const song = { id: '97773', title: '孤勇者', artist: '陈奕迅', album: '', source: 'qq', ref: 'song-c2' };
    const built = makeHost({
        getSong: () => song,
        reply: (endpoint) => (endpoint === 'search' ? { result: { songs: [] } } : {}),
    });
    const module = await import(pathToFileURL(CLIENT).href);
    module.default(built.host);
    const tab = built.registrations.playerPanelTabs[0];
    const hostElement = document.getElementById('panel-host');
    hostElement.innerHTML = '';
    const disposePanel = tab.mount(hostElement, { locale: 'zh-CN' });
    await flush(60);
    const state = hostElement.querySelector('.sc-state');
    ok(state !== null, 'empty state rendered');
    ok(/孤勇者/.test(state.textContent), 'names the track that had no version');
    ok(/QQ 音乐/.test(state.textContent), 'says which platform the track came from');
    disposePanel();
}

console.log(failures === 0 ? '\nall checks passed' : `\n${failures} check(s) failed`);
process.exit(failures === 0 ? 0 : 1);

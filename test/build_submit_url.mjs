// 生成 folium-compound「模组提交」表单的预填链接。
// 表单字段来自 .github/ISSUE_TEMPLATE/mod-submission.yml；
// 截图与「确认」三项无法预填（上传框 / 复选框），必须手动处理。
const BASE = 'https://github.com/chthollyphile/folium-compound/issues/new';

const title = '[模组提交] 歌曲评论 song-comments';

const description = [
  '播放页进度条尾部的评论按钮点开后，播放器侧栏出现「评论」页签，显示当前这首歌在网易云音乐的评论。',
  '',
  '功能：热门 / 最新两个视图（热门只有一屏，底部给「查看全部评论」跳最新）；最新分页加载，滚到底点「加载更多」；正文超过 150 字折叠，可展开/收起；显示点赞数与相对时间；被回复的内容以引用块呈现。',
  '',
  '曲目来源：来自网易云的曲目直接用 sourceRef.mediaId 精确查询；本地文件、QQ 音乐、Spotify、酷狗等没有网易云 id 的曲目，按「歌名 + 歌手」检索一次并取标题与歌手最接近的一首，面板顶部会写明这是匹配结果并给「重新匹配」，设置里可整体关闭（关闭后这些曲目不发任何检索请求）。',
  '',
  '状态区分：没有播放中的歌曲、曲目没有网易云版本、没有热门评论、还没有人评论、权限被拒、账号未登录、请求过于频繁、网络失败，各有不同文案与重试入口，不会一句「加载失败」。',
  '',
  '设置项：每页评论条数（5–50）、非网易云曲目是否按歌名匹配、是否显示评论者头像。',
  '',
  '面板高度按宿主滚动容器的可视高度钉住（模组挂在 shadow root 里，宿主的页签容器只保证宽度），因此列表可以正常内滚，不会出现内容被裁掉且滑不动。',
].join('\n');

const permissions = [
  'platform.netease.read —— 读取网易云评论与检索结果，走用户自己在 Folia 里登录的网易云会话。宿主没有提供评论相关的 typed API，评论只能通过 platform.raw 的 comment_hot / comment_music / search 三个端点取得；三个端点都是 read 权限。',
  '',
  'experimental: ["platform.raw"] —— manifest 校验强制要求：声明 platform.<id>.read 时必须同时声明该实验项。',
  '',
  '没有声明 platform.netease.write，代码里也没有任何写端点：不点赞、不发表评论、不修改歌单、不写任何账号数据。没有声明 embedOrigins，不使用 net.fetch 以外的网络能力，不注入全局样式，不改宿主 DOM。',
  '',
  '隐私：开启「按歌名匹配」且当前曲目本身没有网易云 id 时，会把该曲目的歌名与歌手名发给网易云用于检索；结果只存在内存里，不落盘、不上传。该行为可在设置中关闭。',
].join('\n');

const params = new URLSearchParams({
  template: 'mod-submission.yml',
  title,
  'mod-id': 'song-comments',
  repository: 'https://github.com/Zhangyx0824/folia-mod-song-comments',
  ref: 'v1.0.2',
  path: 'song-comments',
  channel: '正式发布 / Release',
  description,
  permissions,
  license: 'MIT',
});

console.log(BASE + '?' + params.toString());

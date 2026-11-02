# 上架提交 · 歌曲评论 song-comments

## 当前状态

| 项 | 状态 |
|---|---|
| 本地仓库 `~/folia-mod-song-comments` | ✅ 已 `git init`，1 个提交 `f00fece`，tag **v1.0.2**，remote 已指向 SSH |
| 远端仓库 `Zhangyx0824/folia-mod-song-comments` | ⛔ **不存在**。集成令牌无建仓权限（`POST /user/repos` → 403 `Resource not accessible by integration`），`gh` CLI 也未安装；SSH 鉴权本身正常（`ssh -T` 返回 `Hi Zhangyx0824!`） |
| 冒烟测试 | ✅ 全绿（67 项断言） |
| 提交表单 | ⏳ 待第 1 步完成后打开预填链接 |

---

## 一、第 1 步：建空仓（约 30 秒，只能你点）

打开 <https://github.com/new>，填：

- **Repository name**：`folia-mod-song-comments`
- **Visibility**：**Public**（CI 要公开拉取源码，私有仓会检查失败）
- **不要**勾 Add a README / .gitignore / license——留空仓

> 如果弹出的页面里 `Zhangyx0824` 名下已有同名仓，直接跳过这步。

建好后告诉我一句「建好了」，我把 `main` 和 `v1.0.2` 推上去并核对 tag 指向。你也可以自己跑：

```bash
cd ~/folia-mod-song-comments && git push -u origin main && git push origin v1.0.2
```

远端分支必须是 `main`（本地已是），tag 必须是 `v1.0.2`——表单里 `ref` 填的就是它，CI 认的是这个 tag 当时指向的 commit。

---

## 二、第 2 步：打开预填表单，只补截图和三个勾

链接（整行复制到地址栏；模组 id、仓库、版本、目录、渠道、说明、权限、许可证、标题都已预填）：

```
https://github.com/chthollyphile/folium-compound/issues/new?template=mod-submission.yml&title=%5B%E6%A8%A1%E7%BB%84%E6%8F%90%E4%BA%A4%5D%20%E6%AD%8C%E6%9B%B2%E8%AF%84%E8%AE%BA%20song-comments&mod-id=song-comments&repository=https%3A%2F%2Fgithub.com%2FZhangyx0824%2Ffolia-mod-song-comments&ref=v1.0.2&path=song-comments&channel=%E6%AD%A3%E5%BC%8F%E5%8F%91%E5%B8%83%20%2F%20Release&description=%E6%92%AD%E6%94%BE%E9%A1%B5%E8%BF%9B%E5%BA%A6%E6%9D%A1%E5%B0%BE%E9%83%A8%E7%9A%84%E8%AF%84%E8%AE%BA%E6%8C%89%E9%92%AE%E7%82%B9%E5%BC%80%E5%90%8E%EF%BC%8C%E6%92%AD%E6%94%BE%E5%99%A8%E4%BE%A7%E6%A0%8F%E5%87%BA%E7%8E%B0%E3%80%8C%E8%AF%84%E8%AE%BA%E3%80%8D%E9%A1%B5%E7%AD%BE%EF%BC%8C%E6%98%BE%E7%A4%BA%E5%BD%93%E5%89%8D%E8%BF%99%E9%A6%96%E6%AD%8C%E5%9C%A8%E7%BD%91%E6%98%93%E4%BA%91%E9%9F%B3%E4%B9%90%E7%9A%84%E8%AF%84%E8%AE%BA%E3%80%82%0A%0A%E5%8A%9F%E8%83%BD%EF%BC%9A%E7%83%AD%E9%97%A8%20%2F%20%E6%9C%80%E6%96%B0%E4%B8%A4%E4%B8%AA%E8%A7%86%E5%9B%BE%EF%BC%88%E7%83%AD%E9%97%A8%E5%8F%AA%E6%9C%89%E4%B8%80%E5%B1%8F%EF%BC%8C%E5%BA%95%E9%83%A8%E7%BB%99%E3%80%8C%E6%9F%A5%E7%9C%8B%E5%85%A8%E9%83%A8%E8%AF%84%E8%AE%BA%E3%80%8D%E8%B7%B3%E6%9C%80%E6%96%B0%EF%BC%89%EF%BC%9B%E6%9C%80%E6%96%B0%E5%88%86%E9%A1%B5%E5%8A%A0%E8%BD%BD%EF%BC%8C%E6%BB%9A%E5%88%B0%E5%BA%95%E7%82%B9%E3%80%8C%E5%8A%A0%E8%BD%BD%E6%9B%B4%E5%A4%9A%E3%80%8D%EF%BC%9B%E6%AD%A3%E6%96%87%E8%B6%85%E8%BF%87%20150%20%E5%AD%97%E6%8A%98%E5%8F%A0%EF%BC%8C%E5%8F%AF%E5%B1%95%E5%BC%80%2F%E6%94%B6%E8%B5%B7%EF%BC%9B%E6%98%BE%E7%A4%BA%E7%82%B9%E8%B5%9E%E6%95%B0%E4%B8%8E%E7%9B%B8%E5%AF%B9%E6%97%B6%E9%97%B4%EF%BC%9B%E8%A2%AB%E5%9B%9E%E5%A4%8D%E7%9A%84%E5%86%85%E5%AE%B9%E4%BB%A5%E5%BC%95%E7%94%A8%E5%9D%97%E5%91%88%E7%8E%B0%E3%80%82%0A%0A%E6%9B%B2%E7%9B%AE%E6%9D%A5%E6%BA%90%EF%BC%9A%E6%9D%A5%E8%87%AA%E7%BD%91%E6%98%93%E4%BA%91%E7%9A%84%E6%9B%B2%E7%9B%AE%E7%9B%B4%E6%8E%A5%E7%94%A8%20sourceRef.mediaId%20%E7%B2%BE%E7%A1%AE%E6%9F%A5%E8%AF%A2%EF%BC%9B%E6%9C%AC%E5%9C%B0%E6%96%87%E4%BB%B6%E3%80%81QQ%20%E9%9F%B3%E4%B9%90%E3%80%81Spotify%E3%80%81%E9%85%B7%E7%8B%97%E7%AD%89%E6%B2%A1%E6%9C%89%E7%BD%91%E6%98%93%E4%BA%91%20id%20%E7%9A%84%E6%9B%B2%E7%9B%AE%EF%BC%8C%E6%8C%89%E3%80%8C%E6%AD%8C%E5%90%8D%20%2B%20%E6%AD%8C%E6%89%8B%E3%80%8D%E6%A3%80%E7%B4%A2%E4%B8%80%E6%AC%A1%E5%B9%B6%E5%8F%96%E6%A0%87%E9%A2%98%E4%B8%8E%E6%AD%8C%E6%89%8B%E6%9C%80%E6%8E%A5%E8%BF%91%E7%9A%84%E4%B8%80%E9%A6%96%EF%BC%8C%E9%9D%A2%E6%9D%BF%E9%A1%B6%E9%83%A8%E4%BC%9A%E5%86%99%E6%98%8E%E8%BF%99%E6%98%AF%E5%8C%B9%E9%85%8D%E7%BB%93%E6%9E%9C%E5%B9%B6%E7%BB%99%E3%80%8C%E9%87%8D%E6%96%B0%E5%8C%B9%E9%85%8D%E3%80%8D%EF%BC%8C%E8%AE%BE%E7%BD%AE%E9%87%8C%E5%8F%AF%E6%95%B4%E4%BD%93%E5%85%B3%E9%97%AD%EF%BC%88%E5%85%B3%E9%97%AD%E5%90%8E%E8%BF%99%E4%BA%9B%E6%9B%B2%E7%9B%AE%E4%B8%8D%E5%8F%91%E4%BB%BB%E4%BD%95%E6%A3%80%E7%B4%A2%E8%AF%B7%E6%B1%82%EF%BC%89%E3%80%82%0A%0A%E7%8A%B6%E6%80%81%E5%8C%BA%E5%88%86%EF%BC%9A%E6%B2%A1%E6%9C%89%E6%92%AD%E6%94%BE%E4%B8%AD%E7%9A%84%E6%AD%8C%E6%9B%B2%E3%80%81%E6%9B%B2%E7%9B%AE%E6%B2%A1%E6%9C%89%E7%BD%91%E6%98%93%E4%BA%91%E7%89%88%E6%9C%AC%E3%80%81%E6%B2%A1%E6%9C%89%E7%83%AD%E9%97%A8%E8%AF%84%E8%AE%BA%E3%80%81%E8%BF%98%E6%B2%A1%E6%9C%89%E4%BA%BA%E8%AF%84%E8%AE%BA%E3%80%81%E6%9D%83%E9%99%90%E8%A2%AB%E6%8B%92%E3%80%81%E8%B4%A6%E5%8F%B7%E6%9C%AA%E7%99%BB%E5%BD%95%E3%80%81%E8%AF%B7%E6%B1%82%E8%BF%87%E4%BA%8E%E9%A2%91%E7%B9%81%E3%80%81%E7%BD%91%E7%BB%9C%E5%A4%B1%E8%B4%A5%EF%BC%8C%E5%90%84%E6%9C%89%E4%B8%8D%E5%90%8C%E6%96%87%E6%A1%88%E4%B8%8E%E9%87%8D%E8%AF%95%E5%85%A5%E5%8F%A3%EF%BC%8C%E4%B8%8D%E4%BC%9A%E4%B8%80%E5%8F%A5%E3%80%8C%E5%8A%A0%E8%BD%BD%E5%A4%B1%E8%B4%A5%E3%80%8D%E3%80%82%0A%0A%E8%AE%BE%E7%BD%AE%E9%A1%B9%EF%BC%9A%E6%AF%8F%E9%A1%B5%E8%AF%84%E8%AE%BA%E6%9D%A1%E6%95%B0%EF%BC%885%E2%80%9350%EF%BC%89%E3%80%81%E9%9D%9E%E7%BD%91%E6%98%93%E4%BA%91%E6%9B%B2%E7%9B%AE%E6%98%AF%E5%90%A6%E6%8C%89%E6%AD%8C%E5%90%8D%E5%8C%B9%E9%85%8D%E3%80%81%E6%98%AF%E5%90%A6%E6%98%BE%E7%A4%BA%E8%AF%84%E8%AE%BA%E8%80%85%E5%A4%B4%E5%83%8F%E3%80%82%0A%0A%E9%9D%A2%E6%9D%BF%E9%AB%98%E5%BA%A6%E6%8C%89%E5%AE%BF%E4%B8%BB%E6%BB%9A%E5%8A%A8%E5%AE%B9%E5%99%A8%E7%9A%84%E5%8F%AF%E8%A7%86%E9%AB%98%E5%BA%A6%E9%92%89%E4%BD%8F%EF%BC%88%E6%A8%A1%E7%BB%84%E6%8C%82%E5%9C%A8%20shadow%20root%20%E9%87%8C%EF%BC%8C%E5%AE%BF%E4%B8%BB%E7%9A%84%E9%A1%B5%E7%AD%BE%E5%AE%B9%E5%99%A8%E5%8F%AA%E4%BF%9D%E8%AF%81%E5%AE%BD%E5%BA%A6%EF%BC%89%EF%BC%8C%E5%9B%A0%E6%AD%A4%E5%88%97%E8%A1%A8%E5%8F%AF%E4%BB%A5%E6%AD%A3%E5%B8%B8%E5%86%85%E6%BB%9A%EF%BC%8C%E4%B8%8D%E4%BC%9A%E5%87%BA%E7%8E%B0%E5%86%85%E5%AE%B9%E8%A2%AB%E8%A3%81%E6%8E%89%E4%B8%94%E6%BB%91%E4%B8%8D%E5%8A%A8%E3%80%82&permissions=platform.netease.read%20%E2%80%94%E2%80%94%20%E8%AF%BB%E5%8F%96%E7%BD%91%E6%98%93%E4%BA%91%E8%AF%84%E8%AE%BA%E4%B8%8E%E6%A3%80%E7%B4%A2%E7%BB%93%E6%9E%9C%EF%BC%8C%E8%B5%B0%E7%94%A8%E6%88%B7%E8%87%AA%E5%B7%B1%E5%9C%A8%20Folia%20%E9%87%8C%E7%99%BB%E5%BD%95%E7%9A%84%E7%BD%91%E6%98%93%E4%BA%91%E4%BC%9A%E8%AF%9D%E3%80%82%E5%AE%BF%E4%B8%BB%E6%B2%A1%E6%9C%89%E6%8F%90%E4%BE%9B%E8%AF%84%E8%AE%BA%E7%9B%B8%E5%85%B3%E7%9A%84%20typed%20API%EF%BC%8C%E8%AF%84%E8%AE%BA%E5%8F%AA%E8%83%BD%E9%80%9A%E8%BF%87%20platform.raw%20%E7%9A%84%20comment_hot%20%2F%20comment_music%20%2F%20search%20%E4%B8%89%E4%B8%AA%E7%AB%AF%E7%82%B9%E5%8F%96%E5%BE%97%EF%BC%9B%E4%B8%89%E4%B8%AA%E7%AB%AF%E7%82%B9%E9%83%BD%E6%98%AF%20read%20%E6%9D%83%E9%99%90%E3%80%82%0A%0Aexperimental%3A%20%5B%22platform.raw%22%5D%20%E2%80%94%E2%80%94%20manifest%20%E6%A0%A1%E9%AA%8C%E5%BC%BA%E5%88%B6%E8%A6%81%E6%B1%82%EF%BC%9A%E5%A3%B0%E6%98%8E%20platform.%3Cid%3E.read%20%E6%97%B6%E5%BF%85%E9%A1%BB%E5%90%8C%E6%97%B6%E5%A3%B0%E6%98%8E%E8%AF%A5%E5%AE%9E%E9%AA%8C%E9%A1%B9%E3%80%82%0A%0A%E6%B2%A1%E6%9C%89%E5%A3%B0%E6%98%8E%20platform.netease.write%EF%BC%8C%E4%BB%A3%E7%A0%81%E9%87%8C%E4%B9%9F%E6%B2%A1%E6%9C%89%E4%BB%BB%E4%BD%95%E5%86%99%E7%AB%AF%E7%82%B9%EF%BC%9A%E4%B8%8D%E7%82%B9%E8%B5%9E%E3%80%81%E4%B8%8D%E5%8F%91%E8%A1%A8%E8%AF%84%E8%AE%BA%E3%80%81%E4%B8%8D%E4%BF%AE%E6%94%B9%E6%AD%8C%E5%8D%95%E3%80%81%E4%B8%8D%E5%86%99%E4%BB%BB%E4%BD%95%E8%B4%A6%E5%8F%B7%E6%95%B0%E6%8D%AE%E3%80%82%E6%B2%A1%E6%9C%89%E5%A3%B0%E6%98%8E%20embedOrigins%EF%BC%8C%E4%B8%8D%E4%BD%BF%E7%94%A8%20net.fetch%20%E4%BB%A5%E5%A4%96%E7%9A%84%E7%BD%91%E7%BB%9C%E8%83%BD%E5%8A%9B%EF%BC%8C%E4%B8%8D%E6%B3%A8%E5%85%A5%E5%85%A8%E5%B1%80%E6%A0%B7%E5%BC%8F%EF%BC%8C%E4%B8%8D%E6%94%B9%E5%AE%BF%E4%B8%BB%20DOM%E3%80%82%0A%0A%E9%9A%90%E7%A7%81%EF%BC%9A%E5%BC%80%E5%90%AF%E3%80%8C%E6%8C%89%E6%AD%8C%E5%90%8D%E5%8C%B9%E9%85%8D%E3%80%8D%E4%B8%94%E5%BD%93%E5%89%8D%E6%9B%B2%E7%9B%AE%E6%9C%AC%E8%BA%AB%E6%B2%A1%E6%9C%89%E7%BD%91%E6%98%93%E4%BA%91%20id%20%E6%97%B6%EF%BC%8C%E4%BC%9A%E6%8A%8A%E8%AF%A5%E6%9B%B2%E7%9B%AE%E7%9A%84%E6%AD%8C%E5%90%8D%E4%B8%8E%E6%AD%8C%E6%89%8B%E5%90%8D%E5%8F%91%E7%BB%99%E7%BD%91%E6%98%93%E4%BA%91%E7%94%A8%E4%BA%8E%E6%A3%80%E7%B4%A2%EF%BC%9B%E7%BB%93%E6%9E%9C%E5%8F%AA%E5%AD%98%E5%9C%A8%E5%86%85%E5%AD%98%E9%87%8C%EF%BC%8C%E4%B8%8D%E8%90%BD%E7%9B%98%E3%80%81%E4%B8%8D%E4%B8%8A%E4%BC%A0%E3%80%82%E8%AF%A5%E8%A1%8C%E4%B8%BA%E5%8F%AF%E5%9C%A8%E8%AE%BE%E7%BD%AE%E4%B8%AD%E5%85%B3%E9%97%AD%E3%80%82&license=MIT
```

打开后还需要你补两处（表单的这两栏预填不了）：

1. **运行截图 / Screenshot** —— 把图**直接拖进那个框**（外部链接 CI 不认，必须是 `github.com/user-attachments/...` 形式的附件）。
2. **确认 / Confirmations** —— 勾三个勾。

其余栏要是空的，照下面第三节抄。

> 预填链接失效或想改文案：`node test/build_submit_url.mjs` 会重新生成整条链接。
> **同一个模组只开一个提交 issue**；要改内容请编辑原 issue，别重开。

---

## 三、运行截图怎么拍（Folia 现在就在跑）

CI 硬性要求「模组在对应版本的 Folia 里正常运行」的截图，且截图里最好能看到版本号。建议这么拍：

1. 在 Folia 里播放一首**网易云来源**的歌（这样顶部显示「来自网易云音乐」，比匹配结果更有说服力）；
2. 点进度条右侧的评论按钮，侧栏切到「评论」，让热门列表有内容；
3. `⌘⇧4` 再按 `空格`，点 Folia 窗口（整窗截图，带圆角阴影），存到桌面；
4. 顺手在回复里补一句版本，例如「Folia 0.7.21，播放页进度条评论按钮 → 侧栏评论页签」。

`song-comments/preview.jpg` **不能**代替运行截图——它是用真实模组代码渲染的商店介绍图，不是运行时截屏，拿它冒充被骗过去也不合适，而且 CI 只认 issue 里的上传附件。

---

## 四、表单各栏内容（预填失败时照抄）

| 栏位 | 内容 |
|---|---|
| 模组 id | `song-comments` |
| 源码仓库 | `https://github.com/Zhangyx0824/folia-mod-song-comments` |
| 版本 | `v1.0.2` |
| 模组目录 | `song-comments` |
| 发布渠道 | 正式发布 / Release |
| 许可证 | MIT |

模组说明、权限说明两栏的长文本在 `test/build_submit_url.mjs` 里（`description` / `permissions` 两个变量），改完重跑就得到新链接。

---

## 五、审核可能追问的点（答案备好）

- **为什么需要 `platform.netease.read`？** 评论只能通过网易云接口读取；宿主没有为评论提供 typed API，`platform.raw` 是唯一的正规入口，且 `comment_hot` / `comment_music` / `search` 三个端点都只要求 read 权限。
- **为什么声明 `platform.raw` 实验项？** manifest 校验强制：声明 `platform.<id>.read` 必须同时声明它。
- **会不会写用户账号？** 不会。没申请 write，代码里没有任何写端点。
- **歌名匹配是不是「瞎猜」？** 只在标题归一化后相等或互相包含、且没有人为拼接歌手名时才采用；面板顶部明示这是匹配结果并给「重新匹配」；用户可整体关闭，关闭后不发任何检索请求。
- **实验接口坏了会不会崩？** 不会。接口不存在 / 端点被拒 / 权限被拒 / 未登录 / 限流 / 网络失败各有文案与重试按钮，最差情况是面板显示不可用。

---

## 六、提交之后

1. CI 会回「格式检查通过」并列出将要签名的文件清单；
2. 维护者审查后评论 `/sign <commit>` → 签名、复制进 folium-compound、发布到模组市场，issue 自动关闭；
3. 14 天内格式检查未通过且无回应会被自动关闭；
4. 以后发新版走「模组更新」表单（`template=mod-update.yml`），不要重开提交 issue。

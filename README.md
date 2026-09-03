# 智显机器人AI训战中心

面向智显机器人代理商的产品学习、实战培训与销售赋能平台，汇集视频回放、PPT 回放与智能方案讲解。

## 本地运行

```bash
npm install
npm run dev
```

资源数据集中维护在 `src/data.js`：`recordings` 是会议视频回放，`presentationReplays` 是培训 PPT 回放，`presentations` 是智能方案讲解。管理员新增的生态视频和共享内容保存在 `public/shared-content.json`。

新增智能方案时在 `presentations` 中追加：

```js
{
  id: '唯一英文标识',
  title: '智能方案名称',
  url: 'https://方案访问链接',
  group: 'solution', // company | solution | case
  category: '细分标签',
  cover: 'assets/covers/封面文件.png',
}
```

页面会按“公司介绍 / 解决方案介绍 / 案例介绍”自动归档；标题和“打开方案”都会在新标签页打开对应链接。PPT 回放仍支持 `publishedAt`，并按时间从近到远展示。

## 全账号共享发布

`yinze1` 是平台超级管理员。超级管理员新增或删除方案、生态方案、会议视频和生态视频后，网站会把内容发布到 `public/shared-content.json`；GitHub Pages 完成部署后，其他 ZBrain 账号会自动读取同一份数据。

生态视频只保存视频链接和元数据，不上传本地视频文件。MP4、WebM、OGG、M3U8 等直接媒体地址可在站内播放；腾讯会议、云盘等网页地址会打开原始回放页面。生态方案的“生态伙伴 / 生态产品 / 联合解决方案”分类保持不变，生态视频拥有独立分类字段。

超级管理员可通过“内容排序”调整会议视频、会议 PPT、智能方案、生态方案和生态视频的顺序，排序结果也会写入共享数据并同步给所有账号。

首次使用时，以 `yinze1` 登录并打开“超级管理员 / 全账号共享”，配置只授权 `Rancho-Yin/zbrainlearning` 仓库且具备 `Contents: Read and write` 权限的 GitHub Fine-grained Token。令牌仅保存在当前标签页的 `sessionStorage`，不会写入源码或构建产物；关闭浏览器后需要重新配置。

仓库和 GitHub Pages 均为公开资源，因此共享文件中的方案名称、外部链接和视频链接也属于公开信息。需要严格保密的资料应迁移到受 ZBrain 登录保护的后端接口。

# 智显机器人AI训战中心

面向智显机器人代理商的产品学习、实战培训与销售赋能平台，汇集视频回放、PPT 回放与智能方案讲解。

## 本地运行

```bash
npm install
npm run dev
```

资源数据集中维护在 `src/data.js`：`recordings` 是视频回放，`presentationReplays` 是培训 PPT 回放，`presentations` 是智能方案讲解。新增智能方案时在 `presentations` 中追加：

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

页面中的“新增方案”可直接录入名称、网址和三类归档，并将内容保存在当前浏览器。由于 GitHub Pages 是静态网站，这类临时新增内容不会同步到其他设备；需要向所有访问者长期发布的方案，应继续维护在 `src/data.js` 并提交到仓库。

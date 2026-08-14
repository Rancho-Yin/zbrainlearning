# 智显机器人 AI 学习创新中心

面向智显机器人代理商的产品学习、实战培训与销售赋能平台，汇集 AI 训战营会议回放与 PPT 方案资料。

## 本地运行

```bash
npm install
npm run dev
```

会议与 PPT 数据集中维护在 `src/data.js`。新增 PPT 时在 `presentations` 数组中追加一项即可：

```js
{
  id: '唯一英文标识',
  title: 'PPT 方案名称',
  url: 'https://方案访问链接',
  category: '方案分类',
  cover: 'assets/covers/封面文件.png',
}
```

页面会自动生成方案窗口；标题和“打开方案”按钮都会在新标签页打开对应链接。

页面中的“新增方案”可直接录入名称、网址和分类，并将内容保存在当前浏览器。由于 GitHub Pages 是静态网站，这类临时新增内容不会同步到其他设备；需要向所有访问者长期发布的方案，应继续维护在 `src/data.js` 并提交到仓库。

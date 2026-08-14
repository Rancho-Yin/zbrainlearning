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
}
```

页面会自动生成方案窗口；标题和“打开方案”按钮都会在新标签页打开对应链接。

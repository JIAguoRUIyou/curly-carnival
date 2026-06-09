# Netlify 部署说明

这个版本已经包含联网搜索教材所需的 Netlify Functions：

- 前端页面：`index.html`、`styles.css`、`app.js`
- Netlify 配置：`netlify.toml`
- 联网搜索接口：`netlify/functions/search-books.mjs`

## 推荐方法：GitHub 连接 Netlify

这个方法最稳定，也适合你以后继续更新。

1. 新建一个 GitHub 仓库。
2. 把 `study-planner` 文件夹里的全部内容上传到仓库根目录。
3. 打开 Netlify，选择 Add new project。
4. 选择 Import an existing project。
5. 连接你的 GitHub 仓库。
6. 构建设置保持简单：
   - Build command：留空
   - Publish directory：`.`
   - Functions directory：`netlify/functions`
7. 点击 Deploy。

部署成功后，教材搜索会请求：

```text
https://你的网站域名/.netlify/functions/search-books?q=关键词
```

如果这个地址能返回 JSON，就说明联网搜索接口已经生效。

## 也可以用 Netlify CLI

适合你不想每次手动拖文件时使用。

1. 安装 Netlify CLI：

```bash
npm install -g netlify-cli
```

2. 进入网站文件夹：

```bash
cd study-planner
```

3. 本地预览 Functions：

```bash
netlify dev
```

4. 正式部署：

```bash
netlify deploy --prod
```

## 不推荐只用 Netlify Drop

Netlify Drop 很适合纯静态页面，但联网搜索教材需要 Functions。Functions 需要 Netlify 在部署时识别 `netlify/functions` 目录并打包接口。

如果你只拖拽上传后发现搜索教材失败，通常不是网站按钮坏了，而是 Functions 没有被部署出来。推荐改用 GitHub 连接 Netlify，或者使用 Netlify CLI 部署。

## 更新网站时怎么做

以后你让我改完网站后，只需要把这些文件一起更新到 GitHub：

- `index.html`
- `styles.css`
- `app.js`
- `netlify.toml`
- `netlify/functions/search-books.mjs`
- `assets/` 文件夹

GitHub 更新后，Netlify 会自动重新部署，原来的公开网址一般不变。

## 常见检查

如果页面能打开但搜索不能用，先检查：

1. Netlify 后台是否能看到 `search-books` 这个 Function。
2. 打开 `/.netlify/functions/search-books?q=英语` 是否返回 JSON。
3. 仓库根目录是否真的有 `netlify.toml`。
4. `netlify/functions/search-books.mjs` 是否一起上传了。
5. 如果你用了自定义域名，页面仍然会优先尝试 Netlify Function，不需要额外改代码。

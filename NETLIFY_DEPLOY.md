# Netlify 部署说明

当前版本是纯静态网站，已经移除了联网搜索教材栏目和 Netlify Functions。你可以直接用 Netlify Drop 分享给朋友。

## 最简单方法：Netlify Drop

1. 解压 `study-planner-netlify.zip`。
2. 打开 Netlify Drop。
3. 把解压后的文件夹内容拖进去，注意根目录里要能直接看到：
   - `index.html`
   - `styles.css`
   - `app.js`
   - `assets/`
4. 部署完成后，Netlify 会生成一个公开网址。

## 长期分享方法：GitHub 连接 Netlify

这个方法适合以后继续更新，网址一般不会变。

1. 新建一个 GitHub 仓库。
2. 把 `study-planner` 文件夹里的全部内容上传到仓库根目录。
3. 打开 Netlify，选择 Add new project。
4. 选择 Import an existing project。
5. 连接你的 GitHub 仓库。
6. 构建设置保持简单：
   - Build command：留空
   - Publish directory：`.`
7. 点击 Deploy。

以后更新时，只需要替换仓库里的这些文件：

- `index.html`
- `styles.css`
- `app.js`
- `netlify.toml`
- `assets/` 文件夹

## 关于个人数据

教材、记事本、复盘、打勾记录会保存在浏览器本地 `localStorage` 里。你更新网站文件不会自动清空这些数据，但如果换浏览器、换设备、清理浏览器数据，原来的记录就不会跟着过去。

## 当前教材搜索方式

当前版本不再联网搜索教材，只保留“搜索已添加教材”。如果要新增教材，在“教材库与计划”里手动创建，系统会生成可编辑章节模板，并且会阻止重复添加同名教材。

# 三角洲行动｜烽火地带改枪码库

这是一个纯静态分享网页，用来按枪械类型查看“烽火地带”改枪方案，并一键复制改枪码。

## 文件结构

```text
delta-gunsmith-codes/
  index.html
  style.css
  script.js
  README.md
  sample-data.csv
```

## Google Sheets 表格怎么建

新建一个 Google Sheets 表格，第一行字段名必须是：

```text
id,gun_type,weapon,build_name,code,note,tags,sort,enabled,updated_at
```

字段说明：

- `id`：唯一编号，例如 `001`。
- `gun_type`：枪械类型，例如 `突击步枪`。
- `weapon`：枪名，例如 `M4A1`。
- `build_name`：方案名，页面会重点展示。
- `code`：改枪码，点击复制时只复制这个字段。
- `note`：简短备注，可以为空。
- `tags`：标签，用中文逗号或英文逗号分隔，例如 `低成本,稳定,新手`。
- `sort`：排序数字，越小越靠前；为空时默认 `9999`。
- `enabled`：是否显示，填 `是` 才显示。也支持 `yes`、`true`、`1`。
- `updated_at`：更新时间，例如 `2026-05-17`。

可以先把 `sample-data.csv` 的内容复制到表格里作为模板。

## 发布为 CSV 链接

1. 打开你的 Google Sheets 表格。
2. 点击菜单：`文件` -> `共享` -> `发布到网络`。
3. 在弹窗里选择要发布的工作表。
4. 格式选择 `逗号分隔值 (.csv)`。
5. 点击发布。
6. 复制生成的 CSV 链接。

注意：发布到网络的数据是公开可读取的，不要在表格里放私人信息、账号、手机号或任何不想公开的内容。

## 把 CSV 链接填到网页

打开 `script.js`，找到最顶部这一行：

```js
const GOOGLE_SHEET_CSV_URL = "这里粘贴我的 Google Sheets CSV 链接";
```

把引号里的文字换成你的 CSV 链接，例如：

```js
const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/e/xxxx/pub?gid=0&single=true&output=csv";
```

保存后刷新网页。页面会优先读取 Google Sheets CSV；如果读取失败，会自动使用 `script.js` 里的 `fallbackData`，并显示“在线数据加载失败，已使用本地备用数据”。

## 添加新改枪码

1. 在 Google Sheets 新增一行。
2. 填好 `gun_type`、`weapon`、`build_name`、`code` 等字段。
3. `enabled` 填 `是`。
4. 刷新网页查看。

## 隐藏过期改枪码

把对应行的 `enabled` 改成 `否`。刷新网页后，这条方案就不会显示。

## 本地打开

直接双击 `index.html` 就能打开。  
复制按钮在部分浏览器的本地文件模式下可能受限制；部署到 GitHub Pages 后通常可以正常一键复制。

## 发布到 GitHub Pages

1. 新建一个 GitHub 仓库。
2. 上传本项目里的全部文件：`index.html`、`style.css`、`script.js`、`README.md`、`sample-data.csv`。
3. 进入仓库 `Settings`。
4. 找到 `Pages`。
5. `Source` 选择 `Deploy from a branch`。
6. `Branch` 选择 `main`，目录选择 `/root`。
7. 保存后等待 GitHub 生成链接。
8. 生成的链接就是可以发给朋友访问的网页。

## 功能清单

- 按枪械类型筛选。
- 搜索枪名、方案名、备注、标签。
- 按枪械分组显示。
- 同一把枪下展示多个方案。
- 一键复制单个改枪码。
- 复制全部可见方案名和改枪码。
- 收藏方案，收藏保存在浏览器 `localStorage`。
- 只看收藏。
- CSV 读取失败时使用本地备用数据。
- 手机和电脑都能使用。

# Kitchain 官网

这是 Kitchain 官网前端项目，使用 React、TypeScript 和 Vite 构建。

## 环境要求

- Node.js `20.19.0` 及以上，或 `22.12.0` 及以上
- npm

## 本地运行

```bash
npm install
npm run dev
```

启动后打开终端里显示的本地地址即可预览官网。

## 常用命令

```bash
npm run dev      # 本地开发预览
npm run build    # 检查类型并生成生产构建
npm run preview  # 预览生产构建
npm run lint     # 代码检查
```

## 目录说明

- `src/`：页面和组件源码
- `public/`：官网使用的图片、视频、图标等静态资源
- `index.html`：页面入口
- `package.json`：项目依赖和脚本

## 协作注意事项

- 不要提交 `node_modules/` 和 `dist/`，这些会由本地安装或构建自动生成。
- 修改页面内容主要看 `src/App.tsx`。
- 修改整体样式主要看 `src/App.css` 和 `src/index.css`。
- 新增图片或视频时，放入 `public/` 后使用 `/文件名` 引用。
- 提交前建议运行一次 `npm run build`，确认没有类型或构建错误。

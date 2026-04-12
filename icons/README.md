# 图标说明

请在此文件夹中放置以下尺寸的插件图标：

- `icon16.png` - 16x16 像素（工具栏小图标）
- `icon48.png` - 48x48 像素（扩展管理页面）
- `icon128.png` - 128x128 像素（Chrome 网上应用店）

## 快速生成图标

你可以使用以下方法生成图标：

### 方法一：在线工具
访问 [favicon.io](https://favicon.io/) 或类似网站，上传一张图片自动生成多种尺寸。

### 方法二：使用 ImageMagick
```bash
# 从一张大图生成多个尺寸
convert source.png -resize 16x16 icon16.png
convert source.png -resize 48x48 icon48.png
convert source.png -resize 128x128 icon128.png
```

### 方法三：使用 Photoshop/GIMP
手动调整图片大小并导出为 PNG 格式。

## 设计建议

- 使用简洁的图标设计
- 确保在小尺寸下仍然清晰可辨
- 建议使用透明背景
- 可以使用与"文字互动"相关的图标元素（如字母、鼠标、动画波纹等）

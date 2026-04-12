# 文字互动动画 Chrome 插件

一个基于 [pretext](https://github.com/chenglou/pretext) 思想的 Chrome 浏览器插件，让自定义动画跟随鼠标与网页文字产生互动效果。

## ✨ 功能特点

- 🎨 **自定义动画图片**：支持上传本地图片作为动画元素
- 🖱️ **鼠标跟随**：动画实时跟随鼠标移动
- 📝 **文字互动**：动画会被网页文字"推开"，产生物理互动效果
- ⚙️ **灵活配置**：可调节动画大小、互动强度、影响半径
- 🚀 **性能优化**：使用高效的文字位置缓存和 requestAnimationFrame
- 🌐 **全局支持**：在所有网页上都能使用

## 📦 安装方法

### 方法一：开发者模式安装（推荐）

1. 下载或克隆此项目到本地
2. 打开 Chrome 浏览器，访问 `chrome://extensions/`
3. 开启右上角的"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目文件夹
6. 完成！插件图标会出现在浏览器工具栏

### 方法二：打包安装

1. 在 `chrome://extensions/` 页面点击"打包扩展程序"
2. 选择项目文件夹
3. 生成 `.crx` 文件后拖入浏览器安装

## 🎮 使用说明

### 基础使用

1. 点击浏览器工具栏的插件图标打开设置面板
2. 确保"启用动画"开关已打开
3. 移动鼠标，你会看到动画跟随鼠标移动
4. 当鼠标靠近文字时，动画会被"推开"

### 自定义设置

- **选择动画图片**：点击"选择图片"按钮上传本地图片（支持 PNG、JPG、GIF 等格式）
- **动画大小**：调节滑块改变动画元素的尺寸（20-200px）
- **互动强度**：控制文字对动画的排斥力度（10-100）
- **影响半径**：设置文字影响动画的距离范围（50-300px）

### 推荐图片

- 透明背景的 PNG 图片效果最佳
- 建议图片尺寸：100x100 到 500x500 像素
- 可以使用表情符号、卡通形象、小图标等

## 🔧 技术实现

### 核心原理

本插件借鉴了 [pretext](https://github.com/chenglou/pretext) 的文字布局思想，实现了以下功能：

1. **文字节点扫描**：使用 `TreeWalker` API 遍历 DOM 树，收集所有可见文字节点
2. **位置缓存**：通过 `Range.getClientRects()` 获取文字的精确位置并缓存
3. **物理计算**：计算鼠标与文字之间的距离，生成排斥力向量
4. **动画渲染**：使用 `requestAnimationFrame` 实现流畅的 60fps 动画

### 技术栈

- **Manifest V3**：使用最新的 Chrome 扩展 API
- **原生 JavaScript**：无依赖，轻量高效
- **CSS3 动画**：硬件加速的 transform 动画
- **Chrome Storage API**：持久化用户设置

### 性能优化

- ✅ 使用 `Map` 数据结构缓存文字位置
- ✅ 监听 DOM 变化时使用防抖策略
- ✅ 滚动和窗口大小变化时智能更新缓存
- ✅ 使用 `will-change` 和 `transform` 优化渲染性能
- ✅ 被动事件监听器（`passive: true`）

## 📁 项目结构

```
text-interaction-animation/
├── manifest.json          # 插件配置文件
├── popup.html            # 设置面板 HTML
├── popup.js              # 设置面板逻辑
├── content.js            # 核心动画逻辑
├── content.css           # 动画样式
├── icons/                # 插件图标
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md             # 说明文档
```

## 🎨 自定义开发

### 修改默认动画

编辑 `content.js` 中的 `createAnimationElement()` 方法：

```javascript
// 默认动画：彩色圆圈
this.animationElement.style.background = 'radial-gradient(circle, rgba(255,100,150,0.8), rgba(100,150,255,0.8))';
```

### 调整物理效果

修改 `calculateTextInfluence()` 方法中的力度计算：

```javascript
const force = (1 - distance / this.radius) * (this.intensity / 50);
totalForceX += (dx / distance) * force * 30; // 调整这个系数
```

### 添加新的互动效果

在 `animate()` 方法中添加更多变换效果：

```javascript
this.animationElement.style.transform = `
  translate(${targetX}px, ${targetY}px)
  scale(${scale})
  rotate(${rotation}deg)
  // 添加更多效果...
`;
```

## 🐛 已知问题

- 在文字密集的页面上可能会有轻微的性能影响
- 某些使用 Shadow DOM 的网站可能无法完全检测到文字
- 动态加载的内容需要等待 MutationObserver 触发

## 🔮 未来计划

- [ ] 支持多个动画同时运行
- [ ] 添加更多预设动画效果
- [ ] 支持动画轨迹记录和回放
- [ ] 添加音效支持
- [ ] 支持 GIF 动画
- [ ] 添加更多物理效果（重力、弹性等）

## 📄 许可证

MIT License

## 🙏 致谢

- [pretext](https://github.com/chenglou/pretext) - 提供了文字布局的灵感
- Chrome Extensions API - 强大的浏览器扩展能力

## 📮 反馈与贡献

欢迎提交 Issue 和 Pull Request！

---

**享受与文字互动的乐趣！** 🎉

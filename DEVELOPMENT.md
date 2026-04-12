# 开发文档

## 🏗️ 项目架构

### 文件结构

```
text-interaction-animation/
├── manifest.json          # Chrome 扩展配置
├── popup.html            # 设置界面 UI
├── popup.js              # 设置界面逻辑
├── content.js            # 核心动画引擎
├── content.css           # 动画样式
├── icons/                # 插件图标
├── README.md             # 项目说明
├── INSTALL.md            # 安装指南
├── EXAMPLES.md           # 使用示例
└── DEVELOPMENT.md        # 开发文档（本文件）
```

### 技术栈

- **Manifest V3**: Chrome 扩展最新标准
- **Vanilla JavaScript**: 无框架依赖
- **CSS3**: 硬件加速动画
- **Chrome APIs**:
  - `chrome.storage.sync`: 设置同步
  - `chrome.tabs`: 标签页通信
  - `chrome.runtime`: 消息传递

## 🔍 核心原理

### 1. 文字检测系统

```javascript
// 使用 TreeWalker 遍历 DOM 树
const walker = document.createTreeWalker(
  document.body,
  NodeFilter.SHOW_TEXT,
  filterFunction
);
```

**工作流程：**
1. 遍历页面所有文本节点
2. 过滤掉脚本、样式、空白文本
3. 使用 `Range.getClientRects()` 获取精确位置
4. 缓存到 `Map` 数据结构

**性能优化：**
- 只在必要时重新扫描（DOM 变化、滚动、窗口大小改变）
- 使用 `Map` 而非数组提高查找效率
- 被动事件监听器减少性能开销

### 2. 物理计算引擎

```javascript
calculateTextInfluence() {
  // 计算鼠标与每个文字的距离
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  // 在影响半径内计算排斥力
  if (distance < this.radius) {
    const force = (1 - distance / this.radius) * intensity;
    // 累加力向量
  }
}
```

**物理模型：**
- 反平方衰减：距离越远，力越小
- 向量叠加：多个文字的力累加
- 归一化：确保力的大小在合理范围

**可调参数：**
- `intensity`: 力的强度系数
- `radius`: 影响范围
- `force * 30`: 力的放大倍数（可调）

### 3. 动画渲染系统

```javascript
animate() {
  // 计算目标位置
  const influence = this.calculateTextInfluence();
  const targetX = this.mouseX + influence.x;
  const targetY = this.mouseY + influence.y;
  
  // 使用 transform 实现硬件加速
  this.animationElement.style.transform = `
    translate(${targetX}px, ${targetY}px)
    scale(${scale})
    rotate(${rotation}deg)
  `;
  
  // 60fps 循环
  requestAnimationFrame(() => this.animate());
}
```

**渲染优化：**
- 使用 `transform` 而非 `left/top`（触发 GPU 加速）
- `will-change: transform` 提示浏览器优化
- `requestAnimationFrame` 同步屏幕刷新率
- CSS `transition` 平滑过渡

## 🔧 核心类详解

### TextInteractionAnimation 类

```javascript
class TextInteractionAnimation {
  constructor() {
    this.enabled = true;           // 启用状态
    this.imageData = null;         // 图片数据（Base64）
    this.size = 50;                // 动画大小
    this.intensity = 50;           // 互动强度
    this.radius = 100;             // 影响半径
    this.mouseX = 0;               // 鼠标 X 坐标
    this.mouseY = 0;               // 鼠标 Y 坐标
    this.animationElement = null;  // 动画 DOM 元素
    this.textNodes = [];           // 文本节点数组
    this.textPositions = new Map(); // 文本位置缓存
    this.animationFrame = null;    // 动画帧 ID
  }
}
```

### 主要方法

#### `init()`
初始化插件，加载设置，创建动画元素，开始监听。

#### `createAnimationElement()`
创建动画 DOM 元素，设置样式和图片。

#### `scanTextNodes()`
扫描页面所有文本节点，建立文本列表。

#### `updateTextPositions()`
更新所有文本节点的位置缓存。

#### `calculateTextInfluence()`
计算文字对动画的影响力（核心物理计算）。

#### `animate()`
动画主循环，每帧更新动画位置。

## 🎨 自定义开发

### 添加新的物理效果

#### 1. 吸引力效果

```javascript
// 在 calculateTextInfluence() 中修改
const force = (1 - distance / this.radius) * (this.intensity / 50);
// 改为负值实现吸引
totalForceX -= (dx / distance) * force * 30;
totalForceY -= (dy / distance) * force * 30;
```

#### 2. 重力效果

```javascript
animate() {
  // 添加向下的重力
  const gravity = 0.5;
  this.velocityY += gravity;
  
  const targetY = this.mouseY + influence.y + this.velocityY;
  // ...
}
```

#### 3. 弹性效果

```javascript
animate() {
  // 使用弹簧物理
  const springStrength = 0.1;
  const damping = 0.9;
  
  this.velocityX += (targetX - this.currentX) * springStrength;
  this.velocityY += (targetY - this.currentY) * springStrength;
  
  this.velocityX *= damping;
  this.velocityY *= damping;
  
  this.currentX += this.velocityX;
  this.currentY += this.velocityY;
}
```

### 添加新的视觉效果

#### 1. 粒子轨迹

```javascript
createTrailEffect() {
  const trail = document.createElement('div');
  trail.style.cssText = `
    position: fixed;
    width: 10px;
    height: 10px;
    background: rgba(255, 100, 150, 0.5);
    border-radius: 50%;
    pointer-events: none;
    animation: fadeOut 0.5s forwards;
  `;
  trail.style.left = this.mouseX + 'px';
  trail.style.top = this.mouseY + 'px';
  document.body.appendChild(trail);
  
  setTimeout(() => trail.remove(), 500);
}
```

#### 2. 文字高亮

```javascript
highlightNearbyText() {
  this.textPositions.forEach((positions, node) => {
    positions.forEach(pos => {
      const distance = Math.sqrt(
        Math.pow(pos.x - this.mouseX, 2) + 
        Math.pow(pos.y - this.mouseY, 2)
      );
      
      if (distance < this.radius) {
        node.parentElement.style.color = '#ff6496';
      } else {
        node.parentElement.style.color = '';
      }
    });
  });
}
```

#### 3. 波纹效果

```javascript
createRipple(x, y) {
  const ripple = document.createElement('div');
  ripple.style.cssText = `
    position: fixed;
    width: 20px;
    height: 20px;
    border: 2px solid rgba(255, 100, 150, 0.8);
    border-radius: 50%;
    pointer-events: none;
    animation: rippleExpand 0.6s ease-out forwards;
  `;
  ripple.style.left = (x - 10) + 'px';
  ripple.style.top = (y - 10) + 'px';
  document.body.appendChild(ripple);
  
  setTimeout(() => ripple.remove(), 600);
}
```

### 添加新的配置选项

#### 1. 在 popup.html 中添加控件

```html
<div class="control-group">
  <label for="gravity">重力: <span class="range-value" id="gravityValue">0</span></label>
  <input type="range" id="gravity" min="0" max="10" value="0">
</div>
```

#### 2. 在 popup.js 中处理

```javascript
document.getElementById('gravity').addEventListener('input', (e) => {
  const gravity = parseInt(e.target.value);
  chrome.storage.sync.set({ gravity });
  
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { 
        type: 'updateGravity', 
        gravity 
      });
    });
  });
});
```

#### 3. 在 content.js 中应用

```javascript
chrome.runtime.onMessage.addListener((message) => {
  if (message.type === 'updateGravity') {
    this.gravity = message.gravity;
  }
});
```

## 🧪 测试

### 手动测试清单

- [ ] 在不同网站测试（新闻、博客、社交媒体）
- [ ] 测试不同文字密度的页面
- [ ] 测试动态加载内容（无限滚动）
- [ ] 测试不同浏览器窗口大小
- [ ] 测试滚动时的表现
- [ ] 测试上传不同格式的图片
- [ ] 测试极端参数值（最小/最大）
- [ ] 测试启用/禁用切换
- [ ] 测试设置持久化

### 性能测试

```javascript
// 在 content.js 中添加性能监控
let frameCount = 0;
let lastTime = performance.now();

animate() {
  frameCount++;
  const now = performance.now();
  
  if (now - lastTime >= 1000) {
    console.log(`FPS: ${frameCount}`);
    frameCount = 0;
    lastTime = now;
  }
  
  // ... 原有代码
}
```

### 调试技巧

#### 1. 可视化影响半径

```javascript
// 在 createAnimationElement() 中添加
const debugCircle = document.createElement('div');
debugCircle.style.cssText = `
  position: fixed;
  width: ${this.radius * 2}px;
  height: ${this.radius * 2}px;
  border: 2px dashed red;
  border-radius: 50%;
  pointer-events: none;
  z-index: 999998;
`;
document.body.appendChild(debugCircle);

// 在 animate() 中更新位置
debugCircle.style.left = (this.mouseX - this.radius) + 'px';
debugCircle.style.top = (this.mouseY - this.radius) + 'px';
```

#### 2. 显示文字位置

```javascript
// 可视化所有检测到的文字位置
this.textPositions.forEach((positions) => {
  positions.forEach(pos => {
    const marker = document.createElement('div');
    marker.style.cssText = `
      position: fixed;
      width: 4px;
      height: 4px;
      background: blue;
      left: ${pos.x}px;
      top: ${pos.y}px;
      pointer-events: none;
      z-index: 999997;
    `;
    document.body.appendChild(marker);
  });
});
```

## 📦 打包发布

### 准备发布

1. **更新版本号**
   ```json
   // manifest.json
   {
     "version": "1.0.1"
   }
   ```

2. **压缩代码**（可选）
   ```bash
   # 使用 terser 压缩 JavaScript
   npx terser content.js -o content.min.js
   npx terser popup.js -o popup.min.js
   ```

3. **优化图标**
   - 确保所有图标清晰
   - 使用 PNG 格式
   - 优化文件大小

4. **测试完整性**
   - 在干净的 Chrome 配置中测试
   - 验证所有功能正常
   - 检查控制台无错误

### 打包步骤

1. 在 `chrome://extensions/` 开启开发者模式
2. 点击"打包扩展程序"
3. 选择项目文件夹
4. 生成 `.crx` 和 `.pem` 文件
5. **妥善保管 `.pem` 文件**（用于后续更新）

### 发布到 Chrome 网上应用店

1. 注册 [Chrome Web Store 开发者账号](https://chrome.google.com/webstore/devconsole/)
2. 支付一次性注册费（$5）
3. 准备商店资料：
   - 详细说明
   - 截图（1280x800 或 640x400）
   - 宣传图片
   - 小图标（128x128）
4. 上传 `.zip` 文件（不是 `.crx`）
5. 填写隐私政策（如果收集数据）
6. 提交审核

## 🐛 常见问题

### 问题 1：某些网站不工作

**原因：** 内容安全策略（CSP）限制

**解决：**
```json
// manifest.json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self'"
  }
}
```

### 问题 2：动画卡顿

**原因：** 文字节点过多

**解决：**
```javascript
// 限制扫描的文字节点数量
scanTextNodes() {
  // ...
  if (this.textNodes.length > 1000) {
    this.textNodes = this.textNodes.slice(0, 1000);
  }
}
```

### 问题 3：内存泄漏

**原因：** 未清理事件监听器

**解决：**
```javascript
destroy() {
  if (this.animationFrame) {
    cancelAnimationFrame(this.animationFrame);
  }
  if (this.animationElement) {
    this.animationElement.remove();
  }
  this.textPositions.clear();
  this.textNodes = [];
}
```

## 🚀 未来改进方向

### 短期目标

- [ ] 添加多个预设主题
- [ ] 支持 GIF 动画
- [ ] 添加音效选项
- [ ] 优化大型页面性能

### 中期目标

- [ ] 支持多个动画同时运行
- [ ] 添加动画轨迹录制
- [ ] 实现动画之间的互动
- [ ] 添加更多物理效果

### 长期目标

- [ ] 支持 WebGL 渲染
- [ ] 3D 动画效果
- [ ] AI 驱动的动画行为
- [ ] 社区分享平台

## 📚 参考资源

- [Chrome Extension 官方文档](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 迁移指南](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [pretext 项目](https://github.com/chenglou/pretext)
- [Canvas API 文档](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Web Animations API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Animations_API)

---

**Happy Coding!** 🎉

// 文字互动动画 Content Script
// 基于 pretext 的思想实现文字与动画的互动效果

class TextInteractionAnimation {
  constructor() {
    this.enabled = true;
    this.imageData = null;
    this.size = 50;
    this.intensity = 50;
    this.radius = 100;
    this.mouseX = 0;
    this.mouseY = 0;
    this.animationElement = null;
    this.textNodes = [];
    this.textPositions = new Map();
    this.animationFrame = null;
    
    this.init();
  }

  async init() {
    // 加载设置
    const settings = await chrome.storage.sync.get(['enabled', 'imageData', 'size', 'intensity', 'radius']);
    this.enabled = settings.enabled !== false;
    this.imageData = settings.imageData;
    this.size = settings.size || 50;
    this.intensity = settings.intensity || 50;
    this.radius = settings.radius || 100;

    if (this.enabled) {
      this.createAnimationElement();
      this.scanTextNodes();
      this.startAnimation();
    }

    // 监听鼠标移动
    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    });

    // 监听页面变化，重新扫描文字
    const observer = new MutationObserver(() => {
      if (this.enabled) {
        this.scanTextNodes();
      }
    });
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });

    // 监听滚动和窗口大小变化
    window.addEventListener('scroll', () => this.updateTextPositions(), { passive: true });
    window.addEventListener('resize', () => this.updateTextPositions());
  }

  createAnimationElement() {
    if (this.animationElement) {
      this.animationElement.remove();
    }

    this.animationElement = document.createElement('div');
    this.animationElement.id = 'text-interaction-animation';
    this.animationElement.style.cssText = `
      position: fixed;
      width: ${this.size}px;
      height: ${this.size}px;
      pointer-events: none;
      z-index: 999999;
      transition: transform 0.1s ease-out;
      will-change: transform;
    `;

    if (this.imageData) {
      this.animationElement.style.backgroundImage = `url(${this.imageData})`;
      this.animationElement.style.backgroundSize = 'contain';
      this.animationElement.style.backgroundRepeat = 'no-repeat';
      this.animationElement.style.backgroundPosition = 'center';
    } else {
      // 默认动画：彩色圆圈
      this.animationElement.style.background = 'radial-gradient(circle, rgba(255,100,150,0.8), rgba(100,150,255,0.8))';
      this.animationElement.style.borderRadius = '50%';
      this.animationElement.style.boxShadow = '0 0 20px rgba(255,100,150,0.6)';
    }

    document.body.appendChild(this.animationElement);
  }

  scanTextNodes() {
    this.textNodes = [];
    this.textPositions.clear();

    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      {
        acceptNode: (node) => {
          // 过滤掉脚本、样式和空白文本
          if (node.parentElement.tagName === 'SCRIPT' || 
              node.parentElement.tagName === 'STYLE' ||
              node.textContent.trim().length === 0) {
            return NodeFilter.FILTER_REJECT;
          }
          return NodeFilter.FILTER_ACCEPT;
        }
      }
    );

    let node;
    while (node = walker.nextNode()) {
      this.textNodes.push(node);
    }

    this.updateTextPositions();
  }

  updateTextPositions() {
    this.textPositions.clear();

    this.textNodes.forEach(node => {
      const range = document.createRange();
      range.selectNodeContents(node);
      const rects = range.getClientRects();
      
      const positions = [];
      for (let rect of rects) {
        positions.push({
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
          width: rect.width,
          height: rect.height
        });
      }
      
      if (positions.length > 0) {
        this.textPositions.set(node, positions);
      }
    });
  }

  calculateTextInfluence() {
    let totalForceX = 0;
    let totalForceY = 0;
    let influenceCount = 0;

    this.textPositions.forEach((positions) => {
      positions.forEach(pos => {
        const dx = pos.x - this.mouseX;
        const dy = pos.y - this.mouseY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < this.radius && distance > 0) {
          // 计算排斥力（文字推开动画）
          const force = (1 - distance / this.radius) * (this.intensity / 50);
          totalForceX += (dx / distance) * force * 30;
          totalForceY += (dy / distance) * force * 30;
          influenceCount++;
        }
      });
    });

    return {
      x: totalForceX,
      y: totalForceY,
      hasInfluence: influenceCount > 0
    };
  }

  animate() {
    if (!this.enabled || !this.animationElement) return;

    const influence = this.calculateTextInfluence();
    
    // 动画跟随鼠标，但受文字影响而偏移
    const targetX = this.mouseX + influence.x;
    const targetY = this.mouseY + influence.y;

    // 添加轻微的弹性效果
    const scale = influence.hasInfluence ? 1.2 : 1;
    const rotation = influence.x * 0.5;

    this.animationElement.style.transform = `
      translate(${targetX - this.size / 2}px, ${targetY - this.size / 2}px)
      scale(${scale})
      rotate(${rotation}deg)
    `;

    this.animationFrame = requestAnimationFrame(() => this.animate());
  }

  startAnimation() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    this.animate();
  }

  stopAnimation() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    if (this.animationElement) {
      this.animationElement.style.display = 'none';
    }
  }

  toggle(enabled) {
    this.enabled = enabled;
    if (enabled) {
      if (!this.animationElement) {
        this.createAnimationElement();
      }
      this.animationElement.style.display = 'block';
      this.startAnimation();
    } else {
      this.stopAnimation();
    }
  }

  updateImage(imageData) {
    this.imageData = imageData;
    if (this.animationElement) {
      this.animationElement.style.backgroundImage = `url(${imageData})`;
      this.animationElement.style.backgroundSize = 'contain';
      this.animationElement.style.backgroundRepeat = 'no-repeat';
      this.animationElement.style.backgroundPosition = 'center';
      this.animationElement.style.background = '';
      this.animationElement.style.borderRadius = '';
      this.animationElement.style.boxShadow = '';
    }
  }

  updateSize(size) {
    this.size = size;
    if (this.animationElement) {
      this.animationElement.style.width = `${size}px`;
      this.animationElement.style.height = `${size}px`;
    }
  }

  updateIntensity(intensity) {
    this.intensity = intensity;
  }

  updateRadius(radius) {
    this.radius = radius;
  }
}

// 初始化动画
const animation = new TextInteractionAnimation();

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'toggleAnimation':
      animation.toggle(message.enabled);
      break;
    case 'updateImage':
      animation.updateImage(message.imageData);
      break;
    case 'updateSize':
      animation.updateSize(message.size);
      break;
    case 'updateIntensity':
      animation.updateIntensity(message.intensity);
      break;
    case 'updateRadius':
      animation.updateRadius(message.radius);
      break;
  }
  sendResponse({ success: true });
});

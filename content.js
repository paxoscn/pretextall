// 文字互动动画 - 使用 pretext 库实现
// 基于 https://github.com/chenglou/pretext

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
    this.textElements = [];
    this.preparedTexts = new Map(); // 存储 pretext 准备好的文本
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

    console.log('Text Interaction Animation initialized:', {
      enabled: this.enabled,
      size: this.size,
      intensity: this.intensity,
      radius: this.radius
    });

    if (this.enabled) {
      this.createAnimationElement();
      this.scanAndPrepareText();
      this.startAnimation();
    }

    // 监听鼠标移动
    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX;
      this.mouseY = e.clientY;
    }, { passive: true });

    // 监听页面变化，重新扫描文字
    const observer = new MutationObserver(() => {
      if (this.enabled) {
        this.scanAndPrepareText();
      }
    });
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });

    // 监听滚动和窗口大小变化
    window.addEventListener('scroll', () => this.updateTextPositions(), { passive: true });
    window.addEventListener('resize', () => {
      this.scanAndPrepareText();
    });
  }

  createAnimationElement() {
    if (this.animationElement) {
      this.animationElement.remove();
    }

    this.animationElement = document.createElement('div');
    this.animationElement.id = 'text-interaction-animation';
    this.animationElement.style.cssText = `
      position: fixed;
      left: 0;
      top: 0;
      width: ${this.size}px;
      height: ${this.size}px;
      pointer-events: none;
      z-index: 999999;
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

  scanAndPrepareText() {
    this.textElements = [];
    this.preparedTexts.clear();

    // 获取所有可见的文本元素
    const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, span, div, a, li, td, th, label, button');
    
    elements.forEach((element, index) => {
      const text = element.textContent.trim();
      if (text.length === 0) return;

      // 获取元素的计算样式
      const style = window.getComputedStyle(element);
      const fontSize = style.fontSize;
      const fontFamily = style.fontFamily;
      const fontWeight = style.fontWeight;
      const fontStyle = style.fontStyle;
      
      // 构建 font 字符串（pretext 需要的格式）
      const font = `${fontStyle !== 'normal' ? fontStyle + ' ' : ''}${fontWeight !== '400' ? fontWeight + ' ' : ''}${fontSize} ${fontFamily}`;

      try {
        // 使用 pretext 准备文本
        if (typeof window.pretext !== 'undefined' && window.pretext.prepare) {
          const prepared = window.pretext.prepare(text, font);
          
          this.textElements.push({
            element,
            text,
            font,
            prepared,
            index
          });
          
          this.preparedTexts.set(index, {
            prepared,
            element,
            bounds: null
          });
        }
      } catch (e) {
        // 如果 pretext 出错，跳过这个元素
        console.warn('Pretext preparation failed:', e);
      }
    });

    this.updateTextPositions();
  }

  updateTextPositions() {
    this.preparedTexts.forEach((data, index) => {
      const rect = data.element.getBoundingClientRect();
      
      if (rect.width > 0 && rect.height > 0) {
        // 使用 pretext 的 layout 函数计算文本布局
        try {
          if (typeof window.pretext !== 'undefined' && window.pretext.layout) {
            const layoutResult = window.pretext.layout(data.prepared, rect.width, parseFloat(window.getComputedStyle(data.element).lineHeight) || 20);
            
            data.bounds = {
              left: rect.left + window.scrollX,
              top: rect.top + window.scrollY,
              right: rect.right + window.scrollX,
              bottom: rect.bottom + window.scrollY,
              width: rect.width,
              height: layoutResult.height || rect.height,
              centerX: rect.left + rect.width / 2,
              centerY: rect.top + rect.height / 2,
              lineCount: layoutResult.lineCount || 1
            };
          } else {
            // 降级方案：直接使用元素边界
            data.bounds = {
              left: rect.left + window.scrollX,
              top: rect.top + window.scrollY,
              right: rect.right + window.scrollX,
              bottom: rect.bottom + window.scrollY,
              width: rect.width,
              height: rect.height,
              centerX: rect.left + rect.width / 2,
              centerY: rect.top + rect.height / 2,
              lineCount: 1
            };
          }
        } catch (e) {
          console.warn('Pretext layout failed:', e);
        }
      }
    });
  }

  calculateTextInfluence() {
    let totalForceX = 0;
    let totalForceY = 0;
    let influenceCount = 0;

    this.preparedTexts.forEach((data) => {
      if (!data.bounds) return;

      const bounds = data.bounds;
      
      // 计算鼠标到文本区域中心的距离
      const dx = bounds.centerX - this.mouseX;
      const dy = bounds.centerY - this.mouseY;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < this.radius && distance > 0) {
        // 计算排斥力
        const force = (1 - distance / this.radius) * (this.intensity / 50);
        
        // 根据文本的行数调整力度（更多文字 = 更强的力）
        const textFactor = Math.min(data.bounds.lineCount / 3, 1.5);
        
        totalForceX += (dx / distance) * force * 30 * textFactor;
        totalForceY += (dy / distance) * force * 30 * textFactor;
        influenceCount++;
      }
    });

    return {
      x: totalForceX,
      y: totalForceY,
      hasInfluence: influenceCount > 0
    };
  }

  animate() {
    if (!this.enabled || !this.animationElement) return;

    // 确保有鼠标位置（初始化时可能为 0）
    if (this.mouseX === 0 && this.mouseY === 0) {
      this.animationFrame = requestAnimationFrame(() => this.animate());
      return;
    }

    const influence = this.calculateTextInfluence();
    
    // 动画跟随鼠标，但受文字影响而偏移
    const targetX = this.mouseX + influence.x - this.size / 2;
    const targetY = this.mouseY + influence.y - this.size / 2;

    // 添加轻微的弹性效果
    const scale = influence.hasInfluence ? 1.2 : 1;
    const rotation = influence.x * 0.5;

    this.animationElement.style.transform = `
      translate(${targetX}px, ${targetY}px)
      scale(${scale})
      rotate(${rotation}deg)
    `;

    this.animationFrame = requestAnimationFrame(() => this.animate());
  }

  startAnimation() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    console.log('Starting animation...');
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

// 等待 pretext 加载完成后初始化
function initAnimation() {
  if (typeof window.pretext !== 'undefined') {
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
  } else {
    // 等待 pretext 加载
    setTimeout(initAnimation, 100);
  }
}

// 延迟初始化，等待 pretext-loader.js 完成
setTimeout(initAnimation, 500);

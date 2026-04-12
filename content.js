// 文字互动动画 - 使用 pretext 实现文字避开图片效果
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
      this.scanTextElements();
      this.startAnimation();
    }

    // 监听鼠标移动
    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX + window.scrollX;
      this.mouseY = e.clientY + window.scrollY;
    }, { passive: true });

    // 监听页面变化
    const observer = new MutationObserver(() => {
      if (this.enabled) {
        this.scanTextElements();
      }
    });
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });

    // 监听滚动和窗口大小变化
    window.addEventListener('scroll', () => {
      if (this.enabled) {
        this.relayoutAllText();
      }
    }, { passive: true });
    
    window.addEventListener('resize', () => {
      if (this.enabled) {
        this.scanTextElements();
      }
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

  scanTextElements() {
    this.textElements = [];

    // 只选择段落元素，避免处理太多小元素
    const elements = document.querySelectorAll('p, h1, h2, h3, h4, h5, h6, blockquote, li');
    
    elements.forEach((element) => {
      const text = element.textContent.trim();
      if (text.length === 0) return;

      // 获取元素的计算样式
      const style = window.getComputedStyle(element);
      const fontSize = style.fontSize;
      const fontFamily = style.fontFamily;
      const fontWeight = style.fontWeight;
      const fontStyle = style.fontStyle;
      const lineHeight = parseFloat(style.lineHeight) || parseFloat(fontSize) * 1.2;
      
      // 构建 font 字符串
      const font = `${fontStyle !== 'normal' ? fontStyle + ' ' : ''}${fontWeight !== '400' ? fontWeight + ' ' : ''}${fontSize} ${fontFamily}`;

      try {
        // 使用 pretext 准备文本
        if (typeof window.pretext !== 'undefined' && window.pretext.prepareWithSegments) {
          const prepared = window.pretext.prepareWithSegments(text, font);
          
          // 保存原始文本和样式
          if (!element.dataset.originalText) {
            element.dataset.originalText = text;
          }
          
          this.textElements.push({
            element,
            prepared,
            font,
            lineHeight,
            originalText: text
          });
        }
      } catch (e) {
        console.warn('Pretext preparation failed:', e);
      }
    });

    console.log(`Scanned ${this.textElements.length} text elements`);
    this.relayoutAllText();
  }

  relayoutAllText() {
    if (!window.pretext || !window.pretext.layoutNextLineRange) return;

    this.textElements.forEach((data) => {
      const element = data.element;
      const rect = element.getBoundingClientRect();
      
      if (rect.width === 0 || rect.height === 0) return;

      const elementTop = rect.top + window.scrollY;
      const elementLeft = rect.left + window.scrollX;
      const maxWidth = rect.width;

      // 检查图片是否在这个元素的范围内
      const imageInElement = this.isImageInElement(elementTop, elementLeft, rect.height, maxWidth);

      if (imageInElement) {
        // 使用 pretext 重新布局文字，让文字避开图片
        this.relayoutTextAroundImage(data, elementTop, elementLeft, maxWidth);
      } else {
        // 恢复原始文本
        if (element.textContent !== data.originalText) {
          element.textContent = data.originalText;
        }
      }
    });
  }

  isImageInElement(elementTop, elementLeft, elementHeight, elementWidth) {
    // 检查图片（鼠标位置）是否在元素范围内
    const imageX = this.mouseX;
    const imageY = this.mouseY;
    
    return imageX >= elementLeft && 
           imageX <= elementLeft + elementWidth &&
           imageY >= elementTop && 
           imageY <= elementTop + elementHeight;
  }

  relayoutTextAroundImage(data, elementTop, elementLeft, maxWidth) {
    if (!window.pretext.layoutNextLineRange || !window.pretext.materializeLineRange) return;

    const { element, prepared, lineHeight } = data;
    const lines = [];
    let cursor = { segmentIndex: 0, graphemeIndex: 0 };
    let y = 0;

    // 逐行布局文字
    while (true) {
      // 计算当前行的可用宽度（考虑图片位置）
      const lineY = elementTop + y;
      const availableWidth = this.calculateAvailableWidth(
        lineY, 
        lineHeight, 
        elementLeft, 
        maxWidth
      );

      // 使用 pretext 布局这一行
      const lineRange = window.pretext.layoutNextLineRange(prepared, cursor, availableWidth);
      
      if (lineRange === null) break;

      const line = window.pretext.materializeLineRange(prepared, lineRange);
      lines.push(line.text);
      
      cursor = lineRange.end;
      y += lineHeight;
    }

    // 更新元素文本
    const newText = lines.join('\n');
    if (element.textContent !== newText) {
      element.textContent = newText;
      element.style.whiteSpace = 'pre-wrap';
    }
  }

  calculateAvailableWidth(lineY, lineHeight, elementLeft, maxWidth) {
    // 检查图片是否与当前行重叠
    const imageTop = this.mouseY - this.size / 2;
    const imageBottom = this.mouseY + this.size / 2;
    const imageLeft = this.mouseX - this.size / 2;
    const imageRight = this.mouseX + this.size / 2;

    const lineBottom = lineY + lineHeight;

    // 如果图片与当前行重叠
    if (imageBottom >= lineY && imageTop <= lineBottom) {
      const imageRelativeLeft = imageLeft - elementLeft;
      const imageRelativeRight = imageRight - elementLeft;

      // 图片在左侧
      if (imageRelativeLeft < maxWidth / 2) {
        const cutoff = Math.max(0, imageRelativeRight + 10); // 10px 间距
        return maxWidth - cutoff;
      }
      // 图片在右侧
      else {
        const cutoff = Math.max(0, imageRelativeLeft - 10);
        return cutoff;
      }
    }

    return maxWidth;
  }

  animate() {
    if (!this.enabled || !this.animationElement) return;

    // 确保有鼠标位置
    if (this.mouseX === 0 && this.mouseY === 0) {
      this.animationFrame = requestAnimationFrame(() => this.animate());
      return;
    }

    // 更新动画位置（跟随鼠标）
    const targetX = this.mouseX - this.size / 2 - window.scrollX;
    const targetY = this.mouseY - this.size / 2 - window.scrollY;

    this.animationElement.style.transform = `translate(${targetX}px, ${targetY}px)`;

    // 重新布局文字
    this.relayoutAllText();

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
    // 恢复所有文本
    this.textElements.forEach((data) => {
      if (data.element.textContent !== data.originalText) {
        data.element.textContent = data.originalText;
        data.element.style.whiteSpace = '';
      }
    });
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

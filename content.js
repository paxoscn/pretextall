// 文字互动动画 - 使用 pretext 实现文字环绕图片效果
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
    this.canvas = null; // 用于测量文字宽度
    this.ctx = null;
    
    this.init();
  }

  async init() {
    const settings = await chrome.storage.sync.get(['enabled', 'imageData', 'size', 'intensity', 'radius']);
    this.enabled = settings.enabled !== false;
    this.imageData = settings.imageData;
    this.size = settings.size || 50;
    this.intensity = settings.intensity || 50;
    this.radius = settings.radius || 100;

    // 创建 Canvas 用于测量文字宽度
    this.canvas = document.createElement('canvas');
    this.ctx = this.canvas.getContext('2d');

    console.log('Text Interaction Animation initialized');

    if (this.enabled) {
      this.createAnimationElement();
      this.scanTextElements();
      this.startAnimation();
    }

    document.addEventListener('mousemove', (e) => {
      this.mouseX = e.clientX + window.scrollX;
      this.mouseY = e.clientY + window.scrollY;
    }, { passive: true });

    const observer = new MutationObserver(() => {
      if (this.enabled) this.scanTextElements();
    });
    observer.observe(document.body, { childList: true, subtree: true });

    window.addEventListener('scroll', () => {
      if (this.enabled) this.relayoutAllText();
    }, { passive: true });
    
    window.addEventListener('resize', () => {
      if (this.enabled) this.scanTextElements();
    });
  }

  createAnimationElement() {
    if (this.animationElement) this.animationElement.remove();

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
      this.animationElement.style.background = 'radial-gradient(circle, rgba(255,100,150,0.8), rgba(100,150,255,0.8))';
      this.animationElement.style.borderRadius = '50%';
      this.animationElement.style.boxShadow = '0 0 20px rgba(255,100,150,0.6)';
    }

    document.body.appendChild(this.animationElement);
  }

  scanTextElements() {
    this.textElements = [];
    const elements = document.querySelectorAll('div.heading-block, div.text-block, div.code-line-wrapper, p, h1, h2, h3, h4, h5, h6, blockquote, li');
    
    elements.forEach((element) => {
      const text = element.dataset.originalText ? element.dataset.originalText : element.textContent.trim();
      if (text.length === 0) return;

      const style = window.getComputedStyle(element);
      const fontSize = style.fontSize;
      const fontFamily = style.fontFamily;
      const fontWeight = style.fontWeight;
      const fontStyle = style.fontStyle;
      const lineHeight = parseFloat(style.lineHeight) || parseFloat(fontSize) * 1.2;
      
      const font = `${fontStyle !== 'normal' ? fontStyle + ' ' : ''}${fontWeight !== '400' ? fontWeight + ' ' : ''}${fontSize} ${fontFamily}`;

      try {
        if (typeof window.pretext !== 'undefined' && window.pretext.prepareWithSegments) {
          const prepared = window.pretext.prepareWithSegments(text, font);
          
          if (!element.dataset.originalText) {
            element.dataset.originalText = text;
          }
          
          this.textElements.push({
            element,
            prepared,
            font,
            lineHeight,
            fontSize: parseFloat(fontSize),
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
      const elementRight = elementLeft + rect.width;
      const elementBottom = elementTop + rect.height;
      const maxWidth = rect.width;

      // 检查图片是否在这个元素的范围内（添加一些容差）
      const imageInElement = this.isImageInElement(elementTop, elementLeft, elementBottom, elementRight);

      if (imageInElement) {
        // 使用 pretext 重新布局文字，让文字环绕图片
        this.relayoutTextAroundImage(data, elementTop, elementLeft, maxWidth);
      } else {
        // 恢复原始文本和样式
        if (element.dataset.modified === 'true' || element.textContent !== data.originalText) {
          element.textContent = data.originalText;
          
          // 恢复原有的 white-space 样式
          if (element.dataset.originalWhiteSpace) {
            element.style.whiteSpace = element.dataset.originalWhiteSpace;
            delete element.dataset.originalWhiteSpace;
          } else {
            element.style.whiteSpace = '';
          }
          
          // 清除修改标记
          delete element.dataset.modified;
        }
      }
    });
  }

  isImageInElement(elementTop, elementLeft, elementBottom, elementRight) {
    // 检查图片（鼠标位置）是否在元素范围内
    const imageX = this.mouseX;
    const imageY = this.mouseY;
    const imageLeft = imageX - this.size / 2;
    const imageRight = imageX + this.size / 2;
    const imageTop = imageY - this.size / 2;
    const imageBottom = imageY + this.size / 2;
    
    // 检查图片是否与元素有重叠
    return !(imageRight < elementLeft || 
             imageLeft > elementRight || 
             imageBottom < elementTop || 
             imageTop > elementBottom);
  }

  relayoutTextAroundImage(data, elementTop, elementLeft, maxWidth) {
    if (!window.pretext.layoutNextLineRange || !window.pretext.materializeLineRange) return;

    const { element, prepared, lineHeight, fontSize, font } = data;
    const lines = [];
    let cursor = { segmentIndex: 0, graphemeIndex: 0 };
    let y = 0;

    while (true) {
      const lineY = elementTop + y;
      const layoutInfo = this.calculateLineLayout(lineY, lineHeight, elementLeft, maxWidth);
      
      // 传递字体信息
      layoutInfo.font = font;

      if (layoutInfo.skip) {
        lines.push('');
        y += lineHeight;
        continue;
      }

      // 如果左右两侧都有空间，尝试拆分文字
      if (layoutInfo.leftWidth > 0 && layoutInfo.rightWidth > 0) {
        const splitLine = this.layoutSplitLine(prepared, cursor, layoutInfo, fontSize);
        if (splitLine) {
          lines.push(splitLine.text);
          cursor = splitLine.cursor;
          y += lineHeight;
          continue;
        }
      }

      // 否则使用单侧布局
      const lineRange = window.pretext.layoutNextLineRange(prepared, cursor, layoutInfo.width);
      
      if (lineRange === null) break;

      const line = window.pretext.materializeLineRange(prepared, lineRange);
      
      let lineText = line.text;
      if (layoutInfo.indent > 0) {
        this.ctx.font = font;
        const spaceWidth = this.ctx.measureText(' ').width;
        const spaces = Math.ceil(layoutInfo.indent / spaceWidth);
        lineText = ' '.repeat(Math.max(0, spaces)) + lineText;
      }
      
      lines.push(lineText);
      cursor = lineRange.end;
      y += lineHeight;
    }

    const newText = lines.join('\n');
    if (element.textContent !== newText) {
      if (!element.dataset.originalWhiteSpace) {
        const computedStyle = window.getComputedStyle(element);
        element.dataset.originalWhiteSpace = computedStyle.whiteSpace;
      }
      
      element.textContent = newText;
      element.style.whiteSpace = 'pre-wrap';
      
      // 标记元素已被修改
      element.dataset.modified = 'true';
    }
  }

  layoutSplitLine(prepared, cursor, layoutInfo, fontSize) {
    if (!window.pretext.layoutNextLineRange || !window.pretext.materializeLineRange) return null;

    const minWidth = 30;
    if (layoutInfo.leftWidth < minWidth || layoutInfo.rightWidth < minWidth) {
      return null;
    }

    // 布局左侧文字
    const leftRange = window.pretext.layoutNextLineRange(prepared, cursor, layoutInfo.leftWidth);
    if (!leftRange) return null;

    const leftLine = window.pretext.materializeLineRange(prepared, leftRange);
    
    // 布局右侧文字
    const rightRange = window.pretext.layoutNextLineRange(prepared, leftRange.end, layoutInfo.rightWidth);
    if (!rightRange) {
      // 如果右侧没有更多文字，只返回左侧
      return { text: leftLine.text, cursor: leftRange.end };
    }

    const rightLine = window.pretext.materializeLineRange(prepared, rightRange);
    
    // 使用 Canvas 精确测量空格宽度
    const font = layoutInfo.font || `${fontSize}px Arial`;
    this.ctx.font = font;
    const spaceWidth = this.ctx.measureText(' ').width;
    
    // 计算需要填充的宽度
    // 从左侧文字结束位置到右侧文字开始位置的距离
    const leftTextWidth = leftLine.width || layoutInfo.leftWidth;
    
    // 图片占据的总空间（包括两侧间距）
    const totalImageSpace = layoutInfo.imageWidth + layoutInfo.gap * 2;
    
    // 需要的空格宽度 = 图片空间 + (左侧可用宽度 - 左侧实际文字宽度)
    const gapWidth = totalImageSpace + (layoutInfo.leftWidth - leftTextWidth);
    
    // 计算需要的空格数量
    const spaces = Math.max(1, Math.ceil(gapWidth / spaceWidth));
    
    // 组合左右两侧文字
    const combinedText = leftLine.text + ' '.repeat(spaces) + rightLine.text;
    
    return { text: combinedText, cursor: rightRange.end };
  }

  calculateLineLayout(lineY, lineHeight, elementLeft, maxWidth) {
    const imageTop = this.mouseY - this.size / 2;
    const imageBottom = this.mouseY + this.size / 2;
    const imageLeft = this.mouseX - this.size / 2;
    const imageRight = this.mouseX + this.size / 2;

    const lineBottom = lineY + lineHeight;
    const gap = 10;

    if (imageBottom >= lineY && imageTop <= lineBottom) {
      const imageRelativeLeft = imageLeft - elementLeft;
      const imageRelativeRight = imageRight - elementLeft;

      if (imageRelativeRight > 0 && imageRelativeLeft < maxWidth) {
        const leftSpace = Math.max(0, imageRelativeLeft - gap);
        const rightSpace = Math.max(0, maxWidth - imageRelativeRight - gap);
        
        const minWidth = 30;
        
        // 如果左右两侧都有足够空间，返回两侧信息
        if (leftSpace > minWidth && rightSpace > minWidth) {
          return {
            width: leftSpace,
            indent: 0,
            skip: false,
            leftWidth: leftSpace,
            rightWidth: rightSpace,
            imageWidth: this.size,
            gap: gap,
            font: null // 将在调用时设置
          };
        }
        // 只有左侧空间足够
        else if (leftSpace > minWidth) {
          return { 
            width: leftSpace, 
            indent: 0, 
            skip: false,
            leftWidth: leftSpace,
            rightWidth: 0
          };
        }
        // 只有右侧空间足够
        else if (rightSpace > minWidth) {
          return { 
            width: rightSpace, 
            indent: imageRelativeRight + gap, 
            skip: false,
            leftWidth: 0,
            rightWidth: rightSpace
          };
        }
        // 两侧空间都不够
        else {
          return { 
            width: 0, 
            indent: 0, 
            skip: true,
            leftWidth: 0,
            rightWidth: 0
          };
        }
      }
    }

    return { 
      width: maxWidth, 
      indent: 0, 
      skip: false,
      leftWidth: 0,
      rightWidth: 0
    };
  }

  animate() {
    if (!this.enabled || !this.animationElement) return;

    if (this.mouseX === 0 && this.mouseY === 0) {
      this.animationFrame = requestAnimationFrame(() => this.animate());
      return;
    }

    const targetX = this.mouseX - this.size / 2 - window.scrollX;
    const targetY = this.mouseY - this.size / 2 - window.scrollY;

    this.animationElement.style.transform = `translate(${targetX}px, ${targetY}px)`;
    this.relayoutAllText();

    this.animationFrame = requestAnimationFrame(() => this.animate());
  }

  startAnimation() {
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
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
    // 恢复所有文本和样式
    this.textElements.forEach((data) => {
      const element = data.element;
      if (element.dataset.modified === 'true' || element.textContent !== data.originalText) {
        element.textContent = data.originalText;
        
        if (element.dataset.originalWhiteSpace) {
          element.style.whiteSpace = element.dataset.originalWhiteSpace;
          delete element.dataset.originalWhiteSpace;
        } else {
          element.style.whiteSpace = '';
        }
        
        delete element.dataset.modified;
      }
    });
  }

  toggle(enabled) {
    this.enabled = enabled;
    if (enabled) {
      if (!this.animationElement) this.createAnimationElement();
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

function initAnimation() {
  if (typeof window.pretext !== 'undefined') {
    const animation = new TextInteractionAnimation();
    
    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
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
    setTimeout(initAnimation, 100);
  }
}

setTimeout(initAnimation, 500);

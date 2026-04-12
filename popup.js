// 加载保存的设置
chrome.storage.sync.get(['enabled', 'imageData', 'size', 'intensity', 'radius'], (result) => {
  document.getElementById('enabled').checked = result.enabled !== false;
  document.getElementById('size').value = result.size || 50;
  document.getElementById('intensity').value = result.intensity || 50;
  document.getElementById('radius').value = result.radius || 100;
  
  updateValues();
  updateStatus();
  
  if (result.imageData) {
    const preview = document.getElementById('preview');
    preview.src = result.imageData;
    preview.classList.add('show');
  }
});

// 更新显示值
function updateValues() {
  document.getElementById('sizeValue').textContent = document.getElementById('size').value + 'px';
  document.getElementById('intensityValue').textContent = document.getElementById('intensity').value;
  document.getElementById('radiusValue').textContent = document.getElementById('radius').value + 'px';
}

// 更新状态文本
function updateStatus() {
  const enabled = document.getElementById('enabled').checked;
  document.getElementById('status').textContent = enabled ? '已启用' : '已禁用';
}

// 启用/禁用切换
document.getElementById('enabled').addEventListener('change', (e) => {
  const enabled = e.target.checked;
  chrome.storage.sync.set({ enabled });
  updateStatus();
  
  // 通知所有标签页更新状态
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { 
        type: 'toggleAnimation', 
        enabled 
      }).catch(() => {});
    });
  });
});

// 图片上传
document.getElementById('imageUpload').addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (event) => {
    const imageData = event.target.result;
    const preview = document.getElementById('preview');
    preview.src = imageData;
    preview.classList.add('show');
    
    chrome.storage.sync.set({ imageData });
    
    // 通知所有标签页更新图片
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach(tab => {
        chrome.tabs.sendMessage(tab.id, { 
          type: 'updateImage', 
          imageData 
        }).catch(() => {});
      });
    });
  };
  reader.readAsDataURL(file);
});

// 大小调整
document.getElementById('size').addEventListener('input', (e) => {
  const size = parseInt(e.target.value);
  updateValues();
  chrome.storage.sync.set({ size });
  
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { 
        type: 'updateSize', 
        size 
      }).catch(() => {});
    });
  });
});

// 强度调整
document.getElementById('intensity').addEventListener('input', (e) => {
  const intensity = parseInt(e.target.value);
  updateValues();
  chrome.storage.sync.set({ intensity });
  
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { 
        type: 'updateIntensity', 
        intensity 
      }).catch(() => {});
    });
  });
});

// 半径调整
document.getElementById('radius').addEventListener('input', (e) => {
  const radius = parseInt(e.target.value);
  updateValues();
  chrome.storage.sync.set({ radius });
  
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, { 
        type: 'updateRadius', 
        radius 
      }).catch(() => {});
    });
  });
});

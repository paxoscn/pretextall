# Text Interaction Animation - Chrome Extension

A Chrome browser extension inspired by [pretext](https://github.com/chenglou/pretext) that creates interactive animations following your mouse cursor and physically interacting with webpage text.

[中文文档](README.md) | English

## ✨ Features

- 🎨 **Custom Animation Images**: Upload local images as animation elements
- 🖱️ **Mouse Following**: Animation follows cursor in real-time
- 📝 **Text Interaction**: Animation is "pushed away" by webpage text
- ⚙️ **Flexible Configuration**: Adjustable size, intensity, and radius
- 🚀 **Performance Optimized**: Efficient text position caching and requestAnimationFrame
- 🌐 **Universal Support**: Works on all webpages

## 📦 Installation

### Method 1: Developer Mode (Recommended)

1. Download or clone this project
2. Open Chrome and navigate to `chrome://extensions/`
3. Enable "Developer mode" in the top right
4. Click "Load unpacked"
5. Select the project folder
6. Done! The extension icon will appear in your toolbar

### Method 2: Package Installation

1. Go to `chrome://extensions/`
2. Click "Pack extension"
3. Select the project folder
4. Drag the generated `.crx` file into Chrome
5. Click "Add extension"

## 🎮 Usage

### Basic Usage

1. Click the extension icon in your browser toolbar
2. Ensure "Enable Animation" toggle is on
3. Visit any webpage
4. Move your mouse and watch the animation interact with text!

### Customization

- **Animation Image**: Click "Choose Image" to upload a local image (PNG with transparent background recommended)
- **Animation Size**: Adjust the size of the animation element (20-200px)
- **Interaction Intensity**: Control how strongly text pushes the animation (10-100)
- **Influence Radius**: Set the distance at which text affects the animation (50-300px)

### Recommended Settings

**Daily Browsing:**
```
Size: 50px
Intensity: 40
Radius: 100px
```

**Presentation/Demo:**
```
Size: 80px
Intensity: 70
Radius: 150px
```

**Focused Reading:**
```
Size: 40px
Intensity: 30
Radius: 80px
```

## 🔧 Technical Implementation

### Core Principles

This extension is inspired by [pretext](https://github.com/chenglou/pretext) and implements:

1. **Text Detection**: Uses `TreeWalker` API to traverse the DOM tree and collect all visible text nodes
2. **Position Caching**: Obtains precise text positions via `Range.getClientRects()` and caches them
3. **Physics Calculation**: Calculates distance between mouse and text, generating repulsion force vectors
4. **Animation Rendering**: Uses `requestAnimationFrame` for smooth 60fps animation

### Tech Stack

- **Manifest V3**: Latest Chrome extension API
- **Vanilla JavaScript**: No dependencies, lightweight and efficient
- **CSS3 Animation**: Hardware-accelerated transform animations
- **Chrome Storage API**: Persistent user settings

### Performance Optimization

- ✅ `Map` data structure for text position caching
- ✅ Debounced DOM mutation observation
- ✅ Smart cache updates on scroll and resize
- ✅ `will-change` and `transform` for rendering optimization
- ✅ Passive event listeners (`passive: true`)

## 📁 Project Structure

```
text-interaction-animation/
├── manifest.json          # Extension configuration
├── popup.html            # Settings panel UI
├── popup.js              # Settings panel logic
├── content.js            # Core animation engine
├── content.css           # Animation styles
├── icons/                # Extension icons
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
├── README.md             # Documentation (Chinese)
├── README_EN.md          # Documentation (English)
├── INSTALL.md            # Installation guide
├── EXAMPLES.md           # Usage examples
├── DEVELOPMENT.md        # Development documentation
└── test-page.html        # Test page
```

## 🎨 Customization

### Recommended Images

- 🐱 Cute animals
- ⭐ Stars, moons
- 🎈 Balloons, clouds
- 🦋 Butterflies, birds
- 💎 Gems, crystals

**Best Image Characteristics:**
- ✅ Transparent background (PNG format)
- ✅ Clear outline
- ✅ Moderate detail (not too complex)
- ✅ Square or near-square aspect ratio
- ❌ Avoid elongated images
- ❌ Avoid overly complex patterns

## 🐛 Troubleshooting

### Animation Not Showing

**Solution:**
- Check "Enable Animation" toggle
- Refresh the page (F5)
- Check browser console for errors (F12)

### Effect Not Obvious

**Solution:**
- Increase "Interaction Intensity"
- Increase "Influence Radius"
- Use a larger, more visible image

### Page Lagging

**Solution:**
- Decrease "Influence Radius" (reduces calculations)
- Lower "Interaction Intensity"
- Use a smaller image file

### Not Working on Some Sites

**Solution:**
- Some sites (like Chrome internal pages, extension store) don't allow extensions for security reasons
- Sites using Shadow DOM may not fully support text detection
- This is expected behavior

## 🔮 Future Plans

- [ ] Multiple simultaneous animations
- [ ] Preset theme library
- [ ] GIF animation support
- [ ] Sound effects
- [ ] Animation trail recording
- [ ] Attraction mode (instead of repulsion)
- [ ] Gravity effects
- [ ] Elastic physics
- [ ] Particle trails
- [ ] Text highlighting
- [ ] Ripple effects
- [ ] WebGL rendering
- [ ] 3D effects

## 📄 License

MIT License

## 🙏 Acknowledgments

- [pretext](https://github.com/chenglou/pretext) - Inspiration for text layout
- Chrome Extensions API - Powerful browser extension capabilities

## 📮 Feedback & Contribution

Issues and Pull Requests are welcome!

---

**Enjoy interacting with text!** 🎉

# VeinVigil Documentation Diagrams

This directory contains beautiful React components for generating DevPost documentation images.

## Available Diagrams

### 1. System Architecture Diagram (`SystemDiagram.jsx`)
Professional visualization showing:
- ESP32 → Serial Bridge → Enrichment → WebSocket → React Frontend
- Data flow timeline
- Performance metrics panel
- Gradient-filled component boxes
- Arrow connectors with labels

### 2. Circuit Wiring Diagram (`WiringDiagram.jsx`)
KiCad-style schematic showing:
- ESP32 DevKit with pin labels
- DHT11 sensor connection (GPIO 4)
- FSR402 pressure sensor (GPIO 32)
- 47kΩ pull-down resistor
- Color-coded wiring (red=3.3V, blue=data, purple=ADC, black=GND)
- Component specification tables
- Voltage divider analysis

---

## How to Generate Screenshots

### Option 1: Add to Your Frontend (Recommended)

1. **Copy components to frontend:**
   ```bash
   cp docs/SystemDiagram.jsx frontend/src/docs/
   cp docs/WiringDiagram.jsx frontend/src/docs/
   ```

2. **Add temporary routes in `frontend/src/App.jsx`:**
   ```javascript
   import SystemDiagram from './docs/SystemDiagram';
   import WiringDiagram from './docs/WiringDiagram';

   // In your router or add as standalone routes:
   function App() {
     return (
       <div>
         {/* Your existing app */}

         {/* Temporary documentation routes */}
         <Route path="/docs/system" element={<SystemDiagram />} />
         <Route path="/docs/wiring" element={<WiringDiagram />} />
       </div>
     );
   }
   ```

3. **Start dev server:**
   ```bash
   cd frontend
   npm run dev
   ```

4. **Navigate and screenshot:**
   - System diagram: `http://localhost:5173/docs/system`
   - Wiring diagram: `http://localhost:5173/docs/wiring`

5. **Take screenshots:**
   - Set browser window to **1920x1080** (or 1400x700 for wiring)
   - Use browser screenshot tool (F12 → Cmd+Shift+P → "Capture screenshot")
   - Or use macOS: Cmd+Shift+4, select window
   - Or use Windows: Win+Shift+S

6. **Save images:**
   ```
   docs/system-architecture.png
   docs/wiring-diagram.png
   ```

### Option 2: Create a Standalone HTML File

If you don't want to modify your frontend:

1. **Create `docs/diagrams.html`:**
   ```html
   <!DOCTYPE html>
   <html>
   <head>
     <title>VeinVigil Diagrams</title>
     <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
     <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
     <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
   </head>
   <body>
     <div id="root"></div>
     <script type="text/babel">
       // Paste SystemDiagram.jsx content here (without import/export)
       // Then add: ReactDOM.render(<SystemDiagram />, document.getElementById('root'));
     </script>
   </body>
   </html>
   ```

2. **Open in browser:** `open docs/diagrams.html`

3. **Screenshot as above**

### Option 3: Use CodeSandbox (No Local Setup)

1. Go to https://codesandbox.io/s/react-new
2. Paste component code into `App.js`
3. View rendered diagram
4. Screenshot the preview pane

---

## Embedding in DevPost

### After generating screenshots:

1. **Upload images to DevPost** using their image upload tool

2. **Or use GitHub-hosted images:**
   ```bash
   git add docs/*.png
   git commit -m "Add documentation diagrams"
   git push
   ```

   Then in `DEVPOST.md`:
   ```markdown
   ![System Architecture](https://raw.githubusercontent.com/YOUR_USER/hackduke-2026/main/docs/system-architecture.png)
   ![Wiring Diagram](https://raw.githubusercontent.com/YOUR_USER/hackduke-2026/main/docs/wiring-diagram.png)
   ```

3. **Update placeholder links in DEVPOST.md:**
   Replace:
   ```markdown
   ![System Architecture Diagram](https://via.placeholder.com/...)
   ```

   With actual image URLs

---

## Diagram Specifications

### System Architecture
- **Recommended size:** 1920x1080 or 1400x650
- **Format:** PNG (lossless) or SVG
- **Background:** White (#ffffff) with gray border
- **Style:** Professional gradient fills, shadow effects

### Wiring Diagram
- **Recommended size:** 1400x700
- **Format:** PNG (lossless)
- **Background:** Light gray (#fafafa)
- **Style:** KiCad-inspired schematic with color-coded wires

---

## Customization

Both components are pure React with inline styles—no external dependencies needed beyond React itself.

**To modify:**
- Colors: Edit hex values in gradient definitions and fill attributes
- Layout: Adjust SVG viewBox and element positions
- Text: Edit text content directly in JSX
- Sizes: Modify width/height in container divs

**Component structure:**
```
<div style={{ /* Outer container */ }}>
  <div style={{ /* Inner card */ }}>
    <svg>
      {/* Diagram elements */}
    </svg>
    <div style={{ /* Tables/metrics */ }}>
  </div>
</div>
```

---

## Troubleshooting

**Components don't render:**
- Ensure React 18+ is installed: `npm list react`
- Check browser console for errors
- Verify JSX syntax if manually copying

**Screenshot quality is poor:**
- Use browser's native screenshot tool (not external app)
- Ensure window is exactly 1920x1080 before capturing
- Use PNG format, not JPEG (avoids compression artifacts)

**Diagrams look different than expected:**
- Check that fonts are loaded (system-ui, sans-serif are safe defaults)
- Ensure SVG viewBox matches your viewport
- Try different browsers (Chrome/Firefox recommended)

---

## Future Enhancements

Potential additions for V2:
- [ ] Export to SVG button
- [ ] Dark mode toggle
- [ ] Interactive elements (hover states, clickable components)
- [ ] Animation (data flow arrows)
- [ ] Printable PDF generation
- [ ] Embedded in Storybook for component documentation

---

## Credits

Diagrams created for HackDuke 2026 VeinVigil project.
Design inspiration: KiCad schematics, Figma wireframes, technical documentation best practices.

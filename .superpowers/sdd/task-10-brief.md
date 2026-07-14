### Task10: Add Material Symbols Font

**Files:**
- Modify: `index.html`

**Interfaces:**
- Consumes: Material Symbols font from Google Fonts
- Produces: Material Symbols available globally

- [ ] **Step1: Add Material Symbols link to index.html**

```html
<link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200" rel="stylesheet" />
```

- [ ] **Step2: Add global Material Symbols styles**

```css
.material-symbols-outlined {
  font-variation-settings:
    'FILL' 0,
    'wght' 300,
    'GRAD' 0,
    'opsz' 24;
}
```

- [ ] **Step3: Commit**

```bash
git add index.html
git commit -m "feat: add Material Symbols font"
```
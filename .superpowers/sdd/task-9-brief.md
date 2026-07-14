### Task9: Update Remaining Styles

**Files:**
- Modify: `src/styles/command-palette.css`
- Modify: `src/styles/telegram.css`

**Interfaces:**
- Consumes: Glass utilities from Task2
- Produces: Updated command palette and telegram modal styles

- [ ] **Step1: Update command-palette.css**

```css
.command-palette-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(var(--glass-blur-modal));
  -webkit-backdrop-filter: blur(var(--glass-blur-modal));
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 20vh;
  z-index: 1000;
}

.command-palette {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
  width: 100%;
  max-width: 560px;
  overflow: hidden;
}

.command-palette-input {
  width: 100%;
  padding: var(--space-lg);
  border: none;
  border-bottom: 1px solid var(--border);
  background: transparent;
  color: var(--text-primary);
  font-size: 16px;
  font-family: var(--font);
  outline: none;
}

.command-palette-input::placeholder {
  color: var(--text-muted);
}

.command-palette-list {
  max-height: 300px;
  overflow-y: auto;
  padding: var(--space-sm);
}

.command-palette-item {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-secondary);
  font-size: 14px;
  font-family: var(--font);
  cursor: pointer;
  width: 100%;
  text-align: left;
  transition: all var(--transition);
}

.command-palette-item:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.command-palette-item.active {
  background: rgba(208, 188, 255, 0.1);
  color: var(--primary);
}
```

- [ ] **Step2: Update telegram.css**

```css
.telegram-modal {
  width: 400px;
  max-height: 80vh;
}

.telegram-qr {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-lg);
}

.telegram-qr-code {
  background: var(--text-primary);
  padding: var(--space-md);
  border-radius: var(--radius-lg);
}

.telegram-qr-text {
  font-size: 13px;
  color: var(--text-secondary);
  text-align: center;
}
```

- [ ] **Step3: Commit**

```bash
git add src/styles/command-palette.css src/styles/telegram.css
git commit -m "feat: update command palette and telegram modal styles"
```
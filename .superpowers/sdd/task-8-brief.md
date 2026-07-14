### Task8: Update Settings and Notes Pages

**Files:**
- Modify: `src/styles/settings.css`
- Modify: `src/styles/notes.css`
- Modify: `src/components/SettingsPage.tsx`
- Modify: `src/components/NotesPage.tsx`

**Interfaces:**
- Consumes: Glass utilities from Task2
- Produces: Updated settings and notes pages

- [ ] **Step1: Update settings.css**

```css
.settings-page {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: var(--space-margin);
}

.settings-title {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-lg);
}

.settings-section {
  margin-bottom: var(--space-xl);
}

.settings-section-title {
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.1em;
  margin-bottom: var(--space-md);
}

.settings-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
}

.settings-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md) 0;
  border-bottom: 1px solid var(--border);
}

.settings-row:last-child {
  border-bottom: none;
}

.settings-row-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-primary);
}

.settings-row-description {
  font-size: 12px;
  color: var(--text-muted);
  margin-top: var(--space-xs);
}

.settings-btn {
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  border: none;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition);
  font-family: var(--font);
}

.settings-btn-primary {
  background: var(--primary);
  color: var(--on-primary);
}

.settings-btn-primary:hover {
  box-shadow: 0 0 20px var(--glass-glow);
}

.settings-btn-secondary {
  background: transparent;
  border: 1px solid var(--glass-border);
  color: var(--text-secondary);
}

.settings-btn-secondary:hover {
  background: rgba(255, 255, 255, 0.08);
}
```

- [ ] **Step2: Update notes.css**

```css
.notes-page {
  width: 100%;
  height: 100%;
  overflow-y: auto;
  padding: var(--space-margin);
}

.notes-title {
  font-size: 32px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-lg);
}

.notes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: var(--space-gutter);
}

.note-card {
  background: var(--glass-bg);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  transition: all var(--transition);
  cursor: pointer;
}

.note-card:hover {
  transform: translateY(-2px);
  border-color: rgba(208, 188, 255, 0.3);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.3);
}

.note-card-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.note-card-preview {
  font-size: 13px;
  color: var(--text-muted);
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.note-card-meta {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-top: var(--space-md);
  font-size: 11px;
  color: var(--text-muted);
}
```

- [ ] **Step3: Commit**

```bash
git add src/styles/settings.css src/styles/notes.css
git commit -m "feat: update settings and notes pages with glassmorphism"
```
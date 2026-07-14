### Task7: Update Modal Styles

**Files:**
- Modify: `src/styles/modals.css`

**Interfaces:**
- Consumes: Glass utilities from Task2
- Produces: Updated modal styles with glass effects

- [ ] **Step1: Update modals.css**

```css
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(var(--glass-blur-modal));
  -webkit-backdrop-filter: blur(var(--glass-blur-modal));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal {
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius-xl);
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.5);
  max-width: 520px;
  width: 90%;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-lg);
  border-bottom: 1px solid var(--border);
}

.modal-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-primary);
}

.modal-close {
  width: 32px;
  height: 32px;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: var(--text-muted);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition);
}

.modal-close:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.modal-body {
  padding: var(--space-lg);
  overflow-y: auto;
  flex: 1;
}

.modal-footer {
  display: flex;
  gap: var(--space-sm);
  justify-content: flex-end;
  padding: var(--space-lg);
  border-top: 1px solid var(--border);
}

.modal-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text-secondary);
  margin-bottom: var(--space-sm);
}

.modal-input {
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  background: rgba(0, 0, 0, 0.2);
  color: var(--text-primary);
  font-size: 14px;
  font-family: var(--font);
  outline: none;
  transition: all var(--transition);
}

.modal-input:focus {
  border-color: var(--border-focus);
}

.modal-actions {
  display: flex;
  gap: var(--space-sm);
  justify-content: flex-end;
}
```

- [ ] **Step2: Commit**

```bash
git add src/styles/modals.css
git commit -m "feat: update modal styles with glassmorphism effects"
```
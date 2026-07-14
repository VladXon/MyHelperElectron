### Task6: Update Content Area Styles

**Files:**
- Modify: `src/styles/content.css`

**Interfaces:**
- Consumes: Glass utilities from Task2
- Produces: Updated content area styles

- [ ] **Step1: Update content.css**

```css
.content {
  flex: 1;
  overflow: hidden;
  position: relative;
  background: var(--bg-primary);
}

.content-relative {
  position: relative;
  z-index: 1;
}

.content::before {
  content: '';
  position: fixed;
  inset: 0;
  background:
    radial-gradient(600px circle at 20% 30%, rgba(139, 92, 246, 0.03) 0%, transparent 60%),
    radial-gradient(500px circle at 80% 70%, rgba(99, 102, 241, 0.025) 0%, transparent 60%),
    radial-gradient(400px circle at 50% 0%, rgba(139, 92, 246, 0.015) 0%, transparent 50%);
  pointer-events: none;
  z-index: 0;
}
```

- [ ] **Step2: Commit**

```bash
git add src/styles/content.css
git commit -m "feat: update content area with glassmorphism background"
```
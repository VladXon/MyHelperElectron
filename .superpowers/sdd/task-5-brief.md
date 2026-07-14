### Task5: Update Titlebar Component and Styles

**Files:**
- Modify: `src/components/Titlebar.tsx`
- Modify: `src/styles/titlebar.css`

**Interfaces:**
- Consumes: Glass utilities from Task2
- Produces: Updated titlebar with glass effects

- [ ] **Step1: Update titlebar.css**

```css
.titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 60px;
  padding: 0 var(--space-margin);
  background: var(--bg-sidebar);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
  border-bottom: 1px solid var(--border);
  user-select: none;
  z-index: 10;
}

.titlebar-left {
  display: flex;
  align-items: center;
  gap: var(--space-lg);
}

.titlebar-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--text-primary);
  letter-spacing: -0.01em;
}

.titlebar-search {
  position: relative;
  width: 320px;
}

.titlebar-search-icon {
  position: absolute;
  left: var(--space-md);
  top: 50%;
  transform: translateY(-50%);
  color: rgba(203, 195, 215, 0.4);
  font-size: 16px;
}

.titlebar-search-input {
  width: 100%;
  padding: var(--space-sm) var(--space-md) var(--space-sm) 44px;
  border: 1px solid var(--border);
  border-radius: var(--radius-lg);
  background: rgba(255, 255, 255, 0.03);
  color: var(--text-primary);
  font-size: 14px;
  font-family: var(--font);
  outline: none;
  transition: all var(--transition);
}

.titlebar-search-input::placeholder {
  color: rgba(203, 195, 215, 0.3);
}

.titlebar-search-input:focus {
  border-color: var(--border-focus);
}

.titlebar-right {
  display: flex;
  align-items: center;
  gap: var(--space-md);
}

.titlebar-btn {
  width: 36px;
  height: 36px;
  border: none;
  border-radius: var(--radius-lg);
  background: transparent;
  color: rgba(203, 195, 215, 0.6);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all var(--transition);
}

.titlebar-btn:hover {
  background: var(--bg-hover);
  color: var(--text-primary);
}

.titlebar-btn-primary {
  background: var(--text-primary);
  color: var(--bg-primary);
  font-weight: 600;
}

.titlebar-btn-primary:hover {
  background: rgba(255, 255, 255, 0.9);
}

.titlebar-status {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 500;
}

.titlebar-status.online {
  color: var(--primary);
  background: rgba(208, 188, 255, 0.1);
}

.titlebar-status.offline {
  color: var(--error);
  background: rgba(255, 180, 171, 0.1);
}

.titlebar-status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}
```

- [ ] **Step2: Update Titlebar.tsx component**

```tsx
import { MagnifyingGlass, Bell, User } from '@phosphor-icons/react';

interface TitlebarProps {
  serverOnline: boolean;
  onReconnect: () => void;
}

export default function Titlebar({ serverOnline, onReconnect }: TitlebarProps) {
  return (
    <header className="titlebar">
      <div className="titlebar-left">
        <h2 className="titlebar-title">Studio Workspace</h2>
        <div className="titlebar-search">
          <span className="material-symbols-outlined titlebar-search-icon">search</span>
          <input
            className="titlebar-search-input"
            type="text"
            placeholder="Search presets..."
          />
        </div>
      </div>
      <div className="titlebar-right">
        <button className="titlebar-btn titlebar-btn-primary">Create</button>
        <button className="titlebar-btn">
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <button className="titlebar-btn">
          <span className="material-symbols-outlined">account_circle</span>
        </button>
      </div>
    </header>
  );
}
```

- [ ] **Step3: Commit**

```bash
git add src/components/Titlebar.tsx src/styles/titlebar.css
git commit -m "feat: update Titlebar with glassmorphism effects"
```
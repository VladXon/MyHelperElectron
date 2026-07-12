import { ipcMain, dialog, app } from 'electron';
import { spawn } from 'node:child_process';
import path from 'node:path';
import fs from 'node:fs';

interface PresetApp {
  name: string;
  path: string;
  runAsAdmin?: boolean;
}

interface Preset {
  id: string;
  name: string;
  icon: string;
  apps: PresetApp[];
  pinned?: boolean;
}

const PRESETS_FILE = path.join(app.getPath('userData'), 'presets.json');

function loadPresets(): Preset[] {
  try {
    if (fs.existsSync(PRESETS_FILE)) {
      return JSON.parse(fs.readFileSync(PRESETS_FILE, 'utf-8'));
    }
  } catch { /* ignore */ }
  return [];
}

function savePresets(presets: Preset[]) {
  try {
    fs.writeFileSync(PRESETS_FILE, JSON.stringify(presets, null, 2));
  } catch { /* ignore */ }
}

export function registerPresetsIPC(mainWindow: () => Electron.BrowserWindow | null) {
  ipcMain.handle('presets:get-all', () => {
    return loadPresets();
  });

  ipcMain.handle('presets:save', (_event, preset: Preset) => {
    const presets = loadPresets();
    const idx = presets.findIndex(p => p.id === preset.id);
    if (idx >= 0) {
      presets[idx] = preset;
    } else {
      presets.push(preset);
    }
    savePresets(presets);
  });

  ipcMain.handle('presets:delete', (_event, id: string) => {
    let presets = loadPresets();
    presets = presets.filter(p => p.id !== id);
    savePresets(presets);
  });

  ipcMain.handle('presets:launch', async (_event, apps: PresetApp[]) => {
    for (const app of apps) {
      try {
        if (app.runAsAdmin) {
          const psCmd = `Start-Process -Verb RunAs -FilePath ${JSON.stringify(app.path)} -WindowStyle Normal`;
          const encoded = Buffer.from(psCmd, 'utf16le').toString('base64');
          spawn('powershell.exe', ['-NoProfile', '-NonInteractive', '-WindowStyle', 'Hidden', '-EncodedCommand', encoded], { stdio: 'ignore' }).unref();
        } else {
          spawn(app.path, [], { shell: true, detached: true, stdio: 'ignore' });
        }
      } catch (err) {
        console.error(`Failed to launch ${app.name}:`, err);
      }
    }
    return { launched: apps.length };
  });

  ipcMain.handle('dialog:open-file', async () => {
    const win = mainWindow();
    if (!win) return null;
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      properties: ['openFile'],
      filters: [
        { name: 'Applications', extensions: ['exe', 'bat', 'cmd', 'lnk'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });
    if (canceled) return null;
    return filePaths[0];
  });
}

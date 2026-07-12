import fs from 'node:fs';
import path from 'node:path';

function getLinksPath(): string {
  return path.join(__dirname, '..', '..', 'HelperDesktop.telegram', 'bot-links.json');
}

export function loadLinks(): { linkedUsers: Record<number, string>; adminIds: number[] } {
  try {
    const p = getLinksPath();
    if (fs.existsSync(p)) {
      const raw = JSON.parse(fs.readFileSync(p, 'utf-8'));
      if (raw && typeof raw === 'object' && !raw.linkedUsers) {
        const migrated = { linkedUsers: raw as Record<number, string>, adminIds: raw.adminIds ?? [] };
        saveLinks(migrated);
        return migrated;
      }
      return raw;
    }
  } catch { /* ignore */ }
  return { linkedUsers: {}, adminIds: [] };
}

export function saveLinks(links: { linkedUsers: Record<number, string>; adminIds: number[] }) {
  try {
    fs.writeFileSync(getLinksPath(), JSON.stringify(links, null, 2));
  } catch { /* ignore */ }
}

export function linkTelegram(telegramId: number, login: string, isDev: boolean): boolean {
  const links = loadLinks();
  links.linkedUsers[telegramId] = login;

  if (isDev && !links.adminIds.includes(telegramId)) {
    links.adminIds.push(telegramId);
  }

  saveLinks(links);
  return true;
}

export function unlinkTelegram(login: string): boolean {
  const links = loadLinks();
  const entry = Object.entries(links.linkedUsers).find(([, l]) => l === login);
  if (!entry) return false;

  const telegramId = Number(entry[0]);
  delete links.linkedUsers[telegramId];
  links.adminIds = links.adminIds.filter(id => id !== telegramId);
  saveLinks(links);
  return true;
}

export function getLinkedTelegramId(login: string): number | null {
  const links = loadLinks();
  const entry = Object.entries(links.linkedUsers).find(([, l]) => l === login);
  return entry ? Number(entry[0]) : null;
}
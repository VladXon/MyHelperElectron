import fs from 'node:fs';
import path from 'node:path';
import { logger } from '../../HelperDesktop.server/src/logger';

const CONFIG_DIR = path.join(__dirname, '..');
const CONFIG_PATH = path.join(CONFIG_DIR, 'bot-config.json');

interface BotConfig {
  token: string;
}

const defaults: BotConfig = {
  token: process.env.BOT_TOKEN || '',
};

export function loadConfig(): BotConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const data = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
      return { ...defaults, ...data };
    }
  } catch (err) {
    logger.error('Failed to load bot config', err as Error);
  }
  return defaults;
}

export function saveConfig(config: BotConfig) {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
  } catch (err) {
    logger.error('Failed to save bot config', err as Error);
  }
}
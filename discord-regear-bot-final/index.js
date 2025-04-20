import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import dotenv from 'dotenv';

dotenv.config();

// 幫助 ESM 環境取得 __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// ✅ 載入指令：改為從 jh_helper-main/commands/fun 讀取
const commandsPath = path.join(__dirname, 'jh_helper-main/commands/fun');
if (fs.existsSync(commandsPath)) {
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = await import(`file://${filePath}`);
    const c = command.default || command;
    if (c.data && c.execute) {
      client.commands.set(c.data.name, c);
    }
  }
} else {
  console.warn('⚠️ 找不到指令資料夾 jh_helper-main/commands/fun');
}

// ✅ 載入事件
const eventsPath = path.join(__dirname, 'events');
if (fs.existsSync(eventsPath)) {
  const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));
  for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = await import(`file://${filePath}`);
    const e = event.default || event;
    if (e.name && e.execute) {
      client.on(e.name, (...args) => e.execute(...args));
    }
  }
}

client.login(process.env.TOKEN);

client.login(process.env.TOKEN);

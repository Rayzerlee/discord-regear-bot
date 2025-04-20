import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import fs from 'fs';

config(); // 載入 .env

const commands = [];
const commandFiles = fs.readdirSync('./jh_helper-main/commands/fun').filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = await import(`./jh_helper-main/commands/fun/${file}`);
  if (command.data) {
    commands.push(command.data.toJSON());
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = '1311873920294588426'; // 👈 你提供的伺服器 ID

try {
  console.log('⏳ 正在註冊指令到指定伺服器...');
  await rest.put(
    Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
    { body: commands }
  );
  console.log('✅ Slash 指令已註冊（伺服器內立即生效）');
} catch (error) {
  console.error('❌ 指令註冊失敗：', error);
}

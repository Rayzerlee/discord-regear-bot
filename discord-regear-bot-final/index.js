const fs = require('fs');
const path = require('path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// ✅ 載入指令
const commandsPath = path.join(__dirname, 'jh_helper-main/commands/fun');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  if (command.data && command.execute) {
    client.commands.set(command.data.name, command);
    console.log(`✅ 載入指令：/${command.data.name}`);
  } else {
    console.log(`❌ 無效指令檔案：${file}`);
  }
}

// ✅ 載入事件
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.existsSync(eventsPath) ? fs.readdirSync(eventsPath).filter(file => file.endsWith('.js')) : [];

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = require(filePath);
  if (event.name && event.execute) {
    client.on(event.name, (...args) => event.execute(...args));
    console.log(`✅ 綁定事件：${event.name}`);
  }
}

client.login(process.env.TOKEN);

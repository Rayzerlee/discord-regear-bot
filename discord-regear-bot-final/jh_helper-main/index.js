const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, GatewayIntentBits } = require('discord.js');

// ✅ 從環境變數讀取 token
const token = process.env.DISCORD_TOKEN;

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();
const foldersPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(foldersPath);

// 🔁 載入所有指令
for (const folder of commandFolders) {
  const commandsPath = path.join(foldersPath, folder);
  const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));
  for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
      client.commands.set(command.data.name, command);
    } else {
      console.log(`[WARNING] 指令缺少必要屬性: ${filePath}`);
    }
  }
}

client.once('ready', () => {
  console.log(`✅ Bot 已上線！帳號：${client.user.tag}`);
});

// 🔥 處理 / 指令觸發
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) {
    console.error(`❌ 找不到對應指令：${interaction.commandName}`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`❌ 指令執行錯誤：`, error);
    await interaction.reply({ content: '⚠️ 執行指令時發生錯誤。', ephemeral: true });
  }
});

// 🟢 登入機器人
console.log("🔍 DISCORD_TOKEN 存在？", !!process.env.DISCORD_TOKEN);
console.log("🔍 Token 長度：", process.env.DISCORD_TOKEN?.length);

client.login(token);





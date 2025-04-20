const { Events } = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = interaction.client.commands.get(interaction.commandName);

    if (!command) {
      console.log(`⚠️ 找不到指令：${interaction.commandName}`);
      return;
    }

    try {
      console.log(`➡️ 正在執行指令：/${interaction.commandName}`);
      await command.execute(interaction);
    } catch (error) {
      console.error('❌ 執行指令錯誤：', error);

      if (!interaction.replied) {
        await interaction.reply({
          content: '❌ 發生錯誤，請稍後再試。',
          ephemeral: true,
        });
      }
    }
  }
};

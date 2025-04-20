const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('regear')
    .setDescription('測試指令'),

  async execute(interaction) {
    await interaction.reply({
      content: '✅ 指令觸發成功，代表載入 & 回應都 OK',
      ephemeral: true,
    });
  }
};

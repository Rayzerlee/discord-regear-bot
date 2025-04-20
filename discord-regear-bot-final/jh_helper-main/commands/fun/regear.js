const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('regear')
    .setDescription('這是一個測試用指令'),

  async execute(interaction) {
    console.log('✅ /regear 被執行');
    await interaction.reply({
      content: '✅ 測試成功！指令有被觸發並回應',
      ephemeral: true,
    });
  }
};

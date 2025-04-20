const { SlashCommandBuilder } = require('discord.js');

const TIER_ROLES = {
  T8: '1332344637972680714', // T8補裝
  T9: '1332344706717188147'  // T9補裝
};

module.exports = {
  data: new SlashCommandBuilder()
    .setName('regear')
    .setDescription('補裝申請指令'),

  async execute(interaction) {
    const member = interaction.member;

    if (!member || !member.roles) {
      return interaction.reply({
        content: '⚠️ 無法讀取使用者角色資料。',
        ephemeral: true
      });
    }

    // 依照身分組確認 T8 或 T9 補裝
    let tier = null;
    if (member.roles.cache.has(TIER_ROLES.T8)) {
      tier = 'T8';
    } else if (member.roles.cache.has(TIER_ROLES.T9)) {
      tier = 'T9';
    }

    if (!tier) {
      return interaction.reply({
        content: '❌ 你沒有補裝身分組，請確認你是否擁有 T8 或 T9 補裝角色。',
        ephemeral: true
      });
    }

    // ✅ 如果進入這裡，就代表有對應身分組了
    return interaction.reply({
      content: `✅ 補裝確認成功，你的補裝等級為 **${tier}**！`,
      ephemeral: false
    });
  }
};

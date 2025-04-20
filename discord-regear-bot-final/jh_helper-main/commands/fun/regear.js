const {
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('regear')
    .setDescription('申請補裝流程')
    .addStringOption(option =>
      option.setName('albionid')
        .setDescription('請輸入你的 Albion 玩家 ID')
        .setRequired(true)
    ),

  async execute(interaction) {
    const albionId = interaction.options.getString('albionid');

    try {
      const res = await fetch(`https://gameinfo.albiononline.com/api/gameinfo/players/${albionId}/deaths`);
      if (!res.ok) throw new Error('查詢失敗');

      const data = await res.json();
      const deaths = data.slice(0, 10);

      if (deaths.length === 0) {
        return interaction.reply({ content: '找不到死亡紀錄。', ephemeral: true });
      }

      const options = deaths.map((death, index) => new StringSelectMenuOptionBuilder()
        .setLabel(`${death.TimeStamp.split('T')[0]} - ${death.Victim.Name}`)
        .setDescription(`地點: ${death.Location} | 擊殺者: ${death.Killer?.Name || '未知'}`)
        .setValue(`death_${index}|${albionId}`) // 傳遞 death index + 玩家 ID
      );

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select_death_record')
        .setPlaceholder('請選擇一筆死亡紀錄')
        .addOptions(options);

      const row = new ActionRowBuilder().addComponents(selectMenu);
      await interaction.reply({ content: '請選擇要補裝的死亡紀錄：', components: [row], ephemeral: true });

      // 將死亡資料暫存到記憶體中（如需支援多玩家可改為使用資料庫）
      interaction.client._regearTemp = interaction.client._regearTemp || {};
      interaction.client._regearTemp[interaction.user.id] = deaths;

    } catch (err) {
      console.error('API 錯誤', err);
      return interaction.reply({ content: '查詢失敗，請確認 ID 是否正確。', ephemeral: true });
    }
  },
};

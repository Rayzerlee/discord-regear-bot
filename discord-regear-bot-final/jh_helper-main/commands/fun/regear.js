const {
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
} = require('discord.js');
const fetch = require('node-fetch');

const API_BASE = 'https://gameinfo-sgp.albiononline.com/api/gameinfo'; // 🌏 亞洲伺服器

module.exports = {
  data: new SlashCommandBuilder()
    .setName('regear')
    .setDescription('輸入玩家名稱來申請補裝（亞洲伺服器）')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('請輸入你的 Albion 玩家名稱')
        .setRequired(true)
    ),

  async execute(interaction) {
    const playerName = interaction.options.getString('name');
    await interaction.deferReply({ ephemeral: true });

    try {
      const searchRes = await fetch(`${API_BASE}/search?q=${encodeURIComponent(playerName)}`);
      if (!searchRes.ok) throw new Error('查詢失敗');

      const searchData = await searchRes.json();
      const player = searchData.players?.[0];

      if (!player) {
        return interaction.editReply({ content: `❌ 找不到名稱為「${playerName}」的玩家。` });
      }

      if (player.Name.toLowerCase() !== playerName.toLowerCase()) {
        return interaction.editReply({
          content: `⚠️ 找不到精確名稱為「${playerName}」的玩家，但找到相近名稱「${player.Name}」，請確認。`
        });
      }

      const albionId = player.Id;

      const deathsRes = await fetch(`${API_BASE}/players/${albionId}/deaths`);
      if (!deathsRes.ok) throw new Error('查詢死亡紀錄失敗');

      const deathData = await deathsRes.json();
      const deaths = deathData.slice(0, 10);

      if (deaths.length === 0) {
        return interaction.editReply({ content: '此玩家在亞洲伺服器上沒有死亡紀錄。' });
      }

      const options = deaths.map((death, index) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(`${death.TimeStamp.split('T')[0]} - ${death.Victim.Name}`)
          .setDescription(`地點: ${death.Location} | 擊殺者: ${death.Killer?.Name || '未知'}`)
          .setValue(`death_${index}|${albionId}`)
      );

      const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('select_death_record')
        .setPlaceholder('請選擇要補裝的死亡紀錄')
        .addOptions(options);

      const row = new ActionRowBuilder().addComponents(selectMenu);
      await interaction.editReply({
        content: '請選擇一筆死亡紀錄開始補裝流程：',
        components: [row],
      });

      interaction.client._regearTemp = interaction.client._regearTemp || {};
      interaction.client._regearTemp[interaction.user.id] = deaths;
    } catch (err) {
      console.error('[regear 錯誤]', err);
      return interaction.editReply({ content: '❌ 查詢失敗，請稍後再試或檢查輸入是否正確。' });
    }
  },
};

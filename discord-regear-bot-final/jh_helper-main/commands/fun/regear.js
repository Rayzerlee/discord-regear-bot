const {
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
} = require('discord.js');
const fetch = require('node-fetch');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('regear')
    .setDescription('輸入玩家名稱來申請補裝')
    .addStringOption(option =>
      option.setName('name')
        .setDescription('請輸入你的 Albion 玩家名稱')
        .setRequired(true)
    ),

  async execute(interaction) {
    const playerName = interaction.options.getString('name');

    // ✅ 延遲回應避免 Discord 超時
    await interaction.deferReply({ ephemeral: true });

    // 查詢玩家 ID
    const searchUrl = `https://gameinfo.albiononline.com/api/gameinfo/search?q=${encodeURIComponent(playerName)}`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) {
      return interaction.editReply({ content: '查詢失敗，請稍後再試。' });
    }

    const searchData = await searchRes.json();
    const player = searchData.players?.[0];

    if (!player) {
      return interaction.editReply({ content: `找不到玩家「${playerName}」，請確認拼寫。` });
    }

    if (player.Name.toLowerCase() !== playerName.toLowerCase()) {
      return interaction.editReply({
        content: `⚠️ 找不到精確名稱為「${playerName}」的玩家，但找到相近名稱：「${player.Name}」，請確認後再試一次。`
      });
    }

    const albionId = player.Id;

    // 查詢死亡紀錄
    const deathsUrl = `https://gameinfo.albiononline.com/api/gameinfo/players/${albionId}/deaths`;
    const deathsRes = await fetch(deathsUrl);
    if (!deathsRes.ok) {
      return interaction.editReply({ content: '取得死亡紀錄失敗。' });
    }

    const data = await deathsRes.json();
    const deaths = data.slice(0, 10);

    if (deaths.length === 0) {
      return interaction.editReply({ content: '這位玩家目前沒有死亡紀錄。' });
    }

    const options = deaths.map((death, index) => new StringSelectMenuOptionBuilder()
      .setLabel(`${death.TimeStamp.split('T')[0]} - ${death.V

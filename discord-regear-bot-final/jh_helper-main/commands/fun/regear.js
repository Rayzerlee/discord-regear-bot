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

    // ✅ 一開始就延遲回應，避免 Discord 判定超時
    await interaction.deferReply({ ephemeral: true });

    // 第一步：透過名稱查詢 UUID
    const searchUrl = `https://gameinfo.albiononline.com/api/gameinfo/search?q=${encodeURIComponent(playerName)}`;
    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) {
      return interaction.editReply({ content: '找不到玩家，請確認名字是否正確。' });
    }

    const searchData = await searchRes.json();
    const player = searchData.players?.find(p => p.Name.toLowerCase() === playerName.toLowerCase());

    if (!player) {
      return interaction.editReply({ content: '找不到該玩家，請確認名稱拼寫。' });
    }

    const albionId = player.Id;

    // 第二步：用 UUID 查死亡紀錄
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
      .setLabel(`${death.TimeStamp.split('T')[0]} - ${death.Victim.Name}`)
      .setDescription(`地點: ${death.Location} | 擊殺者: ${death.Killer?.Name || '未知'}`)
      .setValue(`death_${index}|${albionId}`)
    );

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select_death_record')
      .setPlaceholder('請選擇要補裝的死亡紀錄')
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(selectMenu);
    await interaction.editReply({ content: '請選擇要補裝的死亡紀錄：', components: [row] });

    interaction.client._regearTemp = interaction.client._regearTemp || {};
    interaction.client._regearTemp[interaction.user.id] = deaths;
  },
};

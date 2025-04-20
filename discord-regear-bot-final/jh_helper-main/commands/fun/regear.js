const {
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const { getRecentDeaths } = require('../../utils/deathsFetcher');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('regear')
    .setDescription('申請補裝流程'),

  async execute(interaction) {
    const userId = interaction.user.id;
    const deaths = await getRecentDeaths(userId, 10);

    if (!deaths || deaths.length === 0) {
      return interaction.reply({ content: '找不到死亡紀錄。', ephemeral: true });
    }

    const options = deaths.map((death, index) => new StringSelectMenuOptionBuilder()
      .setLabel(`${death.TimeStamp.split('T')[0]} - ${death.Victim.Name}`)
      .setDescription(`地點: ${death.Location} | 擊殺者: ${death.Killer?.Name || '未知'}`)
      .setValue(`death_${index}`)
    );

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId('select_death_record')
      .setPlaceholder('請選擇一筆死亡紀錄')
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(selectMenu);
    await interaction.reply({ content: '請選擇要補裝的死亡紀錄：', components: [row], ephemeral: true });
  },
};

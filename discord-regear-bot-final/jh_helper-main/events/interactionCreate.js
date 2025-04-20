const {
  Events,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require('discord.js');
const logger = require('../logger.js');
require('dotenv').config();

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (
      !interaction.isChatInputCommand() &&
      !interaction.isStringSelectMenu() &&
      !interaction.isModalSubmit()
    ) return;

    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (error) {
        logger.error(error);
        await interaction.reply({ content: '執行指令時發生錯誤', ephemeral: true });
      }
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'select_death_record') {
      const [selectedValue] = interaction.values;
      const [index, albionId] = selectedValue.split('|');
      const deaths = interaction.client._regearTemp?.[interaction.user.id];

      if (!deaths || !deaths[index]) {
        return interaction.reply({ content: '紀錄已過期或錯誤，請重新執行指令。', ephemeral: true });
      }

      const selectedDeath = deaths[index];

      const modal = new ModalBuilder()
        .setCustomId(`regear_modal_${index}|${albionId}`)
        .setTitle('補裝資訊填寫');

      const timeInput = new TextInputBuilder()
        .setCustomId('death_time')
        .setLabel('死亡時間')
        .setStyle(TextInputStyle.Short)
        .setValue(selectedDeath.TimeStamp.split('T')[0])
        .setRequired(true);

      const callerInput = new TextInputBuilder()
        .setCustomId('caller')
        .setLabel('Caller')
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const contentInput = new TextInputBuilder()
        .setCustomId('content')
        .setLabel('補裝內容')
        .setStyle(TextInputStyle.Paragraph)
        .setRequired(true);

      modal.addComponents(
        new ActionRowBuilder().addComponents(timeInput),
        new ActionRowBuilder().addComponents(callerInput),
        new ActionRowBuilder().addComponents(contentInput)
      );

      await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId.startsWith('regear_modal_')) {
      const command = interaction.client.commands.get('regear');
      if (command && command.handleModal) {
        try {
          await command.handleModal(interaction);
        } catch (err) {
          logger.error('補裝表單送出處理失敗：', err);
          await interaction.reply({ content: '❌ 發生錯誤，請稍後再試。', ephemeral: true });
        }
      }
    }
  },
};

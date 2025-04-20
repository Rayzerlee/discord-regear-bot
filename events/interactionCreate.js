const { Events, ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (interaction.isChatInputCommand()) {
      const command = interaction.client.commands.get(interaction.commandName);
      if (!command) return;
      try {
        await command.execute(interaction);
      } catch (err) {
        console.error('執行指令錯誤：', err);
        if (!interaction.replied) {
          await interaction.reply({ content: '❌ 指令失敗', ephemeral: true });
        }
      }
    }

    if (interaction.isStringSelectMenu() && interaction.customId === 'select_death_record') {
      const [selectedValue] = interaction.values;
      const [index, albionId] = selectedValue.split('|');
      const deaths = interaction.client._tempDeaths?.[interaction.user.id];
      if (!deaths || !deaths[index]) {
        return interaction.reply({ content: '❌ 死亡紀錄已過期', ephemeral: true });
      }
      const selected = deaths[index];

      const modal = new ModalBuilder()
        .setCustomId(`regear_modal_${index}|${albionId}`)
        .setTitle('補裝資訊');

      const timeInput = new TextInputBuilder()
        .setCustomId('death_time')
        .setLabel('死亡時間')
        .setStyle(TextInputStyle.Short)
        .setValue(selected.TimeStamp.split('T')[0])
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
      if (command?.handleModal) {
        try {
          await command.handleModal(interaction);
        } catch (err) {
          console.error('Modal submit error:', err);
          if (!interaction.replied) {
            await interaction.reply({ content: '❌ Modal 發生錯誤', ephemeral: true });
          }
        }
      }
    }
  }
};

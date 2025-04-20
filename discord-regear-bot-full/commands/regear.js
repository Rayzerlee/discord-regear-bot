const {
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require('discord.js');
const { google } = require('googleapis');
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const credentials = require('../google-sheet.json');

const API_BASE = 'https://gameinfo-sgp.albiononline.com/api/gameinfo';
const SPREADSHEET_ID = '請替換為你的試算表ID';

async function appendToSheet({ time, playerName, caller, content, discordName }) {
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
  const sheets = google.sheets({ version: 'v4', auth: await auth.getClient() });
  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: '工作表1!A1',
    valueInputOption: 'USER_ENTERED',
    resource: { values: [[time, playerName, caller, content, discordName]] },
  });
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('regear')
    .setDescription('申請補裝')
    .addStringOption(opt => opt.setName('name').setDescription('你的遊戲ID').setRequired(true)),

  async execute(interaction) {
    const name = interaction.options.getString('name');
    await interaction.deferReply({ ephemeral: true });

    try {
      const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(name)}`);
      const json = await res.json();
      const player = json.players?.[0];
      if (!player) return interaction.editReply({ content: '❌ 找不到該玩家' });

      const deathRes = await fetch(`${API_BASE}/players/${player.Id}/deaths`);
      const deaths = (await deathRes.json()).slice(0, 10);
      if (!deaths.length) return interaction.editReply({ content: '⚠️ 沒有死亡紀錄' });

      const options = deaths.map((d, i) =>
        new StringSelectMenuOptionBuilder()
          .setLabel(`${d.TimeStamp.split('T')[0]} - ${d.Victim.Name}`)
          .setDescription(`地點: ${d.Location}`)
          .setValue(`death_${i}|${player.Id}`)
      );

      const menu = new StringSelectMenuBuilder()
        .setCustomId('select_death_record')
        .setPlaceholder('選擇一筆死亡紀錄')
        .addOptions(options);

      interaction.client._tempDeaths = interaction.client._tempDeaths || {};
      interaction.client._tempDeaths[interaction.user.id] = deaths;

      await interaction.editReply({
        content: '請選擇一筆死亡紀錄：',
        components: [new ActionRowBuilder().addComponents(menu)],
      });
    } catch (err) {
      console.error(err);
      await interaction.editReply({ content: '❌ 發生錯誤' });
    }
  },

  async handleModal(interaction) {
    try {
      const deathTime = interaction.fields.getTextInputValue('death_time');
      const caller = interaction.fields.getTextInputValue('caller');
      const content = interaction.fields.getTextInputValue('content');

      const [_, index, albionId] = interaction.customId.match(/regear_modal_(\d+)\|(.*)/);
      const death = interaction.client._tempDeaths?.[interaction.user.id]?.[index];
      if (!death) throw new Error('死亡紀錄已過期');

      await appendToSheet({
        time: deathTime,
        playerName: death.Victim.Name,
        caller,
        content,
        discordName: interaction.user.tag,
      });

      await interaction.reply({ content: '✅ 補裝紀錄已提交', ephemeral: true });
    } catch (err) {
      console.error('Modal error:', err);
      if (!interaction.replied) {
        await interaction.reply({ content: '❌ 發生錯誤', ephemeral: true });
      }
    }
  }
};

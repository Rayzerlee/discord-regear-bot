import {
  SlashCommandBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from 'discord.js';
import fetch from 'node-fetch';
import { google } from 'googleapis';
import credentials from '../../virus-457405-4dd9633ef8bd.json' assert { type: "json" };

const API_BASE = 'https://gameinfo-sgp.albiononline.com/api/gameinfo';
const SPREADSHEET_ID = '1Ec3tJ1eRn692foIM7QUfOy2RYenH_IWOsPuj8E6AV5c';

async function appendRegearRecord({ time, playerName, caller, content, discordName }) {
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const client = await auth.getClient();
  const sheets = google.sheets({ version: 'v4', auth: client });

  const row = [[time, playerName, caller, content, discordName]];

  await sheets.spreadsheets.values.append({
    spreadsheetId: SPREADSHEET_ID,
    range: '工作表1!A1',
    valueInputOption: 'USER_ENTERED',
    resource: { values: row },
  });
}

export const data = new SlashCommandBuilder()
  .setName('regear')
  .setDescription('輸入玩家名稱來申請補裝（亞洲伺服器）')
  .addStringOption(option =>
    option.setName('name')
      .setDescription('請輸入你的 Albion 玩家名稱')
      .setRequired(true)
  );

export async function execute(interaction) {
  const playerName = interaction.options.getString('name');
  await interaction.deferReply({ ephemeral: true });

  try {
    const searchRes = await fetch(`${API_BASE}/search?q=${encodeURIComponent(playerName)}`);
    const searchData = await searchRes.json();
    const player = searchData.players?.[0];
    if (!player) {
      return interaction.editReply({ content: `❌ 找不到名稱為「${playerName}」的玩家。` });
    }

    const albionId = player.Id;
    const deathsRes = await fetch(`${API_BASE}/players/${albionId}/deaths`);
    const deathData = await deathsRes.json();
    const deaths = deathData.slice(0, 10);

    if (deaths.length === 0) {
      return interaction.editReply({ content: '這位玩家目前沒有死亡紀錄。' });
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
    return interaction.editReply({ content: '❌ 查詢失敗，請稍後再試或檢查名稱拼寫。' });
  }
}

export async function handleModal(interaction) {
  const deathTime = interaction.fields.getTextInputValue('death_time');
  const caller = interaction.fields.getTextInputValue('caller');
  const content = interaction.fields.getTextInputValue('content');

  const [_, index, albionId] = interaction.customId.match(/regear_modal_(\d+)\|(.*)/) || [];
  const deaths = interaction.client._regearTemp?.[interaction.user.id];
  const playerName = deaths?.[index]?.Victim?.Name || '未知';

  try {
    await appendRegearRecord({
      time: deathTime,
      playerName,
      caller,
      content,
      discordName: interaction.user.tag,
    });

    await interaction.reply({
      content: `✅ 已成功提交補裝紀錄，感謝填寫！`,
      ephemeral: true,
    });
  } catch (err) {
    console.error('❌ Google Sheets 寫入失敗', err);
    if (!interaction.replied) {
      await interaction.reply({
        content: '❌ 無法寫入試算表，請稍後再試。',
        ephemeral: true,
      });
    }
  }
}

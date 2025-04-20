const fetch = require('node-fetch');

// Discord ID ➜ Albion 玩家 ID 映射
const userAlbionIdMap = {
  '123456789012345678': 'G8XkZm3_SduVJ8V33LGdGA',
};

/**
 * 根據 Discord ID 從 Albion API 抓最近死亡紀錄
 * @param {string} discordUserId
 * @param {number} limit
 * @returns {Promise<Array>}
 */
async function getRecentDeaths(discordUserId, limit = 10) {
  const albionId = userAlbionIdMap[discordUserId];
  if (!albionId) return [];

  try {
    const res = await fetch(`https://gameinfo.albiononline.com/api/gameinfo/players/${albionId}/deaths`);
    if (!res.ok) throw new Error('API 失敗');

    const data = await res.json();
    return data.slice(0, limit);
  } catch (err) {
    console.error('取得死亡紀錄失敗:', err);
    return [];
  }
}

module.exports = {
  getRecentDeaths,
};

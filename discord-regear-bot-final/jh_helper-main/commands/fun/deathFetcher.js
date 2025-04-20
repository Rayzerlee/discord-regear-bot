const fetch = require('node-fetch');

// 模擬 Discord ID 對應到 Albion Online ID 的查找
const userAlbionIdMap = {
  // 'discordId': 'albionId'
  '123456789012345678': 'G8XkZm3_SduVJ8V33LGdGA',
  // 更多使用者...
};

/**
 * 根據 Discord 使用者 ID，從 Albion API 抓最近的死亡紀錄
 * @param {string} discordUserId - Discord 使用者 ID
 * @param {number} limit - 要抓幾筆紀錄
 * @returns {Promise<Array>} 死亡紀錄陣列
 */
async function getRecentDeaths(discordUserId, limit = 10) {
  const albionId = userAlbionIdMap[discordUserId];
  if (!albionId) return [];

  try {
    const res = await fetch(`https://gameinfo.albiononline.com/api/gameinfo/players/${albionId}/deaths`);
    if (!res.ok) throw new Error('API 失敗');

    const data = await res.json();
    return data.slice(0, limit); // 只取前幾筆
  } catch (err) {
    console.error('取得死亡紀錄失敗:', err);
    return [];
  }
}

module.exports = {
  getRecentDeaths,
};

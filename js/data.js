/**
 * 智能硬件新闻数据模块
 * 提供新闻数据的加载、排序、筛选和搜索功能
 */

/**
 * 加载新闻数据
 * 兼容两种格式：纯数组 或 {updatedAt, news} 对象
 * @returns {Promise<{news: Array, updatedAt: string|null}>}
 */
async function loadNews() {
  try {
    const response = await fetch('data/news.json');
    if (!response.ok) {
      throw new Error('加载新闻数据失败: ' + response.status);
    }
    const data = await response.json();
    // 兼容两种格式
    if (Array.isArray(data)) {
      return { news: data, updatedAt: null };
    }
    return { news: data.news || [], updatedAt: data.updatedAt || null };
  } catch (error) {
    console.error('加载新闻数据出错:', error);
    return { news: [], updatedAt: null };
  }
}

/**
 * 按日期倒序排列新闻
 * @param {Array} news - 新闻数组
 * @returns {Array} 排序后的新闻数组（不修改原数组）
 */
function sortByDate(news) {
  return [...news].sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * 按分类筛选新闻
 * @param {Array} news - 新闻数组
 * @param {string} category - 分类名称，"all" 返回全部
 * @returns {Array} 筛选后的新闻数组
 */
function filterByCategory(news, category) {
  if (!category || category === 'all') {
    return news;
  }
  return news.filter(item => item.category === category);
}

/**
 * 按关键词搜索新闻（不区分大小写的模糊搜索）
 * @param {Array} news - 新闻数组
 * @param {string} keyword - 搜索关键词
 * @returns {Array} 匹配的新闻数组
 */
function searchNews(news, keyword) {
  if (!keyword || keyword.trim() === '') {
    return news;
  }
  const lowerKeyword = keyword.toLowerCase().trim();
  return news.filter(item => {
    const title = (item.title || '').toLowerCase();
    const summary = (item.summary || '').toLowerCase();
    return title.includes(lowerKeyword) || summary.includes(lowerKeyword);
  });
}

// 导出函数到全局作用域
window.NewsData = {
  loadNews,
  sortByDate,
  filterByCategory,
  searchNews
};

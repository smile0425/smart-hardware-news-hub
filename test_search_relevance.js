/**
 * 属性测试：搜索结果相关性
 * Validates: Requirements 3.2
 *
 * 属性 2：搜索结果相关性
 * - 验证搜索结果中每条新闻的标题或摘要包含搜索关键词（不区分大小写）
 * - 验证空搜索返回全部新闻
 * - 验证搜索结果是原数组的子集
 * - 验证大小写不敏感
 */

const fs = require('fs');
const path = require('path');

// ============ 轻量级属性测试框架 ============

const NUM_RUNS = 100; // 每个属性测试运行次数
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures = [];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr) {
  return arr[randomInt(0, arr.length - 1)];
}

function randomString(len) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let s = '';
  for (let i = 0; i < len; i++) {
    s += chars[randomInt(0, chars.length - 1)];
  }
  return s;
}


/**
 * 生成随机新闻数组
 * @param {number} count - 新闻条数
 * @returns {Array} 随机新闻数组
 */
function generateRandomNews(count) {
  const keywords = ['AI', 'GPU', 'chip', 'robot', 'sensor', 'camera', 'display', 'battery', 'wifi', 'bluetooth'];
  const news = [];
  for (let i = 0; i < count; i++) {
    const kw1 = randomChoice(keywords);
    const kw2 = randomChoice(keywords);
    news.push({
      id: i + 1,
      title: `新闻标题_${kw1}_${randomString(4)}`,
      summary: `摘要内容_${kw2}_${randomString(6)}`,
      category: randomChoice(['芯片', 'AI', '智能家居', '物联网', '机器人']),
      date: `2025-${String(randomInt(1, 12)).padStart(2, '0')}-${String(randomInt(1, 28)).padStart(2, '0')}`,
      source: `来源_${randomString(4)}`,
      url: '#',
      image: ''
    });
  }
  return news;
}

function propertyTest(name, numRuns, testFn) {
  for (let i = 0; i < numRuns; i++) {
    totalTests++;
    try {
      testFn(i);
      passedTests++;
    } catch (e) {
      failedTests++;
      failures.push({ name, run: i, error: e.message });
      // 输出第一个失败的反例后停止该属性
      console.log(`  FAIL [run ${i}]: ${e.message}`);
      return false;
    }
  }
  return true;
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// ============ 加载被测模块 ============

const dataJsPath = path.join(__dirname, 'js', 'data.js');
const newsJsonPath = path.join(__dirname, 'data', 'news.json');

const code = fs.readFileSync(dataJsPath, 'utf8');
const modifiedCode = code.replace('window.NewsData', 'global.NewsData');
eval(modifiedCode);

const realNewsData = JSON.parse(fs.readFileSync(newsJsonPath, 'utf8'));

// ============ 属性测试 ============

console.log('=== 属性测试：搜索结果相关性 ===');
console.log(`使用 ${NUM_RUNS} 次随机运行\n`);
console.log(`实际数据条数: ${realNewsData.length}\n`);


// --- 属性 2a：搜索结果中每条新闻的标题或摘要包含搜索关键词（不区分大小写） ---
console.log('属性 2a: 搜索结果中每条新闻的标题或摘要包含搜索关键词');
const p2a = propertyTest('搜索结果相关性', NUM_RUNS, (run) => {
  const newsCount = randomInt(1, 30);
  const news = generateRandomNews(newsCount);
  // 从随机新闻中提取一个关键词用于搜索
  const randomItem = randomChoice(news);
  const source = randomChoice([randomItem.title, randomItem.summary]);
  // 从标题或摘要中截取一段作为关键词
  const start = randomInt(0, Math.max(0, source.length - 3));
  const len = randomInt(1, Math.min(5, source.length - start));
  const keyword = source.substring(start, start + len);

  const result = NewsData.searchNews(news, keyword);
  const lowerKeyword = keyword.toLowerCase().trim();

  // 验证：结果中每条新闻的标题或摘要包含关键词（不区分大小写）
  for (let j = 0; j < result.length; j++) {
    const title = (result[j].title || '').toLowerCase();
    const summary = (result[j].summary || '').toLowerCase();
    assert(
      title.includes(lowerKeyword) || summary.includes(lowerKeyword),
      `搜索 "${keyword}" 时，结果第 ${j} 条新闻标题 "${result[j].title}" 和摘要 "${result[j].summary}" 均不包含关键词。`
    );
  }
});
console.log(p2a ? '  PASS ✓' : '  FAILED ✗');

// --- 属性 2b：搜索包含在标题中的关键词时，该新闻应出现在结果中 ---
console.log('\n属性 2b: 搜索标题中的关键词时，该新闻应出现在结果中');
const p2b = propertyTest('搜索命中完整性', NUM_RUNS, (run) => {
  const newsCount = randomInt(1, 30);
  const news = generateRandomNews(newsCount);
  // 随机选一条新闻，从其标题中提取关键词
  const targetItem = randomChoice(news);
  const title = targetItem.title;
  const start = randomInt(0, Math.max(0, title.length - 2));
  const len = randomInt(1, Math.min(4, title.length - start));
  const keyword = title.substring(start, start + len);

  const result = NewsData.searchNews(news, keyword);

  // 验证：目标新闻应出现在搜索结果中
  const found = result.some(item => item.id === targetItem.id);
  assert(
    found,
    `搜索 "${keyword}"（来自标题 "${title}"）时，该新闻(id=${targetItem.id})未出现在结果中。` +
    ` 结果数量: ${result.length}`
  );
});
console.log(p2b ? '  PASS ✓' : '  FAILED ✗');

// --- 属性 2c：空字符串或 falsy 值搜索时返回所有新闻 ---
console.log('\n属性 2c: 空字符串或 falsy 值搜索时返回所有新闻');
const p2c = propertyTest('空搜索返回全部', NUM_RUNS, (run) => {
  const newsCount = randomInt(0, 30);
  const news = generateRandomNews(newsCount);
  const emptyValue = randomChoice(['', '   ', null, undefined]);

  const result = NewsData.searchNews(news, emptyValue);

  assert(
    result.length === news.length,
    `传入 ${JSON.stringify(emptyValue)} 时，期望返回 ${news.length} 条，实际返回 ${result.length} 条。`
  );
});
console.log(p2c ? '  PASS ✓' : '  FAILED ✗');


// --- 属性 2d：搜索结果是原数组的子集（不会凭空产生新闻） ---
console.log('\n属性 2d: 搜索结果是原数组的子集');
const p2d = propertyTest('搜索结果为子集', NUM_RUNS, (run) => {
  const newsCount = randomInt(1, 30);
  const news = generateRandomNews(newsCount);
  const keyword = randomString(randomInt(1, 4));

  const result = NewsData.searchNews(news, keyword);

  // 结果长度不超过原数组
  assert(
    result.length <= news.length,
    `搜索结果(${result.length}) 超过原数组长度(${news.length})。`
  );

  // 结果中每条新闻都在原数组中
  for (let j = 0; j < result.length; j++) {
    assert(
      news.includes(result[j]),
      `搜索结果第 ${j} 条新闻不在原数组中。`
    );
  }
});
console.log(p2d ? '  PASS ✓' : '  FAILED ✗');

// --- 属性 2e：使用真实数据搜索 - 从真实标题/摘要中提取关键词 ---
console.log('\n属性 2e: 使用真实数据验证搜索相关性');
const p2e = propertyTest('真实数据搜索相关性', NUM_RUNS, (run) => {
  // 从真实数据中随机选一条新闻
  const targetItem = randomChoice(realNewsData);
  const source = randomChoice([targetItem.title, targetItem.summary]);
  // 从中截取一段作为搜索关键词
  const start = randomInt(0, Math.max(0, source.length - 3));
  const len = randomInt(1, Math.min(4, source.length - start));
  const keyword = source.substring(start, start + len);

  const result = NewsData.searchNews(realNewsData, keyword);
  const lowerKeyword = keyword.toLowerCase().trim();

  // 验证：结果不为空（因为至少目标新闻应匹配）
  assert(
    result.length > 0,
    `搜索 "${keyword}"（来自真实数据）时，结果为空，但至少应包含来源新闻。`
  );

  // 验证：结果中每条新闻的标题或摘要包含关键词
  for (let j = 0; j < result.length; j++) {
    const title = (result[j].title || '').toLowerCase();
    const summary = (result[j].summary || '').toLowerCase();
    assert(
      title.includes(lowerKeyword) || summary.includes(lowerKeyword),
      `真实数据搜索 "${keyword}" 时，结果第 ${j} 条新闻标题 "${result[j].title}" 和摘要均不包含关键词。`
    );
  }
});
console.log(p2e ? '  PASS ✓' : '  FAILED ✗');

// --- 属性 2f：大小写不敏感 - 不同大小写版本的关键词返回相同结果 ---
console.log('\n属性 2f: 大小写不敏感 - 不同大小写版本返回相同结果');
const p2f = propertyTest('大小写不敏感', NUM_RUNS, (run) => {
  const newsCount = randomInt(1, 30);
  const news = generateRandomNews(newsCount);
  // 生成包含英文字母的关键词以测试大小写
  const baseKeyword = randomString(randomInt(1, 4));

  const resultLower = NewsData.searchNews(news, baseKeyword.toLowerCase());
  const resultUpper = NewsData.searchNews(news, baseKeyword.toUpperCase());
  // 混合大小写
  let mixedCase = '';
  for (let i = 0; i < baseKeyword.length; i++) {
    mixedCase += i % 2 === 0 ? baseKeyword[i].toUpperCase() : baseKeyword[i].toLowerCase();
  }
  const resultMixed = NewsData.searchNews(news, mixedCase);

  // 验证：三种大小写版本返回相同数量的结果
  assert(
    resultLower.length === resultUpper.length && resultUpper.length === resultMixed.length,
    `关键词 "${baseKeyword}" 的不同大小写版本返回不同数量的结果：` +
    `小写=${resultLower.length}, 大写=${resultUpper.length}, 混合=${resultMixed.length}`
  );

  // 验证：结果中的新闻 id 完全一致
  const idsLower = resultLower.map(n => n.id).sort().join(',');
  const idsUpper = resultUpper.map(n => n.id).sort().join(',');
  const idsMixed = resultMixed.map(n => n.id).sort().join(',');
  assert(
    idsLower === idsUpper && idsUpper === idsMixed,
    `关键词 "${baseKeyword}" 的不同大小写版本返回不同的新闻集合。`
  );
});
console.log(p2f ? '  PASS ✓' : '  FAILED ✗');

// ============ 汇总 ============

console.log('\n=== 测试汇总 ===');
console.log(`总测试: ${totalTests}, 通过: ${passedTests}, 失败: ${failedTests}`);

if (failures.length > 0) {
  console.log('\n失败详情:');
  failures.forEach(f => {
    console.log(`  [${f.name}] run ${f.run}: ${f.error}`);
  });
  process.exit(1);
} else {
  console.log('\n所有属性测试通过 ✓');
  process.exit(0);
}

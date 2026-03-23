/**
 * 属性测试：分类筛选完整性
 * Validates: Requirements 2.2
 *
 * 属性 1：分类筛选完整性
 * - 验证筛选结果中每条新闻的 category 匹配所选分类
 * - 选择 "all" 时返回所有新闻
 * - 传入空字符串或 falsy 值时返回所有新闻
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
 * @param {string[]} categories - 可用分类列表
 * @param {number} count - 新闻条数
 * @returns {Array} 随机新闻数组
 */
function generateRandomNews(categories, count) {
  const news = [];
  for (let i = 0; i < count; i++) {
    news.push({
      id: i + 1,
      title: `新闻标题_${randomString(6)}`,
      summary: `摘要_${randomString(10)}`,
      category: randomChoice(categories),
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

const rawJson = fs.readFileSync(newsJsonPath, 'utf8').replace(/^\uFEFF/, '');
const realNewsData = JSON.parse(rawJson);
const realCategories = [...new Set(realNewsData.map(n => n.category))];

// ============ 属性测试 ============

console.log('=== 属性测试：分类筛选完整性 ===');
console.log(`使用 ${NUM_RUNS} 次随机运行\n`);
console.log(`实际数据分类: ${realCategories.join(', ')}`);
console.log(`实际数据条数: ${realNewsData.length}\n`);

// --- 属性 1a：选择特定分类时，结果中每条新闻的 category 都匹配所选分类 ---
console.log('属性 1a: 特定分类筛选 - 结果中每条新闻 category 匹配所选分类');
const p1a = propertyTest('特定分类筛选完整性', NUM_RUNS, (run) => {
  // 生成随机新闻数据
  const newsCount = randomInt(0, 30);
  const categories = realCategories;
  const news = generateRandomNews(categories, newsCount);
  const selectedCategory = randomChoice(categories);

  const result = NewsData.filterByCategory(news, selectedCategory);

  // 验证：结果中每条新闻的 category 都等于所选分类
  for (let j = 0; j < result.length; j++) {
    assert(
      result[j].category === selectedCategory,
      `筛选 "${selectedCategory}" 时，结果第 ${j} 条新闻 category 为 "${result[j].category}"，不匹配。` +
      ` 输入: ${newsCount} 条新闻, 选择分类: "${selectedCategory}"`
    );
  }
});
console.log(p1a ? '  PASS ✓' : '  FAILED ✗');

// --- 属性 1b：选择 "all" 时返回所有新闻 ---
console.log('\n属性 1b: 选择 "all" 时返回所有新闻');
const p1b = propertyTest('all分类返回全部', NUM_RUNS, (run) => {
  const newsCount = randomInt(0, 30);
  const news = generateRandomNews(realCategories, newsCount);

  const result = NewsData.filterByCategory(news, 'all');

  assert(
    result.length === news.length,
    `选择 "all" 时，期望返回 ${news.length} 条，实际返回 ${result.length} 条。`
  );

  // 验证返回的是完全相同的新闻
  for (let j = 0; j < news.length; j++) {
    assert(
      result[j] === news[j],
      `选择 "all" 时，第 ${j} 条新闻不一致。`
    );
  }
});
console.log(p1b ? '  PASS ✓' : '  FAILED ✗');

// --- 属性 1c：传入空字符串时返回所有新闻 ---
console.log('\n属性 1c: 传入空字符串时返回所有新闻');
const p1c = propertyTest('空字符串返回全部', NUM_RUNS, (run) => {
  const newsCount = randomInt(0, 30);
  const news = generateRandomNews(realCategories, newsCount);

  const result = NewsData.filterByCategory(news, '');

  assert(
    result.length === news.length,
    `传入空字符串时，期望返回 ${news.length} 条，实际返回 ${result.length} 条。`
  );
});
console.log(p1c ? '  PASS ✓' : '  FAILED ✗');

// --- 属性 1d：传入 falsy 值（null, undefined）时返回所有新闻 ---
console.log('\n属性 1d: 传入 falsy 值时返回所有新闻');
const p1d = propertyTest('falsy值返回全部', NUM_RUNS, (run) => {
  const newsCount = randomInt(0, 30);
  const news = generateRandomNews(realCategories, newsCount);
  const falsyValue = randomChoice([null, undefined, '', 0, false]);

  const result = NewsData.filterByCategory(news, falsyValue);

  assert(
    result.length === news.length,
    `传入 falsy 值 ${JSON.stringify(falsyValue)} 时，期望返回 ${news.length} 条，实际返回 ${result.length} 条。`
  );
});
console.log(p1d ? '  PASS ✓' : '  FAILED ✗');

// --- 属性 1e：使用真实数据验证分类筛选 ---
console.log('\n属性 1e: 使用真实数据验证分类筛选');
const p1e = propertyTest('真实数据分类筛选', realCategories.length, (run) => {
  const category = realCategories[run];
  const result = NewsData.filterByCategory(realNewsData, category);

  assert(result.length > 0, `分类 "${category}" 筛选结果为空，但数据中应有该分类新闻。`);

  for (let j = 0; j < result.length; j++) {
    assert(
      result[j].category === category,
      `真实数据筛选 "${category}" 时，第 ${j} 条新闻 category 为 "${result[j].category}"。`
    );
  }
});
console.log(p1e ? '  PASS ✓' : '  FAILED ✗');

// --- 属性 1f：筛选结果是原数组的子集（不会凭空产生新闻） ---
console.log('\n属性 1f: 筛选结果是原数组的子集');
const p1f = propertyTest('筛选结果为子集', NUM_RUNS, (run) => {
  const newsCount = randomInt(1, 30);
  const news = generateRandomNews(realCategories, newsCount);
  const selectedCategory = randomChoice(realCategories);

  const result = NewsData.filterByCategory(news, selectedCategory);

  // 结果长度不超过原数组
  assert(
    result.length <= news.length,
    `筛选结果 (${result.length}) 超过原数组长度 (${news.length})。`
  );

  // 结果中每条新闻都在原数组中
  for (let j = 0; j < result.length; j++) {
    assert(
      news.includes(result[j]),
      `筛选结果第 ${j} 条新闻不在原数组中。`
    );
  }
});
console.log(p1f ? '  PASS ✓' : '  FAILED ✗');

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

/**
 * 属性测试：日期排序一致性
 * Validates: Requirements 1.2
 *
 * 属性 3：日期排序一致性
 * - 验证排序后任意相邻两条新闻，前一条日期 >= 后一条日期
 * - 排序保留所有元素（长度不变，元素相同）
 * - 排序不修改原数组
 */

const fs = require('fs');
const path = require('path');

// ============ 轻量级属性测试框架 ============

const NUM_RUNS = 100;
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

function randomDate() {
  const year = randomChoice([2023, 2024, 2025]);
  const month = String(randomInt(1, 12)).padStart(2, '0');
  const day = String(randomInt(1, 28)).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

function generateRandomNews(count) {
  const categories = ['smart-glasses', 'ai-phone', 'smart-watch', 'ai-pc', 'other'];
  const news = [];
  for (let i = 0; i < count; i++) {
    news.push({
      id: `news-${i + 1}`,
      title: `Title_${randomString(6)}`,
      summary: `Summary_${randomString(10)}`,
      content: `Content_${randomString(20)}`,
      category: randomChoice(categories),
      date: randomDate(),
      source: `Source_${randomString(4)}`
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

// ============ 属性测试 ============

console.log('=== 属性测试：日期排序一致性 ===');
console.log(`使用 ${NUM_RUNS} 次随机运行\n`);
console.log(`实际数据条数: ${realNewsData.length}\n`);

// --- 属性 3a：排序后相邻新闻日期降序（前一条 >= 后一条） ---
console.log('属性 3a: 排序后相邻新闻日期降序');
const p3a = propertyTest('日期降序一致性', NUM_RUNS, (run) => {
  const newsCount = randomInt(2, 30);
  const news = generateRandomNews(newsCount);
  const sorted = NewsData.sortByDate(news);

  for (let j = 0; j < sorted.length - 1; j++) {
    const dateA = new Date(sorted[j].date);
    const dateB = new Date(sorted[j + 1].date);
    assert(
      dateA >= dateB,
      `sorted[${j}].date="${sorted[j].date}" should >= sorted[${j + 1}].date="${sorted[j + 1].date}". Input: ${newsCount} items`
    );
  }
});
console.log(p3a ? '  PASS \u2713' : '  FAILED \u2717');

// --- 属性 3b：排序保留所有元素 ---
console.log('\n属性 3b: 排序保留所有元素');
const p3b = propertyTest('排序保留元素', NUM_RUNS, (run) => {
  const newsCount = randomInt(0, 30);
  const news = generateRandomNews(newsCount);
  const sorted = NewsData.sortByDate(news);

  assert(
    sorted.length === news.length,
    `sorted.length=${sorted.length} !== original.length=${news.length}`
  );
  for (let j = 0; j < news.length; j++) {
    assert(sorted.includes(news[j]), `original[${j}] not found in sorted result`);
  }
});
console.log(p3b ? '  PASS \u2713' : '  FAILED \u2717');

// --- 属性 3c：排序不修改原数组 ---
console.log('\n属性 3c: 排序不修改原数组');
const p3c = propertyTest('排序不修改原数组', NUM_RUNS, (run) => {
  const newsCount = randomInt(0, 30);
  const news = generateRandomNews(newsCount);
  const originalRefs = [...news];

  NewsData.sortByDate(news);

  assert(news.length === originalRefs.length,
    `original length changed from ${originalRefs.length} to ${news.length}`);
  for (let j = 0; j < news.length; j++) {
    assert(news[j] === originalRefs[j],
      `original[${j}] reference changed after sort`);
  }
});
console.log(p3c ? '  PASS \u2713' : '  FAILED \u2717');

// --- 属性 3d：使用真实数据验证日期降序 ---
console.log('\n属性 3d: 使用真实数据验证日期降序');
const p3d = propertyTest('真实数据日期降序', 1, () => {
  const sorted = NewsData.sortByDate(realNewsData);

  assert(sorted.length === realNewsData.length,
    `sorted.length=${sorted.length} !== realData.length=${realNewsData.length}`);
  for (let j = 0; j < sorted.length - 1; j++) {
    const dateA = new Date(sorted[j].date);
    const dateB = new Date(sorted[j + 1].date);
    assert(dateA >= dateB,
      `real data: sorted[${j}].date="${sorted[j].date}" should >= sorted[${j + 1}].date="${sorted[j + 1].date}"`);
  }
});
console.log(p3d ? '  PASS \u2713' : '  FAILED \u2717');

// --- 属性 3e：空数组排序 ---
console.log('\n属性 3e: 空数组排序');
const p3e = propertyTest('空数组排序', 1, () => {
  const sorted = NewsData.sortByDate([]);
  assert(sorted.length === 0, `empty array sort should return length 0, got ${sorted.length}`);
});
console.log(p3e ? '  PASS \u2713' : '  FAILED \u2717');

// --- 属性 3f：单元素数组排序 ---
console.log('\n属性 3f: 单元素数组排序');
const p3f = propertyTest('单元素数组排序', NUM_RUNS, (run) => {
  const news = generateRandomNews(1);
  const sorted = NewsData.sortByDate(news);

  assert(sorted.length === 1, `single element sort should return length 1, got ${sorted.length}`);
  assert(sorted[0] === news[0], `single element sort should preserve reference`);
});
console.log(p3f ? '  PASS \u2713' : '  FAILED \u2717');

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
  console.log('\n所有属性测试通过 \u2713');
  process.exit(0);
}

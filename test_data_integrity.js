/**
 * 属性测试：数据完整性验证
 * Validates: Requirements 4.2
 *
 * 属性 4：数据完整性
 * - 验证每条新闻包含所有必需字段且不为空
 * - 必需字段：id, title, summary, content, category, date, source
 * - 有效分类：smart-glasses, ai-phone, smart-watch, ai-pc, other
 * - 日期格式：YYYY-MM-DD
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

function propertyTest(name, numRuns, testFn) {
  for (let i = 0; i < numRuns; i++) {
    totalTests++;
    try {
      testFn(i);
      passedTests++;
    } catch (e) {
      failedTests++;
      failures.push({ name, run: i, error: e.message });
      console.log('  FAIL [run ' + i + ']: ' + e.message);
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


// ============ 常量定义 ============

var REQUIRED_FIELDS = ['id', 'title', 'summary', 'content', 'category', 'date', 'source'];
var VALID_CATEGORIES = ['smart-glasses', 'ai-phone', 'smart-watch', 'ai-pc', 'other'];
var DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// ============ 加载被测模块 ============

var dataJsPath = path.join(__dirname, 'js', 'data.js');
var newsJsonPath = path.join(__dirname, 'data', 'news.json');

var code = fs.readFileSync(dataJsPath, 'utf8');
var modifiedCode = code.replace('window.NewsData', 'global.NewsData');
eval(modifiedCode);

// Strip BOM if present
var rawJson = fs.readFileSync(newsJsonPath, 'utf8');
if (rawJson.charCodeAt(0) === 0xFEFF) {
  rawJson = rawJson.slice(1);
}
var realNewsData = JSON.parse(rawJson);

// ============ 属性测试 ============

console.log('=== 属性测试：数据完整性验证 ===');
console.log('必需字段: ' + REQUIRED_FIELDS.join(', '));
console.log('有效分类: ' + VALID_CATEGORIES.join(', '));
console.log('实际数据条数: ' + realNewsData.length + '\n');

// --- 属性 4a：每条新闻包含所有必需字段 ---
console.log('属性 4a: 每条新闻包含所有必需字段');
var p4a = propertyTest('必需字段存在', realNewsData.length, function(run) {
  var item = realNewsData[run];
  for (var fi = 0; fi < REQUIRED_FIELDS.length; fi++) {
    var field = REQUIRED_FIELDS[fi];
    assert(
      item.hasOwnProperty(field),
      '新闻 id=' + (item.id || run) + ' 缺少必需字段 "' + field + '"。现有字段: ' + Object.keys(item).join(', ')
    );
  }
});
console.log(p4a ? '  PASS ✓' : '  FAILED ✗');

// --- 属性 4b：所有必需字段不为空/null/undefined ---
console.log('\n属性 4b: 所有必需字段不为空/null/undefined');
var p4b = propertyTest('必需字段非空', realNewsData.length, function(run) {
  var item = realNewsData[run];
  for (var fi = 0; fi < REQUIRED_FIELDS.length; fi++) {
    var field = REQUIRED_FIELDS[fi];
    var value = item[field];
    assert(
      value !== null && value !== undefined,
      '新闻 id=' + (item.id || run) + ' 的字段 "' + field + '" 为 ' + value + '。'
    );
    if (typeof value === 'string') {
      assert(
        value.trim().length > 0,
        '新闻 id=' + (item.id || run) + ' 的字段 "' + field + '" 为空字符串。'
      );
    }
  }
});
console.log(p4b ? '  PASS ✓' : '  FAILED ✗');


// --- 属性 4c：category 值为有效分类 ---
console.log('\n属性 4c: category 值为有效分类');
var p4c = propertyTest('分类值有效', realNewsData.length, function(run) {
  var item = realNewsData[run];
  assert(
    VALID_CATEGORIES.indexOf(item.category) !== -1,
    '新闻 id=' + item.id + ' 的 category "' + item.category + '" 不在有效分类列表中。有效分类: ' + VALID_CATEGORIES.join(', ')
  );
});
console.log(p4c ? '  PASS ✓' : '  FAILED ✗');

// --- 属性 4d：date 格式为 YYYY-MM-DD ---
console.log('\n属性 4d: date 格式为 YYYY-MM-DD');
var p4d = propertyTest('日期格式有效', realNewsData.length, function(run) {
  var item = realNewsData[run];
  assert(
    DATE_REGEX.test(item.date),
    '新闻 id=' + item.id + ' 的 date "' + item.date + '" 不符合 YYYY-MM-DD 格式。'
  );
  var parts = item.date.split('-').map(Number);
  var month = parts[1];
  var day = parts[2];
  assert(
    month >= 1 && month <= 12,
    '新闻 id=' + item.id + ' 的月份 ' + month + ' 不在 1-12 范围内。'
  );
  assert(
    day >= 1 && day <= 31,
    '新闻 id=' + item.id + ' 的日期 ' + day + ' 不在 1-31 范围内。'
  );
});
console.log(p4d ? '  PASS ✓' : '  FAILED ✗');

// --- 属性 4e：随机生成完整数据通过完整性检查 ---
console.log('\n属性 4e: 随机生成完整数据通过完整性检查');
var p4e = propertyTest('随机完整数据验证', NUM_RUNS, function(run) {
  var count = randomInt(1, 20);
  var news = [];
  for (var i = 0; i < count; i++) {
    news.push({
      id: 'news-' + randomString(4),
      title: '标题_' + randomString(6),
      summary: '摘要_' + randomString(10),
      content: '内容_' + randomString(20),
      category: randomChoice(VALID_CATEGORIES),
      date: '2025-' + String(randomInt(1, 12)).padStart(2, '0') + '-' + String(randomInt(1, 28)).padStart(2, '0'),
      source: '来源_' + randomString(4)
    });
  }

  for (var i = 0; i < news.length; i++) {
    for (var fi = 0; fi < REQUIRED_FIELDS.length; fi++) {
      var field = REQUIRED_FIELDS[fi];
      assert(
        news[i].hasOwnProperty(field),
        '生成的新闻 index=' + i + ' 缺少字段 "' + field + '"。'
      );
      var value = news[i][field];
      assert(
        value !== null && value !== undefined,
        '生成的新闻 index=' + i + ' 字段 "' + field + '" 为 ' + value + '。'
      );
      if (typeof value === 'string') {
        assert(
          value.trim().length > 0,
          '生成的新闻 index=' + i + ' 字段 "' + field + '" 为空字符串。'
        );
      }
    }
    assert(
      VALID_CATEGORIES.indexOf(news[i].category) !== -1,
      '生成的新闻 index=' + i + ' 的 category "' + news[i].category + '" 无效。'
    );
    assert(
      DATE_REGEX.test(news[i].date),
      '生成的新闻 index=' + i + ' 的 date "' + news[i].date + '" 格式无效。'
    );
  }
});
console.log(p4e ? '  PASS ✓' : '  FAILED ✗');

// ============ 汇总 ============

console.log('\n=== 测试汇总 ===');
console.log('总测试: ' + totalTests + ', 通过: ' + passedTests + ', 失败: ' + failedTests);

if (failures.length > 0) {
  console.log('\n失败详情:');
  failures.forEach(function(f) {
    console.log('  [' + f.name + '] run ' + f.run + ': ' + f.error);
  });
  process.exit(1);
} else {
  console.log('\n所有属性测试通过 ✓');
  process.exit(0);
}

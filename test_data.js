const fs = require('fs');
const rawJson = fs.readFileSync('smart-hardware-news-hub/data/news.json', 'utf8').replace(/^\uFEFF/, '');
const data = JSON.parse(rawJson);

console.log('=== news.json validation ===');
console.log('Total items:', data.length);
console.log('Categories:', [...new Set(data.map(d => d.category))].join(', '));
console.log('Fields:', Object.keys(data[0]).join(', '));

// Load data.js functions
const code = fs.readFileSync('smart-hardware-news-hub/js/data.js', 'utf8');
const modifiedCode = code.replace('window.NewsData', 'global.NewsData');
eval(modifiedCode);

// Test sortByDate
console.log('\n=== sortByDate test ===');
const sorted = NewsData.sortByDate(data);
console.log('First date:', sorted[0].date, '| Last date:', sorted[sorted.length - 1].date);
const isCorrectOrder = sorted[0].date >= sorted[sorted.length - 1].date;
console.log('Sorted descending:', isCorrectOrder ? 'PASS' : 'FAIL');

// Test filterByCategory
console.log('\n=== filterByCategory test ===');
const aiNews = NewsData.filterByCategory(data, 'ai-phone');
console.log('ai-phone news count:', aiNews.length, aiNews.length > 0 ? 'PASS' : 'FAIL');
const allNews = NewsData.filterByCategory(data, 'all');
console.log('All news count:', allNews.length, allNews.length === data.length ? 'PASS' : 'FAIL');
const noFilter = NewsData.filterByCategory(data, '');
console.log('Empty filter count:', noFilter.length, noFilter.length === data.length ? 'PASS' : 'FAIL');

// Test searchNews
console.log('\n=== searchNews test ===');
const search1 = NewsData.searchNews(data, 'AI');
console.log('Search "AI":', search1.length, 'results', search1.length > 0 ? 'PASS' : 'FAIL');
const search2 = NewsData.searchNews(data, 'Meta');
console.log('Search "Meta" (case insensitive):', search2.length, 'results', search2.length > 0 ? 'PASS' : 'FAIL');
const search3 = NewsData.searchNews(data, '');
console.log('Search empty:', search3.length, 'results', search3.length === data.length ? 'PASS' : 'FAIL');
const search4 = NewsData.searchNews(data, 'xyznotfound');
console.log('Search no match:', search4.length, 'results', search4.length === 0 ? 'PASS' : 'FAIL');

// Verify original array not mutated by sort
console.log('\n=== Immutability test ===');
const originalFirst = data[0].id;
NewsData.sortByDate(data);
console.log('Original array unchanged:', data[0].id === originalFirst ? 'PASS' : 'FAIL');

const fs = require('fs');
const filePath = 'smart-hardware-news-hub/test_filter_category.js';
let content = fs.readFileSync(filePath, 'utf8');
const oldLine = "const realNewsData = JSON.parse(fs.readFileSync(newsJsonPath, 'utf8'));";
const newLine = "const rawJson = fs.readFileSync(newsJsonPath, 'utf8').replace(/^\\uFEFF/, '');\nconst realNewsData = JSON.parse(rawJson);";
if (content.includes(oldLine)) {
  content = content.replace(oldLine, newLine);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Fixed successfully');
} else {
  console.log('Old line not found');
}

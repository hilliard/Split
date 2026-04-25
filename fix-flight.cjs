const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else {
      if (file.endsWith('.astro')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('src/pages');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  if (content.includes('<option value="transport">Transport</option>')) {
    if (!content.includes('<option value="flight">Flight</option>')) {
      content = content.replace(/([ \t]*)<option value="transport">Transport<\/option>/g, '$1<option value="transport">Transport</option>\n$1<option value="flight">Flight</option>');
      fs.writeFileSync(file, content, 'utf8');
      console.log('Updated ' + file);
    }
  }
});

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

const roundTripTemplate = `      roundtrip_flight: [
        ['Airline Company', ''],
        ['Confirmation Number', ''],
        ['Outbound Flight #', ''],
        ['Outbound Take Off', ''],
        ['Outbound Arrival', ''],
        ['Return Flight #', ''],
        ['Return Take Off', ''],
        ['Return Arrival', ''],
      ],`;

const files = walk('src/pages');
files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  let changed = false;

  // Add the option if not present
  if (content.includes('<option value="flight">') && !content.includes('<option value="roundtrip_flight">')) {
    content = content.replace(/([ \t]*)<option value="flight">([^<]+)<\/option>/g, '$1<option value="flight">$2</option>\n$1<option value="roundtrip_flight">🔄 Round-Trip Flight</option>');
    changed = true;
  }

  // Add the javascript dictionary entry if not present
  if (content.includes('flight: [') && !content.includes('roundtrip_flight: [')) {
    content = content.replace(/([ \t]*)flight: \[\n(?:[ \t]*\['[^']+',[ \t]*''\],\n)+[ \t]*\],/g, (match) => {
      return match + '\n' + roundTripTemplate;
    });
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated ' + file);
  }
});

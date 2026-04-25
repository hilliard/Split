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
  let changed = false;

  // Add roundtrip to JS dictionaries
  if (content.includes('flight: [') && !content.includes('roundtrip_flight: [')) {
    // We'll just replace 'hotel: [' with 'roundtrip_flight: [...],\n      hotel: [' to insert it before hotel
    const roundTripTemplate = `roundtrip_flight: [
        ['Airline Company', ''],
        ['Confirmation Number', ''],
        ['Outbound Flight #', ''],
        ['Outbound Take Off', ''],
        ['Outbound Arrival', ''],
        ['Return Flight #', ''],
        ['Return Take Off', ''],
        ['Return Arrival', ''],
      ],
      hotel: [`;
    
    content = content.replace(/hotel: \[/g, roundTripTemplate);
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated JS templates in ' + file);
  }
});

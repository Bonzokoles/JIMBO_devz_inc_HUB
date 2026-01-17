
const fs = require('fs');
const path = "../../../docs/PUMO/chunks/products_chunk_001.csv";
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');
const rawRow = lines[1]; 
const columns = rawRow.match(/("[^"]*"|[^,]*)/g).map(s => s.replace(/^"|"$/g, ''));

console.log(`[150-160]:`);
for(let i=150; i<160; i++) console.log(`${i}: ${columns[i]}`);

console.log(`[180-190]:`);
for(let i=180; i<190; i++) console.log(`${i}: ${columns[i]}`);

console.log(`Searching for any long string (desc/name):`);
columns.forEach((c, i) => {
    if (c.length > 20) console.log(`${i}: ${c.substring(0, 30)}...`);
});

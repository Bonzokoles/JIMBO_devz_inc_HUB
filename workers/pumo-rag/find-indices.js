
const fs = require('fs');
const path = "../../../docs/PUMO/chunks/products_chunk_001.csv";
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Simple split to find the value roughly
const rawRow = lines[1]; 
// We know the name "Hoker JAMES 8" is in there.
// We know the category "Hokery" is in there.
// We know the price might be there.

// Let's just regex match the whole line to see structure
const columns = rawRow.match(/("[^"]*"|[^,]*)/g).map(s => s.replace(/^"|"$/g, ''));

console.log(`Total columns parsed: ${columns.length}`);

columns.forEach((val, i) => {
    if (val.includes("Hoker JAMES") || val.includes("Hokery") || val.includes("PLN") || val === "8") {
        console.log(`Index ${i}: ${val}`);
    }
});

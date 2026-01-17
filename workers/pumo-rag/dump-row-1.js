
const fs = require('fs');
const path = "../../../docs/PUMO/chunks/products_chunk_001.csv";
const lines = fs.readFileSync(path, 'utf8').split('\n');
const row1 = lines[1];
const cols = row1.match(/("[^"]*"|[^,]*)/g)?.map((s) => s.replace(/^"|"$/g, "")) || [];

console.log("Dumping all row 1 columns with content:");
cols.forEach((c, i) => {
    if (c.trim().length > 0) {
        console.log(`[${i}] : ${c}`);
    }
});

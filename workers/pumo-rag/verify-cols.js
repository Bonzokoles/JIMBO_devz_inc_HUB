
const fs = require('fs');
const path = "../../../docs/PUMO/chunks/products_chunk_001.csv";
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].match(/("[^"]*"|[^,]*)/g)?.map((s) => s.replace(/^"|"$/g, "")) || [];
    if (cols[185] && cols[185].trim().length > 0) {
        console.log(`Row ${i} has name at index 185: ${cols[185]}`);
        console.log(`Category at index 9: ${cols[9]}`);
        console.log(`Price (gross) at 16: ${cols[16]}`);
        console.log(`ID at 0: ${cols[0]}`);
        break;
    }
    if (i > 100) {
        console.log("No non-empty name found in first 100 rows at index 185");
        break;
    }
}


function parseCSVLine(line) {
    const result = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current);
            current = "";
        } else {
            current += char;
        }
    }
    result.push(current);
    return result;
}

const fs = require('fs');
const path = "../../../docs/PUMO/chunks/products_chunk_001.csv";
const lines = fs.readFileSync(path, 'utf8').split('\n');

const headers = parseCSVLine(lines[0]);
console.log(`Parsed ${headers.length} headers.`);

const row1 = parseCSVLine(lines[1]);
console.log(`Parsed ${row1.length} columns in row 1.`);

// Find "Hoker JAMES 8"
row1.forEach((c, i) => {
    if (c.toLowerCase().includes("hoker")) {
        console.log(`Column ${i}: [${headers[i]}] = ${c}`);
    }
});

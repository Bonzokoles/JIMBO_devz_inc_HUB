
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

for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    if (cols.length > 185 && cols[185].trim().length > 0) {
        console.log(`Row ${i} length ${cols.length}. Name at 185: ${cols[185]}`);
        break;
    }
}

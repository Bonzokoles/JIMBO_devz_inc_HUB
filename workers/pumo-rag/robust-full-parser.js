
const fs = require('fs');

function parseFullCSV(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const rows = [];
    let currentRow = [];
    let currentCell = "";
    let inQuotes = false;

    for (let i = 0; i < content.length; i++) {
        const char = content[i];
        if (char === '"') {
            if (inQuotes && content[i + 1] === '"') {
                currentCell += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            currentRow.push(currentCell);
            currentCell = "";
        } else if ((char === '\n' || char === '\r') && !inQuotes) {
            if (char === '\r' && content[i+1] === '\n') i++;
            currentRow.push(currentCell);
            rows.push(currentRow);
            currentRow = [];
            currentCell = "";
        } else {
            currentCell += char;
        }
    }
    if (currentRow.length > 0 || currentCell.length > 0) {
        currentRow.push(currentCell);
        rows.push(currentRow);
    }
    return rows;
}

const data = parseFullCSV("../../../docs/PUMO/chunks/products_chunk_004.csv");
console.log(`Parsed ${data.length} rows.`);
const headers = data[0];
console.log(`Headers count: ${headers.length}`);

for (let i = 10; i < 11; i++) {
    const row = data[i];
    console.log(`Row ${i} Verification (Length: ${row.length}):`);
    const targets = [0, 7, 14, 16, 107, 111, 185, 186, 187];
    targets.forEach(idx => {
        console.log(`[${idx}] (${headers[idx]}): ${row[idx]}`);
    });
}

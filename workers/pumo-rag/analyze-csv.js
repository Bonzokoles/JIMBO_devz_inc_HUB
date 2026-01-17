
const fs = require('fs');
const path = "../../../docs/PUMO/chunks/products_chunk_001.csv";
const content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Parse function same as utils.ts
function parseLine(line) {
    return line.match(/("[^"]*"|[^,]*)/g)?.map((s) => s.replace(/^"|"$/g, "")) || [];
}

const headers = parseLine(lines[0]);
// Find a row with actual data (skip empty rows if any)
const dataRow = parseLine(lines[1]);

console.log("--- COLUMN MAPPING ANALYSIS ---");
headers.forEach((h, i) => {
    const value = dataRow[i] || "EMPTY";
    // Only show columns that seem relevant or have value
    if (h.includes("name") || h.includes("desc") || h.includes("url") || h.includes("price") || value.length > 0) {
        console.log(`[${i}] ${h} = ${value.substring(0, 50)}`);
    }
});

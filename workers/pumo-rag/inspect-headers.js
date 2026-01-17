
const fs = require('fs');
const path = "../../../docs/PUMO/chunks/products_chunk_001.csv";
const content = fs.readFileSync(path, 'utf8');
const headerLine = content.split('\n')[0];
// Simple split for headers (assuming no commas in header names)
const headers = headerLine.split(',');

console.log(`Found ${headers.length} columns.`);
headers.forEach((h, i) => {
    // Replace quotes if any
    const clean = h.replace(/"/g, '');
    console.log(`${i}: ${clean}`);
});

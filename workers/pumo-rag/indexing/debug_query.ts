
import { execSync } from "child_process";

const randomVector = Array.from({ length: 768 }, () => Math.random()).join(",");
// Wrangler requires space separated? or JSON?
// wrangler vectorize query pumo-products --vector "[0.1, 0.2...]"

// We can probably pass a file to query?
// Help says: --vector-file
// Let's make a json file

const queryFile = "U:/The_yellow_hub/JIMBO_devz_inc_HUB/workers/pumo-rag/temp_query.json";
const fs = require("fs");
fs.writeFileSync(queryFile, JSON.stringify([0.1, ...Array(767).fill(0)])); // Simple vector

try {
    console.log("Querying index...");
    // Note: older wrangler might use --vector-file, new one might use --file or something.
    // Let's assume sending a small vector directly is hard via command line args if too long.
    // But let's try reading the help first if we fail. 
    // Actually, constructing a command with 768 floats as arg is risky for shell length.
    

    console.log("Querying index with dummy vector...");
    // Use the vector file we just created
    // Note: ensure we are in the correct directory for wrangler.toml
    const output = execSync(`npx wrangler vectorize query pumo-products --vector-file="${queryFile}" --top-k=1`, {
        cwd: "U:/The_yellow_hub/JIMBO_devz_inc_HUB/workers/pumo-rag",
        encoding: "utf-8"
    });
    console.log("Query Output:");
    console.log(output);

} catch (e: any) {
    console.log("Query failed");
    console.error(e.message); 
    if (e.stdout) console.log(e.stdout);
    if (e.stderr) console.error(e.stderr);
}


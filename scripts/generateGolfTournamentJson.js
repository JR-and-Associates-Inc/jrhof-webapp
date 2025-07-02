const fs = require("fs");

const baseUrl = "https://cdn.jrhof.org/events/golf-tournament/2024/GolfTournament2024";
const numImages = 158;

const urls = [];

for (let i = 1; i <= numImages; i++) {
  const numStr = String(i).padStart(3, "0");  // 001, 002, ..., 244
  urls.push(`${baseUrl}-${numStr}.webp`);
}

const jsonOutput = JSON.stringify(urls, null, 2);

fs.writeFileSync("./src/data/golf_tournament_2024.json", jsonOutput);

console.log("✅ golf_tournament_2024.json generated!");
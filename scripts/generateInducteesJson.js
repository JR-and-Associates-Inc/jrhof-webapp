const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

// Path to your Excel file (OneDrive cloud location)
const excelFilePath = path.join(__dirname, '../src/data/All_Inductees.xlsx');

// Read the Excel file
const workbook = XLSX.readFile(excelFilePath);

// Get the first sheet (assuming this is where your inductee data is)
const sheet = workbook.Sheets[workbook.SheetNames[0]];

// Convert sheet data to JSON
const data = XLSX.utils.sheet_to_json(sheet);

// Format the data to match your desired JSON structure
const inductees = data.map((row) => {
  const sanitizedName = row['Name']
    .trim()
    .replace(/\s+/g, '_')  // Replace spaces with underscores
    .replace(/[^\w-]/g, ''); // Only allow letters, numbers, underscores, and hyphens

  return {
    Name: row['Name'],               // Adjust based on column headers
    Year: row['Year'],               // Adjust based on column headers
    Image: row['Image'],             // Adjust based on column headers
    'Bio URL': sanitizedName,        // Use sanitized name for URL
  };
});

// Output the JSON to a file in the Next.js src directory
const outputPath = path.join(__dirname, '../src/data/inductees.json');
fs.writeFileSync(outputPath, JSON.stringify(inductees, null, 2));

console.log('Inductees JSON has been generated!');
const fs = require('fs');
const path = require('path');

// Load the inductees JSON file
const inductees = require('../src/data/inductees.json');

// Path where the markdown files should be stored
const markdownDir = path.join(__dirname, '../src/content/inductees');

// Ensure the markdown directory exists
if (!fs.existsSync(markdownDir)) {
  fs.mkdirSync(markdownDir, { recursive: true });
  console.log(`Created directory: ${markdownDir}`);
}

// Create the Markdown files for inductees that don't already have them
inductees.forEach(inductee => {
  const { Name, Year, Image, 'Bio URL': bioUrl } = inductee;

  // Sanitize the bioUrl to remove invalid characters
  const sanitizedBioUrl = bioUrl
    .trim()
    .replace(/[^a-zA-Z0-9-_ ]/g, '')  // Remove any non-alphanumeric characters except space, dash, and underscore
    .replace(/\s+/g, '_');             // Replace spaces with underscores

  // Define the file path for the markdown file
  const filePath = path.join(markdownDir, `${sanitizedBioUrl}.md`);

  // Debug: Log the file path
  console.log(`File path: ${filePath}`);

  // Check if the file already exists
  if (!fs.existsSync(filePath)) {
    // Create a Markdown content structure
    const markdownContent = `
---
name: ${Name}
year: ${Year}
image: ${Image}
---

`;

    // Write the markdown content to the file
    fs.writeFileSync(filePath, markdownContent);
    console.log(`Created markdown file for ${Name}`);
  } else {
    console.log(`Markdown file already exists for ${Name}`);
  }
});

console.log('Finished generating missing Markdown files!');
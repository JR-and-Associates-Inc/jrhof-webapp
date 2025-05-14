import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';

const biosDir = path.join(process.cwd(), 'src/content/inductees');
const inducteesPath = path.join(process.cwd(), 'src/data/inductees.json');
const outputPath = path.join(process.cwd(), 'src/data/parsedInductees.json');

const rawInductees = JSON.parse(fs.readFileSync(inducteesPath, 'utf-8'));

const parsed = rawInductees.map((inductee) => {
  const slug = inductee["Bio URL"].toLowerCase();
  const filePath = path.join(biosDir, `${slug}.md`);

  let bio = 'Bio not found.';
  if (fs.existsSync(filePath)) {
    const file = fs.readFileSync(filePath, 'utf-8');
    const { content } = matter(file);
    bio = content;
  } else {
    console.warn(`⚠️ Bio file not found for ${inductee.Name} (${slug})`);
  }

  return {
    ...inductee,
    bio,
  };
});

fs.writeFileSync(outputPath, JSON.stringify(parsed, null, 2));
console.log(`✅ parsedInductees.json generated with ${parsed.length} entries.`);
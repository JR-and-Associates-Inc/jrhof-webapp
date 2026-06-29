import { notFound } from 'next/navigation';
import { Inductee } from '@/types/Inductee';
import inductees from '@/data/inductees.json';
const parsedInductees: (Inductee & { parsedYear: number })[] = (inductees as unknown as Inductee[]).map((i) => ({
  ...i,
  parsedYear:
    typeof i.Year === 'string'
      ? /^\d{4}$/.test(i.Year)
        ? Number(i.Year)
        : (i.Year as string).toLowerCase().includes('pre')
          ? 1899
          : 0
      : typeof i.Year === 'number'
        ? i.Year
        : 0,
}));
import path from 'path';
import fs from 'fs/promises';
import matter from 'gray-matter';
import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm';
import InducteeImage from '@/components/InducteeImage';

export const dynamicParams = false;;

export async function generateStaticParams(): Promise<{ bio: string }[]> {
  return parsedInductees.map((inductee) => ({
    bio: inductee['Bio URL'].replace(/\.md$/, ''),
  }));
}

async function fetchInducteeData(bio: string) {
  const inductee = parsedInductees.find(
    (i) => i['Bio URL'].replace(/\.md$/, '') === bio
  );

  if (!inductee) {
    return { notFound: true };
  }

  // Fetch the bio content from the markdown file
  const bioFilePath = path.join(
    process.cwd(),
    'src',
    'content',
    'inductees',
    `${bio}.md`
  );

  let bioContent = '';

  try {
    bioContent = await fs.readFile(bioFilePath, 'utf8');
  } catch (error) {
    console.error('Error reading markdown file:', error);
    return { notFound: true };
  }

  return { inductee, bioContent };
}

export default async function InducteePage({ params }: { params: Promise<{ bio: string }> }) {
  const { bio } = await params; // Await params before accessing bio

  if (!bio) return notFound();

  const { inductee, bioContent } = await fetchInducteeData(bio);

  if (!inductee) return notFound();

  // Parse the markdown content
  const { content } = matter(bioContent);

  const imageFile = inductee.Image?.trim();
const imagePath = imageFile && imageFile !== 'undefined'
  ? `/images/inductees/${imageFile}`
  : '/images/inductees/missing_inductee.webp';

  return (
    <>
      <main className="main-content">
        <div className="w-full max-w-screen-xl mx-auto bg-white/85 dark:bg-[#2a2a2a]/85 rounded-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.1)] px-4 sm:px-6 lg:px-8 py-6">
          <section className="text-center mb-8">
            <h2 className="text-6xl font-bold">{inductee.Name}</h2>
            <p className="text-2xl text-muted-foreground font-medium mt-2">
              <span className="uppercase tracking-wide">
                Class of {typeof inductee.Year === 'string' && (inductee.Year as string).toLowerCase().includes('pre')
                  ? 'Pre 1990'
                  : inductee.Year}
              </span>
            </p>
          </section>

          <section className="mt-6">
                          {/* Display the inductee's image */}
                          <InducteeImage
        src={imagePath}
        alt={inductee.Name}
        width={300}
        height={300}
        className="rounded-lg shadow-lg float-left mr-6 mb-4"
      />
            <div className="prose prose-lg dark:prose-invert text-gray-800 dark:text-gray-100 leading-relaxed">
              <ReactMarkdown remarkPlugins={[gfm]}>{content}</ReactMarkdown>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
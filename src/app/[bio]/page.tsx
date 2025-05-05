import { notFound } from 'next/navigation';
import { Inductee } from '@/types/Inductee';
import inductees from '@/data/inductees.json';
import path from 'path';
import fs from 'fs/promises';
import matter from 'gray-matter';
import ReactMarkdown from 'react-markdown';
import gfm from 'remark-gfm';
import Image from 'next/image';

export const dynamicParams = false;;

export async function generateStaticParams(): Promise<{ bio: string }[]> {
  return (inductees as Inductee[]).map((inductee) => ({
    bio: inductee['Bio URL'].toLowerCase().replace(/\.md$/, ''),
  }));
}

async function fetchInducteeData(bio: string) {
  const inductee = (inductees as Inductee[]).find(
    (i) => i['Bio URL'].toLowerCase().replace(/\.md$/, '') === bio
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
    `${bio.charAt(0).toUpperCase() + bio.slice(1)}.md`
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
  const { bio } = await params; // Await `params` before accessing `bio`

  if (!bio) return notFound();

  const { inductee, bioContent } = await fetchInducteeData(bio.toLowerCase());

  if (!inductee) return notFound();

  // Parse the markdown content
  const { content } = matter(bioContent);

  return (
    <main className="main-content">
      <div className="w-full max-w-screen-xl mx-auto bg-white/85 rounded-[12px] shadow-[0_4px_12px_rgba(0,0,0,0.1)] px-4 sm:px-6 lg:px-8 py-6">
        <section className="text-center mb-8">
          <h2 className="text-6xl font-bold">{inductee.Name}</h2>
          <p className="text-2xl text-muted-foreground font-medium mt-2">
            <span className="uppercase tracking-wide">Class of {inductee.Year}</span>
          </p>
        </section>

        <section className="mt-6">
        <Image
  src={`/images/inductees/${inductee.Image || 'default_inductee.jpg'}`}
  alt={inductee.Name}
  width={300} // Specify width
  height={300} // Specify height
  className="rounded-lg shadow-lg float-left mr-6 mb-4"
/>
          <div className="prose prose-lg dark:prose-invert text-gray-800 dark:text-gray-200 leading-relaxed">
            <ReactMarkdown remarkPlugins={[gfm]}>{content}</ReactMarkdown>
          </div>
        </section>
      </div>
    </main>
  );
}
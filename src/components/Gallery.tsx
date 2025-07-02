'use client";'
import Image from "next/image";
import { useState } from "react";
import dynamic from "next/dynamic";

// Dynamically import Lightbox with SSR disabled
const Lightbox = dynamic(
  () => import("yet-another-react-lightbox"),
  { ssr: false }
);
import "yet-another-react-lightbox/styles.css";

export function Gallery({ images }: { images: string[] }) {
  const [index, setIndex] = useState(-1);

  return (
    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {images.map((src, i) => (
        <div key={i} className="relative cursor-pointer">
          <Image
            src={src}
            alt={`Gallery image ${i + 1}`}
            width={400}
            height={300}
            className="rounded-xl shadow hover:scale-105 transition-transform duration-300 object-cover aspect-[4/3] max-h-[300px]"
            onClick={() => setIndex(i)}
          />
        </div>
      ))}
      {index >= 0 && (
        <Lightbox
          open={index >= 0}
          index={index}
          close={() => setIndex(-1)}
          slides={images.map((src) => ({ src }))}
        />
      )}
    </div>
  );
}
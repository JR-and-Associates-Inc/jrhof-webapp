import Image from "next/image";

type Inductee = {
  name: string;
  imageFilename: string; // e.g., "Terry_Reed.jpg"
};

export default function InducteeCard({ name, imageFilename }: Inductee) {
  return (
    <div className="flex flex-col items-center p-4 rounded-xl shadow-md bg-white">
      <Image
        src={`/images/inductees/${imageFilename}`}
        alt={name}
        width={200}
        height={200}
        className="rounded-full object-cover"
      />
      <h3 className="mt-4 text-lg font-bold">{name}</h3>
    </div>
  );
}
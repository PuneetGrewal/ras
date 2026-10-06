// The photos on a submission as a grid of thumbnails; tapping one opens it full size.
// The links are signed by the server and stop working after an hour; reloading the page makes new ones.
import type { PhotoLink } from "@/lib/data/photos";

export default function PhotoGallery({ photos }: { photos: PhotoLink[] }) {
  if (photos.length === 0) return <p className="text-ras-grey">No photos.</p>;

  return (
    <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {photos.map((photo, index) => (
        <li key={photo.path}>
          {photo.url ? (
            <a href={photo.url} target="_blank" rel="noopener noreferrer">
              <img
                src={photo.url}
                alt={`Site photo ${index + 1} (opens full size)`}
                loading="lazy"
                className="aspect-square w-full rounded border border-neutral-300 bg-neutral-100 object-cover"
              />
            </a>
          ) : (
            <div className="flex aspect-square items-center justify-center rounded border border-red-300 bg-red-50 p-2 text-center text-sm text-red-800">
              This photo couldn&apos;t be loaded.
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

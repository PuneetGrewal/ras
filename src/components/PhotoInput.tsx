// The safety form's photo picker: adds photos (phones offer "Take photo" or the library), shows
// a thumbnail of each with any problem underneath, and lets the framer remove one.
import { useEffect, useRef, type ChangeEvent } from "react";
import { ACCEPTED_PHOTO_TYPES, MAX_PHOTO_BYTES, MAX_PHOTOS, MIN_PHOTOS } from "@/lib/constants";
import { photoError } from "@/lib/validation";

// A chosen photo plus a temporary in-browser link to it, used for the thumbnail.
export type ChosenPhoto = { file: File; previewUrl: string };

type Props = {
  photos: ChosenPhoto[];
  onChange: (photos: ChosenPhoto[]) => void;
  error?: string;
};

export default function PhotoInput({ photos, onChange, error }: Props) {
  // Thumbnail links hold the photo in memory until released; release them all when the form goes away.
  const latestPhotos = useRef(photos);
  useEffect(() => {
    latestPhotos.current = photos;
  }, [photos]);
  useEffect(() => () => latestPhotos.current.forEach((photo) => URL.revokeObjectURL(photo.previewUrl)), []);

  // Each pick adds to the list, so a framer can take photos one at a time with the camera.
  function handleChoose(event: ChangeEvent<HTMLInputElement>) {
    const added = Array.from(event.target.files ?? [], (file) => ({ file, previewUrl: URL.createObjectURL(file) }));
    event.target.value = ""; // lets the same photo be picked again after removing it
    onChange([...photos, ...added]);
  }

  function handleRemove(removed: ChosenPhoto) {
    URL.revokeObjectURL(removed.previewUrl);
    onChange(photos.filter((photo) => photo !== removed));
  }

  return (
    <div>
      <p className="font-medium">Photos</p>
      <p className="text-sm text-ras-grey">
        {MIN_PHOTOS} to {MAX_PHOTOS} photos of the site. JPEG, PNG or WebP, {MAX_PHOTO_BYTES / 1024 / 1024} MB or less each.
      </p>

      {photos.length > 0 && (
        <ul className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo) => {
            const problem = photoError(photo.file);
            return (
              <li
                key={photo.previewUrl}
                className={`flex flex-col rounded border p-2 ${problem ? "border-red-300 bg-red-50" : "border-neutral-300"}`}
              >
                <img
                  src={photo.previewUrl}
                  alt={`Preview of ${photo.file.name}`}
                  className="aspect-square w-full rounded bg-neutral-100 object-cover"
                />
                <p className="mt-1 truncate text-xs text-ras-grey">{photo.file.name}</p>
                {problem && <p className="mt-1 text-sm text-red-800">{problem}</p>}
                {/* mt-auto keeps every Remove button at the bottom of its tile, lined up across the row. */}
                <div className="mt-auto pt-2">
                  <button
                    type="button"
                    onClick={() => handleRemove(photo)}
                    className="min-h-11 w-full rounded border border-neutral-300 bg-white text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* The browser's own file input, hidden behind a big label: tapping the label opens it. No
          `capture` attribute, so phones offer both "Take photo" and "Photo library". */}
      <label className="mt-3 flex min-h-12 cursor-pointer items-center justify-center rounded border-2 border-dashed border-ras-grey px-4 py-3 font-medium text-ras-green has-focus-visible:outline-2 has-focus-visible:outline-ras-green">
        {photos.length === 0 ? "Add photos" : "Add more photos"}
        <input type="file" multiple accept={ACCEPTED_PHOTO_TYPES.join(",")} onChange={handleChoose} className="sr-only" />
      </label>

      {error && <p className="mt-2 text-sm text-red-800">{error}</p>}
    </div>
  );
}

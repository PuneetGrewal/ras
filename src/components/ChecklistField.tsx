// One row of the safety checklist. The whole row is the tap target and at least 48 px tall,
// so it is easy to hit with a gloved finger; it turns green when ticked.
type Props = {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

export default function ChecklistField({ label, checked, onChange }: Props) {
  return (
    <label className="flex min-h-12 cursor-pointer items-center gap-3 rounded border border-neutral-300 px-3 py-2 has-checked:border-ras-green has-checked:bg-green-50">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="size-5 shrink-0 accent-ras-green"
      />
      <span>{label}</span>
    </label>
  );
}

// The green bar on every logged-in page: logo, the links for the user's role,
// their name and role, and a Sign out button.
import Link from "next/link";
import { signOut } from "@/lib/actions";
import type { Profile } from "@/lib/types";

const FRAMER_LINKS = [
  { href: "/submit", label: "New form" },
  { href: "/submissions", label: "My submissions" },
];
const ADMIN_LINKS = [{ href: "/admin", label: "Dashboard" }];

export default function Header({ profile }: { profile: Profile }) {
  const links = profile.role === "admin" ? ADMIN_LINKS : FRAMER_LINKS;

  return (
    <header className="bg-ras-green text-white">
      {/* Logo on the left, everything else on the right; flex-wrap stacks them into rows on a phone. */}
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-4 py-2">
        <Link href="/" className="flex items-center gap-3">
          <img src="/ras-logo.png" alt="RAS logo" className="h-10 w-auto" />
          <span className="text-lg font-semibold">RAS Safety</span>
        </Link>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
          <nav className="flex gap-1 font-medium">
            {links.map((link) => (
              <Link key={link.href} href={link.href} className="rounded px-3 py-3 hover:bg-white/10">
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <span>
              {profile.full_name} <span className="capitalize text-white/75">({profile.role})</span>
            </span>
            <form action={signOut}>
              <button type="submit" className="rounded border border-white/60 px-3 py-3 hover:bg-white/10">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </div>
    </header>
  );
}

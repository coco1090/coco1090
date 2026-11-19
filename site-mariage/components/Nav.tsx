import Link from "next/link";
import { site } from "@/content/site";

const links = [
  { href: "/#histoire", label: "Notre histoire" },
  { href: "/#infos", label: "Infos pratiques" },
  ...(site.registry ? [{ href: "/#liste", label: "Liste" }] : []),
];

export function Nav() {
  return (
    <header className="sticky top-0 z-20 border-b border-blush/60 bg-cream/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link href="/" className="script text-2xl text-rose hover:opacity-80" aria-label="Retour à l’accueil">
          {site.brideName} &amp; {site.groomName}
        </Link>
        <nav className="hidden gap-6 text-sm text-muted md:flex">
          {links.map((l) => (
            <a key={l.href} href={l.href} className="hover:text-rose">
              {l.label}
            </a>
          ))}
        </nav>
        <Link href="/rsvp" className="btn-primary !px-5 !py-2 text-sm">
          Répondre
        </Link>
      </div>
    </header>
  );
}

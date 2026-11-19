import Link from "next/link";
import { site } from "@/content/site";
import { Nav } from "@/components/Nav";
import { Floral, FloralCorner } from "@/components/Floral";

export default function Home() {
  return (
    <>
      <Nav />
      <main id="contenu">
        {/* Accueil */}
        <section className="relative overflow-hidden px-4 pb-20 pt-16 text-center md:pt-24">
          <FloralCorner className="pointer-events-none absolute -left-10 -bottom-10 h-56 w-56 text-blush-deep/60 md:h-80 md:w-80" />
          <FloralCorner className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rotate-180 text-sage/50 md:h-80 md:w-80" />
          <p className="text-xs tracking-[0.25em] text-muted uppercase sm:text-sm">{site.tagline}</p>
          <h1 className="script mt-6 text-[clamp(2.75rem,14vw,6rem)] leading-tight text-rose">
            {site.brideName} <span className="font-serif text-[0.6em] text-blush-deep" aria-hidden="true">&amp;</span> {site.groomName}
          </h1>
          <Floral className="mx-auto my-6 h-12 w-44 text-blush-deep" />
          <p className="font-serif text-2xl md:text-3xl">{site.dateLabel}</p>
          <p className="mt-1 text-muted">{site.city}</p>
          <Link href="/rsvp" className="btn-primary mt-8">
            Répondre à l’invitation
          </Link>
        </section>

        {/* Notre histoire */}
        <section id="histoire" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-16">
          <h2 className="text-center text-3xl md:text-4xl">Notre histoire</h2>
          <p className="mx-auto mt-8 max-w-2xl text-center font-serif text-xl leading-relaxed text-ink/90">{site.story}</p>
        </section>

        {/* Infos pratiques */}
        <section id="infos" className="mx-auto max-w-5xl scroll-mt-20 px-4 py-16">
          <h2 className="text-center text-3xl md:text-4xl">Infos pratiques</h2>
          <div className="mx-auto mt-8 grid max-w-xl gap-4">
            {site.practical.map((i) => (
              <div key={i.title} className="card">
                <h3 className="text-2xl text-rose">{i.title}</h3>
                <p className="mt-2 text-ink/85">{i.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Liste de mariage (optionnelle) */}
        {site.registry && (
          <section id="liste" className="scroll-mt-20 bg-white/50 px-4 py-16 text-center">
            <h2 className="text-3xl md:text-4xl">Liste de mariage</h2>
            <p className="mx-auto mt-4 max-w-xl text-ink/85">{site.registry.text}</p>
            <a href={site.registry.url} target="_blank" rel="noreferrer" className="btn-ghost mt-6">
              {site.registry.label}
            </a>
          </section>
        )}

        {/* RSVP */}
        <section id="rsvp" className="px-4 py-20 text-center">
          <Floral className="mx-auto mb-4 h-12 w-44 text-sage" />
          <h2 className="text-3xl md:text-4xl">Serez-vous des nôtres ?</h2>
          <p className="mt-3 text-muted">Merci de nous dire qui sera là, et de nous signaler vos allergies.</p>
          <Link href="/rsvp" className="btn-primary mt-6">
            Répondre
          </Link>
        </section>
      </main>
      <footer className="border-t border-blush/60 px-4 py-6 text-center text-xs text-muted">
        <p className="script text-2xl text-rose">
          {site.brideName} &amp; {site.groomName}
        </p>
        <p className="mt-1">{site.dateLabel}</p>
      </footer>
    </>
  );
}

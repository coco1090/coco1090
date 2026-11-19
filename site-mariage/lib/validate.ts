// Validation partagée (formulaire + serveur).

export const NAME_RE = /^[\p{L}][\p{L}' \-]{0,79}$/u;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
// 0612345678, 06 12 34 56 78, +33 6 12 34 56 78, +41…
export const PHONE_RE = /^(\+\d{1,3}[ .-]?)?(\(?\d{1,4}\)?[ .-]?){2,5}\d{2,4}$/;

export const norm = (s: string) => s.trim().replace(/\s+/g, " ");
export const normKey = (s: string) =>
  norm(s)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
export const cap = (s: string) => norm(s).replace(/(^|[\s\-'])(\p{L})/gu, (m, sep, l) => sep + l.toUpperCase());

export function checkName(v: string, label: string): string | null {
  const s = norm(v);
  if (s.length < 2) return `${label} : au moins 2 lettres.`;
  if (!NAME_RE.test(s)) return `${label} : lettres, espaces, tirets et apostrophes uniquement.`;
  return null;
}

export function checkEmail(v: string): string | null {
  const s = v.trim();
  if (!s) return "Email obligatoire.";
  if (s.length > 200 || !EMAIL_RE.test(s)) return "Email invalide (ex : prenom@exemple.fr).";
  return null;
}

export function checkPhone(v: string): string | null {
  const s = v.trim();
  if (!s) return null; // facultatif
  const digits = s.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15 || !PHONE_RE.test(s)) return "Téléphone invalide (ex : 06 12 34 56 78).";
  return null;
}

export function checkAddress(v: string): string | null {
  const s = norm(v);
  if (s.length < 10) return "Adresse trop courte : numéro, rue, code postal et ville.";
  if (!/\d/.test(s)) return "L’adresse doit contenir un numéro ou un code postal.";
  if (s.length > 500) return "Adresse trop longue.";
  return null;
}

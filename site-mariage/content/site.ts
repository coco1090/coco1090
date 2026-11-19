// Contenu du site : à adapter avec les mariés.

export const site = {
  brideName: "Alizée",
  groomName: "Adam",
  dateLabel: "29 mai 2027",
  date: "2027-05-29",
  city: "Lieu à préciser",
  tagline: "Nous avons la joie de vous inviter à célébrer notre mariage",
  story:
    "Quelques lignes sur votre histoire : votre rencontre, le jour où tout a basculé, et pourquoi vous avez envie de fêter ça avec les gens que vous aimez.",
  practical: [
    { title: "Parking", text: "Un parking gratuit est disponible sur place." },
  ],
  // Mettre à null pour masquer la section « Liste de mariage »
  registry: null as null | { text: string; url: string; label: string },
  // registry: { text: "Votre présence est le plus beau des cadeaux…", url: "https://…", label: "Participer à la cagnotte" },
};

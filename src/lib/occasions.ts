// Shared occasion map — used by /occasions, /occasions/[slug] and the header.
// img/position drive the editorial cards; match keywords find live products
// (empty grids fall back to an editorial note + boutique link — never fake stock).

export type Occasion = {
  slug: string;
  name: string;
  line: string;
  img: string;
  position?: string;
  match: string[];
};

export const OCCASIONS: Occasion[] = [
  {
    slug: "nikkah",
    name: "Nikkah",
    line: "Ivory whites & pearl details",
    img: "/uploads/pk-nikkah.jpg",
    match: ["nikkah", "nikah", "ivory", "white", "pearl"],
  },
  {
    slug: "mehndi",
    name: "Mehndi",
    line: "Colour, mirror-work & joy",
    img: "/uploads/pk-mehndi.jpg",
    match: ["mehndi", "mayun", "dholki", "yellow", "green"],
  },
  {
    slug: "baraat",
    name: "Baraat",
    line: "The classic red lehenga",
    img: "/uploads/pk-baraat.jpg",
    match: ["baraat", "barat", "red", "lehenga"],
  },
  {
    slug: "walima",
    name: "Walima",
    line: "Soft pastels & reception gowns",
    img: "/uploads/pk-walima.jpg",
    match: ["walima", "valima", "reception", "gown"],
  },
  {
    slug: "party",
    name: "Party & Reception",
    line: "Festive formal wear",
    img: "/uploads/p-blush-organza.jpg",
    match: ["party", "festive", "formal", "organza"],
  },
  {
    slug: "others",
    name: "Others",
    line: "Dholki, engagement & more",
    img: "/uploads/pk-ceremony.jpg",
    match: ["dholki", "engagement", "sharara", "gharara"],
  },
  {
    slug: "wedding-guest",
    name: "Wedding Guest",
    line: "Elegant, never louder than the bride",
    img: "/uploads/p-blush-organza.jpg",
    position: "50% 25%",
    match: ["party", "formal", "organza", "gown"],
  },
  {
    slug: "bridesmaids",
    name: "Bridesmaids",
    line: "Coordinated festive sets",
    img: "/uploads/p-emerald-zardozi.jpg",
    match: ["zardozi", "formal", "gown", "emerald"],
  },
  {
    slug: "mother-of-the-bride",
    name: "Mother of the Bride & Groom",
    line: "Graceful heirloom formals",
    img: "/uploads/p-ivory-gown.jpg",
    match: ["gown", "silk", "formal", "ivory"],
  },
];

export const PRIMARY_OCCASIONS = ["nikkah", "mehndi", "baraat", "walima"] as const;

export function getOccasion(slug: string) {
  return OCCASIONS.find((o) => o.slug === slug);
}

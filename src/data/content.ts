/** Conținut de exemplu — înlocuiește cu textele reale ale partidului. */

export type Article = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  category: string;
  author: string;
  date: string;
};

export const articles: Article[] = [
  {
    slug: "plan-reimpadurire-2030",
    title: "Planul național de reîmpădurire pentru 2030",
    excerpt:
      "500.000 de hectare replantate, finanțate prin parteneriate publice și private.",
    body: "Propunem un program național coordonat de reîmpădurire, cu monitorizare satelitară independentă și bugete transparente pentru fiecare județ. Fiecare hectar plantat este raportat public, iar comunitățile locale primesc finanțare directă pentru întreținerea puieților în primii cinci ani.",
    category: "Mediu",
    author: "Ana Dobre",
    date: "2026-06-22",
  },
  {
    slug: "poluarea-in-marile-orase",
    title: "Cum reducem poluarea din marile orașe",
    excerpt:
      "Zone cu emisii reduse, transport public gratuit și senzori în fiecare cartier.",
    body: "Calitatea aerului se măsoară, nu se presupune. Propunem o rețea publică de senzori, date deschise în timp real și investiții în transport electric, plus programe de sprijin pentru familiile care renunță la mașinile vechi.",
    category: "Orașe",
    author: "Mihai Ionescu",
    date: "2026-06-15",
  },
  {
    slug: "energie-solara-in-comunitati",
    title: "Energie solară în comunități",
    excerpt:
      "Rețele descentralizate de producție, accesibile fiecărei localități.",
    body: "Comunitățile energetice permit primăriilor, școlilor și cetățenilor să producă și să împartă energie locală. Propunem un cadru legal simplu și finanțare de start pentru primele 200 de comunități.",
    category: "Energie",
    author: "Ioana Marin",
    date: "2026-05-30",
  },
  {
    slug: "transport-public-gratuit",
    title: "Transport public gratuit în 12 municipii",
    excerpt: "Un pilot care funcționează, gata de extins la nivel național.",
    body: "Rezultatele pilotului arată o scădere a traficului cu 18% și o creștere a utilizării transportului public cu 42%. Extinderea este fezabilă bugetar prin redirecționarea subvențiilor pentru combustibili fosili.",
    category: "Transport",
    author: "Radu Pop",
    date: "2026-05-11",
  },
];

export type PressRelease = {
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  date: string;
};

export const pressReleases: PressRelease[] = [
  {
    slug: "pozitia-oug-energetic",
    title: "Poziția noastră privind OUG-ul energetic",
    excerpt: "Solicităm consultare publică reală înainte de adoptare.",
    body: "Partidul Verde cere Guvernului să suspende adoptarea ordonanței până la finalizarea unei consultări publice cu autoritățile locale, producătorii independenți și organizațiile de mediu.",
    date: "2026-06-20",
  },
  {
    slug: "parteneriat-parcuri-urbane",
    title: "Parteneriat pentru parcuri urbane",
    excerpt: "Zece orașe se alătură programului „Un parc pentru fiecare cartier”.",
    body: "Programul prevede identificarea terenurilor disponibile, consultarea locuitorilor și amenajarea a cel puțin unui spațiu verde nou în fiecare cartier până în 2028.",
    date: "2026-06-11",
  },
  {
    slug: "declaratie-paduri-carpati",
    title: "Declarație privind protejarea pădurilor Carpaților",
    excerpt: "Ne opunem proiectului de exploatare forestieră din zonele protejate.",
    body: "Pădurile virgine nu sunt o resursă negociabilă. Cerem inventarierea completă și publicarea hărților de exploatare pentru toate parcelele din ariile protejate.",
    date: "2026-05-28",
  },
];

export type PartyEvent = {
  slug: string;
  title: string;
  description: string;
  date: string;
  location: string;
};

export const events: PartyEvent[] = [
  {
    slug: "adunare-generala-vara",
    title: "Adunare generală de vară",
    description:
      "Membrii și coordonatorii de filiale se reunesc pentru a vota prioritățile pentru toamnă.",
    date: "2026-07-05",
    location: "Cluj-Napoca · Casa Verde",
  },
  {
    slug: "tabara-ecologica-tineri",
    title: "Tabără ecologică pentru tineri",
    description:
      "Trei zile de ateliere despre climă, biodiversitate și organizare civică.",
    date: "2026-07-19",
    location: "Brașov · Poiana Mică",
  },
  {
    slug: "dezbatere-clima-sanatate",
    title: "Dezbatere publică: Clima și sănătatea",
    description:
      "Medici, cercetători și cetățeni discută efectele poluării asupra sănătății.",
    date: "2026-08-02",
    location: "București · Sala Civică, 18:00",
  },
];

export type Branch = {
  slug: string;
  city: string;
  county: string;
  name: string;
  coordinator: string;
  members: number;
  volunteers: number;
  address: string;
};

export const branches: Branch[] = [
  {
    slug: "bucuresti",
    city: "București",
    county: "București",
    name: "Filiala Centrală",
    coordinator: "Elena Stan",
    members: 1240,
    volunteers: 310,
    address: "Str. Verdeții 12, Sector 3",
  },
  {
    slug: "cluj",
    city: "Cluj-Napoca",
    county: "Cluj",
    name: "Filiala Nord",
    coordinator: "Andrei Munteanu",
    members: 980,
    volunteers: 240,
    address: "Bd. Pădurea 8",
  },
  {
    slug: "timisoara",
    city: "Timișoara",
    county: "Timiș",
    name: "Filiala Vest",
    coordinator: "Diana Lupu",
    members: 760,
    volunteers: 190,
    address: "Str. Fagului 45",
  },
  {
    slug: "iasi",
    city: "Iași",
    county: "Iași",
    name: "Filiala Est",
    coordinator: "Vlad Chiriac",
    members: 640,
    volunteers: 150,
    address: "Str. Teiului 3",
  },
  {
    slug: "brasov",
    city: "Brașov",
    county: "Brașov",
    name: "Filiala Carpați",
    coordinator: "Maria Oprea",
    members: 520,
    volunteers: 130,
    address: "Str. Zăvoiului 21",
  },
  {
    slug: "constanta",
    city: "Constanța",
    county: "Constanța",
    name: "Filiala Litoral",
    coordinator: "Sorin Albu",
    members: 470,
    volunteers: 120,
    address: "Bd. Mării 74",
  },
];

export type TeamMember = {
  name: string;
  role: string;
  bio: string;
  initials: string;
};

export const team: TeamMember[] = [
  {
    name: "Elena Stan",
    role: "Președintă",
    bio: "Inginer de mediu, 15 ani în politici publice de calitate a aerului.",
    initials: "ES",
  },
  {
    name: "Andrei Munteanu",
    role: "Vicepreședinte",
    bio: "Specialist în tranziție energetică și comunități energetice locale.",
    initials: "AM",
  },
  {
    name: "Ioana Marin",
    role: "Secretar general",
    bio: "Organizare internă, filiale și democrație participativă.",
    initials: "IM",
  },
  {
    name: "Radu Pop",
    role: "Purtător de cuvânt",
    bio: "Jurnalist de investigație, autor de rapoarte privind transportul urban.",
    initials: "RP",
  },
  {
    name: "Diana Lupu",
    role: "Coordonator voluntari",
    bio: "Construiește rețeaua națională de voluntari și programele de formare.",
    initials: "DL",
  },
  {
    name: "Mihai Ionescu",
    role: "Coordonator politici publice",
    bio: "Economist, specializat în finanțare verde și bugete participative.",
    initials: "MI",
  },
];

export const values = [
  {
    index: "01",
    title: "Aer & Apă curată",
    text: "Standarde stricte de mediu și monitorizare independentă a calității aerului în fiecare județ.",
  },
  {
    index: "02",
    title: "Energie regenerabilă",
    text: "Tranziție energetică accelerată, surse locale și independență față de combustibilii fosili.",
  },
  {
    index: "03",
    title: "Justiție climatică",
    text: "Protejăm comunitățile vulnerabile și asigurăm o tranziție echitabilă pentru toți.",
  },
];

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ro-RO", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

// CV de Davy Aymard Kouassi : une seule source pour la page /cv, la page À propos et le PDF téléchargeable.
// Après une modification : `npm run cv` régénère le PDF (public/cv-davy-aymard-kouassi.pdf).

export const CV = {
  title: 'Creative Director & Visual Strategist',
  years: 6, // années d'expérience (depuis 2020)
  location: 'Abidjan · Angré',
  summary:
    "Graphiste senior et directeur artistique, plus de 6 ans en agence de communication. Je conçois des campagnes visuelles multi-formats (print, digital, motion design) et des identités de marque, de la prise de brief à la livraison finale. Rigoureux, autonome et orienté résultats, je coordonne des équipes créatives sur des projets à forte exigence, avec une maîtrise avancée d'Adobe Creative Cloud et des outils de création assistée par IA.",
  experience: [
    { from: '2024', to: '2026', role: 'Senior Graphic Designer', company: 'SimplyBlack Media', place: 'Afrique du Sud · Côte d’Ivoire',
      points: ['Direction artistique des comptes Budweiser, TotalEnergies, SuperClean, Bavaria', 'Content calendars, key visuals et déclinaisons 360°'] },
    { from: '2022', to: '2024', role: 'Lead Graphic Designer', company: 'PharmaConsults Expertise', place: 'Côte d’Ivoire',
      points: ['Pilotage de la création graphique et des supports de communication', 'Coordination des productions, du brief à la livraison'] },
    { from: '2020', to: '2022', role: 'Graphic Designer', company: 'YEB Digital Consulting', place: 'Côte d’Ivoire · France',
      points: ['Visuels réseaux sociaux, affiches et identités pour des clients en Afrique et en France'] },
  ],
  side: { year: '2023', role: 'Co-fondateur du RCCI', company: 'Réseau des Créatifs de Côte d’Ivoire' },
  education: [
    { year: '2017 – 2018', title: 'BTS Développement d’applications', school: 'ESAM, Yamoussoukro' },
    { year: '2015 – 2016', title: 'Baccalauréat', school: 'Lycée Moderne BAD, Yamoussoukro' },
  ],
  skills: [
    { name: 'Photoshop', level: 95 }, { name: 'Illustrator', level: 92 }, { name: 'InDesign', level: 85 },
    { name: 'After Effects & Premiere Pro', level: 72 },
  ],
  softSkills: [{ name: 'Leadership', level: 80 }, { name: 'Travail d’équipe', level: 92 }, { name: 'Management', level: 82 }],
  ai: ['Magnific', 'Claude AI', 'Adobe Firefly'],
  languages: [{ name: 'Français', level: 95, note: 'Courant' }, { name: 'Anglais', level: 65, note: 'Professionnel' }],
  hobbies: [['📷', 'Photographie'], ['🎵', 'Musique'], ['✏️', 'Dessin'], ['🚴', 'Vélo'], ['📚', 'Lecture'], ['✈️', 'Voyages']],
} as const;

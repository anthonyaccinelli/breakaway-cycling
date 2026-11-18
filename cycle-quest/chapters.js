// The ten Adventure chapters: fixed 100-mile routes, enemy rosters and chapter bosses.
// Rosters: each chapter has 8 monsters of its own (D&D SRD 5.1): newly introduced ones, plus
// any `returning` from an earlier chapter (Wolf, introduced in Chapter 1, returns in
// Chapter 3). From Chapter 2 on, 4 of the previous chapter's own 8 carry over, for 12. Picked at random within
// each chapter's challenge band (seeded), then frozen here. Edit freely.
// Route seeds match the Classic route registry, so each chapter's terrain never changes.

export const CHAPTER_COUNT = 10;

export const CHAPTERS = Object.freeze([
  {
    chapter: 1,
    title: 'COASTAL BEGINNINGS',
    route: { seed: 829101001, miles: 100, gainFeet: 5000, terrain: 'rolling' },
    newMonsters: ['hawk', 'scorpion', 'jackal', 'raven', 'bat', 'cat', 'wolf', 'goat'],
    carriedOver: [],
    boss: 'bandit'
  },
  {
    chapter: 2,
    title: 'CASCADE CROSSING',
    route: { seed: 829101002, miles: 100, gainFeet: 7500, terrain: 'mountain' },
    newMonsters: [
      'mastiff',
      'giant-crab',
      'flying-snake',
      'drow',
      'giant-badger',
      'boar',
      'constrictor-snake',
      'giant-frog'
    ],
    carriedOver: ['cat', 'wolf', 'hawk', 'scorpion'],
    boss: 'draft-horse'
  },
  {
    chapter: 3,
    title: 'HIGH DESERT',
    route: { seed: 829101003, miles: 100, gainFeet: 3300, terrain: 'rolling' },
    newMonsters: [
      'swarm-of-ravens',
      'violet-fungus',
      'zombie',
      'riding-horse',
      'giant-wasp',
      'deep-gnome-svirfneblin',
      'giant-sea-horse'
    ],
    returning: ['wolf'],
    carriedOver: ['mastiff', 'giant-crab', 'giant-badger', 'giant-frog'],
    boss: 'crocodile'
  },
  {
    chapter: 4,
    title: 'DESERT DESCENT',
    route: { seed: 829101004, miles: 100, gainFeet: 2200, terrain: 'rolling' },
    newMonsters: [
      'swarm-of-wasps',
      'satyr',
      'worg',
      'swarm-of-beetles',
      'rust-monster',
      'ice-mephit',
      'shadow',
      'brown-bear'
    ],
    carriedOver: ['giant-sea-horse', 'wolf', 'zombie', 'swarm-of-ravens'],
    boss: 'animated-armor'
  },
  {
    chapter: 5,
    title: 'SNAKE RIVER LOWLANDS',
    route: { seed: 829101005, miles: 100, gainFeet: 1800, terrain: 'flat' },
    newMonsters: [
      'hippogriff',
      'harpy',
      'tiger',
      'swarm-of-quippers',
      'ankheg',
      'ghast',
      'gargoyle',
      'giant-boar'
    ],
    carriedOver: ['swarm-of-wasps', 'ice-mephit', 'satyr', 'worg'],
    boss: 'bandit-captain'
  },
  {
    chapter: 6,
    title: 'IDAHO FOOTHILLS',
    route: { seed: 829101006, miles: 100, gainFeet: 4200, terrain: 'rolling' },
    newMonsters: [
      'ogre-zombie',
      'swarm-of-poisonous-snakes',
      'grick',
      'rhinoceros',
      'griffon',
      'green-dragon-wyrmling',
      'will-o-wisp',
      'sea-hag'
    ],
    carriedOver: ['hippogriff', 'giant-boar', 'swarm-of-quippers', 'ghast'],
    boss: 'bearded-devil'
  },
  {
    chapter: 7,
    title: 'EASTERN HIGHLANDS',
    route: { seed: 829101007, miles: 100, gainFeet: 2800, terrain: 'rolling' },
    newMonsters: [
      'knight',
      'killer-whale',
      'winter-wolf',
      'phase-spider',
      'mummy',
      'elephant',
      'fire-elemental',
      'giant-shark'
    ],
    carriedOver: ['green-dragon-wyrmling', 'ogre-zombie', 'swarm-of-poisonous-snakes', 'sea-hag'],
    boss: 'barbed-devil'
  },
  {
    chapter: 8,
    title: 'ROCKY MOUNTAIN APPROACH',
    route: { seed: 829101008, miles: 100, gainFeet: 4200, terrain: 'mountain' },
    newMonsters: [
      'hill-giant',
      'unicorn',
      'xorn',
      'wraith',
      'chimera',
      'mage',
      'shield-guardian',
      'assassin'
    ],
    carriedOver: ['giant-shark', 'elephant', 'knight', 'phase-spider'],
    boss: 'stone-giant'
  },
  {
    chapter: 9,
    title: 'YELLOWSTONE ASCENT',
    route: { seed: 829101009, miles: 100, gainFeet: 5500, terrain: 'mountain' },
    newMonsters: [
      'tyrannosaurus-rex',
      'hezrou',
      'frost-giant',
      'bone-devil',
      'aboleth',
      'gynosphinx',
      'archmage',
      'adult-brass-dragon'
    ],
    carriedOver: ['wraith', 'unicorn', 'mage', 'hill-giant'],
    boss: 'nalfeshnee'
  },
  {
    chapter: 10,
    title: 'THE FINAL DESCENT',
    route: { seed: 829101010, miles: 100, gainFeet: 3900, terrain: 'mountain' },
    newMonsters: [
      'rakshasa',
      'purple-worm',
      'adult-bronze-dragon',
      'adult-silver-dragon',
      'adult-gold-dragon',
      'balor',
      'pit-fiend',
      'ancient-copper-dragon'
    ],
    carriedOver: ['adult-brass-dragon', 'hezrou', 'bone-devil', 'gynosphinx'],
    boss: 'ancient-blue-dragon'
  }
]);

export function chapterInfo(chapter) {
  return CHAPTERS[chapter - 1] || null;
}

// Monster ids a chapter's random encounters draw from (8 in Chapter 1, 12 after).
export function chapterRoster(chapter) {
  const info = chapterInfo(Math.min(CHAPTER_COUNT, Math.max(1, Math.floor(chapter) || 1)));
  return [...info.newMonsters, ...(info.returning || []), ...info.carriedOver];
}

export function chapterRoute(chapter, generateRoute) {
  const info = chapterInfo(chapter);
  if (!info) return null;
  const { miles, terrain, gainFeet, seed } = info.route;
  const route = generateRoute(miles, terrain, gainFeet, seed);
  // `storyChapter` is the saved field name from earlier versions; kept so old saves resume.
  return { ...route, name: 'CHAPTER ' + chapter + ' · ' + info.title, storyChapter: chapter };
}

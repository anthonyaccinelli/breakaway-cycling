// Names/types adapted from SRD 5.1; numerical bases are authored Cycle Quest stats.
// tier is a content-placement hint, never a rider level or a combat multiplier.
export const MONSTERS=Object.freeze([
  {
    "id": "headwind",
    "name": "Headwind",
    "type": "elemental",
    "tier": 1,
    "baseHP": 9000,
    "baseAttack": 0.25
  },
  {
    "id": "bat",
    "name": "Bat",
    "type": "beast",
    "tier": 1,
    "baseHP": 7400,
    "baseAttack": 0.16
  },
  {
    "id": "frog",
    "name": "Frog",
    "type": "beast",
    "tier": 1,
    "baseHP": 7400,
    "baseAttack": 0.16
  },
  {
    "id": "rat",
    "name": "Rat",
    "type": "beast",
    "tier": 1,
    "baseHP": 7500,
    "baseAttack": 0.2
  },
  {
    "id": "sea-horse",
    "name": "Sea Horse",
    "type": "beast",
    "tier": 1,
    "baseHP": 7400,
    "baseAttack": 0.16
  },
  {
    "id": "scorpion",
    "name": "Scorpion",
    "type": "beast",
    "tier": 1,
    "baseHP": 7400,
    "baseAttack": 0.18
  },
  {
    "id": "owl",
    "name": "Owl",
    "type": "beast",
    "tier": 1,
    "baseHP": 7400,
    "baseAttack": 0.2
  },
  {
    "id": "raven",
    "name": "Raven",
    "type": "beast",
    "tier": 1,
    "baseHP": 7400,
    "baseAttack": 0.21
  },
  {
    "id": "spider",
    "name": "Spider",
    "type": "beast",
    "tier": 1,
    "baseHP": 7400,
    "baseAttack": 0.21
  },
  {
    "id": "hawk",
    "name": "Hawk",
    "type": "beast",
    "tier": 1,
    "baseHP": 7400,
    "baseAttack": 0.22
  },
  {
    "id": "quipper",
    "name": "Quipper",
    "type": "beast",
    "tier": 1,
    "baseHP": 7400,
    "baseAttack": 0.22
  },
  {
    "id": "weasel",
    "name": "Weasel",
    "type": "beast",
    "tier": 1,
    "baseHP": 7400,
    "baseAttack": 0.22
  },
  {
    "id": "cat",
    "name": "Cat",
    "type": "beast",
    "tier": 1,
    "baseHP": 7900,
    "baseAttack": 0.16
  },
  {
    "id": "crab",
    "name": "Crab",
    "type": "beast",
    "tier": 1,
    "baseHP": 7900,
    "baseAttack": 0.16
  },
  {
    "id": "lizard",
    "name": "Lizard",
    "type": "beast",
    "tier": 1,
    "baseHP": 7900,
    "baseAttack": 0.16
  },
  {
    "id": "baboon",
    "name": "Baboon",
    "type": "beast",
    "tier": 1,
    "baseHP": 8700,
    "baseAttack": 0.19
  },
  {
    "id": "jackal",
    "name": "Jackal",
    "type": "beast",
    "tier": 1,
    "baseHP": 8700,
    "baseAttack": 0.19
  },
  {
    "id": "badger",
    "name": "Badger",
    "type": "beast",
    "tier": 1,
    "baseHP": 8700,
    "baseAttack": 0.18
  },
  {
    "id": "eagle",
    "name": "Eagle",
    "type": "beast",
    "tier": 1,
    "baseHP": 8700,
    "baseAttack": 0.23
  },
  {
    "id": "octopus",
    "name": "Octopus",
    "type": "beast",
    "tier": 1,
    "baseHP": 8700,
    "baseAttack": 0.21
  },
  {
    "id": "giant-fire-beetle",
    "name": "Giant Fire Beetle",
    "type": "beast",
    "tier": 1,
    "baseHP": 9300,
    "baseAttack": 0.2
  },
  {
    "id": "commoner",
    "name": "Commoner",
    "type": "humanoid",
    "tier": 1,
    "baseHP": 9300,
    "baseAttack": 0.21
  },
  {
    "id": "deer",
    "name": "Deer",
    "type": "beast",
    "tier": 1,
    "baseHP": 9300,
    "baseAttack": 0.21
  },
  {
    "id": "goat",
    "name": "Goat",
    "type": "beast",
    "tier": 1,
    "baseHP": 9300,
    "baseAttack": 0.23
  },
  {
    "id": "hyena",
    "name": "Hyena",
    "type": "beast",
    "tier": 1,
    "baseHP": 9800,
    "baseAttack": 0.22
  },
  {
    "id": "vulture",
    "name": "Vulture",
    "type": "beast",
    "tier": 1,
    "baseHP": 9800,
    "baseAttack": 0.21
  },
  {
    "id": "homunculus",
    "name": "Homunculus",
    "type": "construct",
    "tier": 1,
    "baseHP": 9800,
    "baseAttack": 0.21
  },
  {
    "id": "awakened-shrub",
    "name": "Awakened Shrub",
    "type": "plant",
    "tier": 1,
    "baseHP": 10600,
    "baseAttack": 0.19
  },
  {
    "id": "shrieker",
    "name": "Shrieker",
    "type": "plant",
    "tier": 1,
    "baseHP": 10600,
    "baseAttack": 0.16
  },
  {
    "id": "lemure",
    "name": "Lemure",
    "type": "fiend",
    "tier": 1,
    "baseHP": 10600,
    "baseAttack": 0.22
  },
  {
    "id": "poisonous-snake",
    "name": "Poisonous Snake",
    "type": "beast",
    "tier": 2,
    "baseHP": 7400,
    "baseAttack": 0.19
  },
  {
    "id": "mastiff",
    "name": "Mastiff",
    "type": "beast",
    "tier": 2,
    "baseHP": 7900,
    "baseAttack": 0.2
  },
  {
    "id": "snake",
    "name": "Snake",
    "type": "beast",
    "tier": 2,
    "baseHP": 7900,
    "baseAttack": 0.2
  },
  {
    "id": "flying-snake",
    "name": "Flying Snake",
    "type": "beast",
    "tier": 2,
    "baseHP": 7900,
    "baseAttack": 0.22
  },
  {
    "id": "blood-hawk",
    "name": "Blood Hawk",
    "type": "beast",
    "tier": 2,
    "baseHP": 8600,
    "baseAttack": 0.2
  },
  {
    "id": "cultist",
    "name": "Cultist",
    "type": "humanoid",
    "tier": 2,
    "baseHP": 9100,
    "baseAttack": 0.2
  },
  {
    "id": "noble",
    "name": "Noble",
    "type": "humanoid",
    "tier": 2,
    "baseHP": 9100,
    "baseAttack": 0.2
  },
  {
    "id": "giant-weasel",
    "name": "Giant Weasel",
    "type": "beast",
    "tier": 2,
    "baseHP": 9100,
    "baseAttack": 0.21
  },
  {
    "id": "merfolk",
    "name": "Merfolk",
    "type": "humanoid",
    "tier": 2,
    "baseHP": 9500,
    "baseAttack": 0.16
  },
  {
    "id": "mule",
    "name": "Mule",
    "type": "beast",
    "tier": 2,
    "baseHP": 9500,
    "baseAttack": 0.19
  },
  {
    "id": "bandit",
    "name": "Bandit",
    "type": "humanoid",
    "tier": 2,
    "baseHP": 9500,
    "baseAttack": 0.2
  },
  {
    "id": "guard",
    "name": "Guard",
    "type": "humanoid",
    "tier": 2,
    "baseHP": 9500,
    "baseAttack": 0.17
  },
  {
    "id": "tribal-warrior",
    "name": "Tribal Warrior",
    "type": "humanoid",
    "tier": 2,
    "baseHP": 9500,
    "baseAttack": 0.17
  },
  {
    "id": "pony",
    "name": "Pony",
    "type": "beast",
    "tier": 2,
    "baseHP": 9500,
    "baseAttack": 0.21
  },
  {
    "id": "giant-crab",
    "name": "Giant Crab",
    "type": "beast",
    "tier": 2,
    "baseHP": 9900,
    "baseAttack": 0.2
  },
  {
    "id": "camel",
    "name": "Camel",
    "type": "beast",
    "tier": 2,
    "baseHP": 10200,
    "baseAttack": 0.2
  },
  {
    "id": "sprite",
    "name": "Sprite",
    "type": "fey",
    "tier": 3,
    "baseHP": 7400,
    "baseAttack": 0.18
  },
  {
    "id": "giant-centipede",
    "name": "Giant Centipede",
    "type": "beast",
    "tier": 3,
    "baseHP": 7400,
    "baseAttack": 0.2
  },
  {
    "id": "goblin",
    "name": "Goblin",
    "type": "humanoid",
    "tier": 3,
    "baseHP": 7400,
    "baseAttack": 0.2
  },
  {
    "id": "pseudodragon",
    "name": "Pseudodragon",
    "type": "dragon",
    "tier": 3,
    "baseHP": 7400,
    "baseAttack": 0.2
  },
  {
    "id": "acolyte",
    "name": "Acolyte",
    "type": "humanoid",
    "tier": 3,
    "baseHP": 7900,
    "baseAttack": 0.17
  },
  {
    "id": "boar",
    "name": "Boar",
    "type": "beast",
    "tier": 3,
    "baseHP": 8400,
    "baseAttack": 0.19
  },
  {
    "id": "giant-wolf-spider",
    "name": "Giant Wolf Spider",
    "type": "beast",
    "tier": 3,
    "baseHP": 8400,
    "baseAttack": 0.19
  },
  {
    "id": "wolf",
    "name": "Wolf",
    "type": "beast",
    "tier": 3,
    "baseHP": 8400,
    "baseAttack": 0.21
  },
  {
    "id": "grimlock",
    "name": "Grimlock",
    "type": "humanoid",
    "tier": 3,
    "baseHP": 8400,
    "baseAttack": 0.21
  },
  {
    "id": "giant-poisonous-snake",
    "name": "Giant Poisonous Snake",
    "type": "beast",
    "tier": 3,
    "baseHP": 8400,
    "baseAttack": 0.21
  },
  {
    "id": "giant-badger",
    "name": "Giant Badger",
    "type": "beast",
    "tier": 3,
    "baseHP": 8700,
    "baseAttack": 0.2
  },
  {
    "id": "constrictor-snake",
    "name": "Constrictor Snake",
    "type": "beast",
    "tier": 3,
    "baseHP": 8700,
    "baseAttack": 0.2
  },
  {
    "id": "drow",
    "name": "Drow",
    "type": "humanoid",
    "tier": 3,
    "baseHP": 8700,
    "baseAttack": 0.2
  },
  {
    "id": "panther",
    "name": "Panther",
    "type": "beast",
    "tier": 3,
    "baseHP": 8700,
    "baseAttack": 0.2
  },
  {
    "id": "skeleton",
    "name": "Skeleton",
    "type": "undead",
    "tier": 3,
    "baseHP": 8700,
    "baseAttack": 0.2
  },
  {
    "id": "elk",
    "name": "Elk",
    "type": "beast",
    "tier": 3,
    "baseHP": 8700,
    "baseAttack": 0.21
  },
  {
    "id": "riding-horse",
    "name": "Riding Horse",
    "type": "beast",
    "tier": 3,
    "baseHP": 8700,
    "baseAttack": 0.21
  },
  {
    "id": "flying-sword",
    "name": "Flying Sword",
    "type": "construct",
    "tier": 3,
    "baseHP": 9300,
    "baseAttack": 0.2
  },
  {
    "id": "dretch",
    "name": "Dretch",
    "type": "fiend",
    "tier": 3,
    "baseHP": 9400,
    "baseAttack": 0.19
  },
  {
    "id": "violet-fungus",
    "name": "Violet Fungus",
    "type": "plant",
    "tier": 3,
    "baseHP": 9400,
    "baseAttack": 0.19
  },
  {
    "id": "giant-frog",
    "name": "Giant Frog",
    "type": "beast",
    "tier": 3,
    "baseHP": 9400,
    "baseAttack": 0.19
  },
  {
    "id": "giant-owl",
    "name": "Giant Owl",
    "type": "beast",
    "tier": 3,
    "baseHP": 9500,
    "baseAttack": 0.21
  },
  {
    "id": "axe-beak",
    "name": "Axe Beak",
    "type": "beast",
    "tier": 3,
    "baseHP": 9500,
    "baseAttack": 0.2
  },
  {
    "id": "giant-lizard",
    "name": "Giant Lizard",
    "type": "beast",
    "tier": 3,
    "baseHP": 9500,
    "baseAttack": 0.2
  },
  {
    "id": "draft-horse",
    "name": "Draft Horse",
    "type": "beast",
    "tier": 3,
    "baseHP": 9500,
    "baseAttack": 0.22
  },
  {
    "id": "steam-mephit",
    "name": "Steam Mephit",
    "type": "elemental",
    "tier": 3,
    "baseHP": 9700,
    "baseAttack": 0.19
  },
  {
    "id": "blink-dog",
    "name": "Blink Dog",
    "type": "fey",
    "tier": 3,
    "baseHP": 9800,
    "baseAttack": 0.19
  },
  {
    "id": "zombie",
    "name": "Zombie",
    "type": "undead",
    "tier": 3,
    "baseHP": 9800,
    "baseAttack": 0.19
  },
  {
    "id": "giant-bat",
    "name": "Giant Bat",
    "type": "beast",
    "tier": 3,
    "baseHP": 9800,
    "baseAttack": 0.2
  },
  {
    "id": "swarm-of-bats",
    "name": "Swarm of Bats",
    "type": "swarm of Tiny beasts",
    "tier": 3,
    "baseHP": 9800,
    "baseAttack": 0.2
  },
  {
    "id": "swarm-of-rats",
    "name": "Swarm of Rats",
    "type": "swarm of Tiny beasts",
    "tier": 3,
    "baseHP": 10000,
    "baseAttack": 0.2
  },
  {
    "id": "swarm-of-ravens",
    "name": "Swarm of Ravens",
    "type": "swarm of Tiny beasts",
    "tier": 3,
    "baseHP": 10000,
    "baseAttack": 0.21
  },
  {
    "id": "magmin",
    "name": "Magmin",
    "type": "elemental",
    "tier": 4,
    "baseHP": 7400,
    "baseAttack": 0.2
  },
  {
    "id": "hobgoblin",
    "name": "Hobgoblin",
    "type": "humanoid",
    "tier": 4,
    "baseHP": 7700,
    "baseAttack": 0.19
  },
  {
    "id": "giant-wasp",
    "name": "Giant Wasp",
    "type": "beast",
    "tier": 4,
    "baseHP": 8100,
    "baseAttack": 0.19
  },
  {
    "id": "orc",
    "name": "Orc",
    "type": "humanoid",
    "tier": 4,
    "baseHP": 8400,
    "baseAttack": 0.21
  },
  {
    "id": "giant-sea-horse",
    "name": "Giant Sea Horse",
    "type": "beast",
    "tier": 4,
    "baseHP": 8500,
    "baseAttack": 0.19
  },
  {
    "id": "deep-gnome-svirfneblin",
    "name": "Deep Gnome (Svirfneblin)",
    "type": "humanoid",
    "tier": 4,
    "baseHP": 8500,
    "baseAttack": 0.2
  },
  {
    "id": "scout",
    "name": "Scout",
    "type": "humanoid",
    "tier": 4,
    "baseHP": 8500,
    "baseAttack": 0.2
  },
  {
    "id": "shadow",
    "name": "Shadow",
    "type": "undead",
    "tier": 4,
    "baseHP": 8500,
    "baseAttack": 0.21
  },
  {
    "id": "dust-mephit",
    "name": "Dust Mephit",
    "type": "elemental",
    "tier": 4,
    "baseHP": 8600,
    "baseAttack": 0.19
  },
  {
    "id": "black-bear",
    "name": "Black Bear",
    "type": "beast",
    "tier": 4,
    "baseHP": 8800,
    "baseAttack": 0.2
  },
  {
    "id": "crocodile",
    "name": "Crocodile",
    "type": "beast",
    "tier": 4,
    "baseHP": 8800,
    "baseAttack": 0.2
  },
  {
    "id": "ape",
    "name": "Ape",
    "type": "beast",
    "tier": 4,
    "baseHP": 8800,
    "baseAttack": 0.2
  },
  {
    "id": "giant-goat",
    "name": "Giant Goat",
    "type": "beast",
    "tier": 4,
    "baseHP": 8800,
    "baseAttack": 0.21
  },
  {
    "id": "warhorse",
    "name": "Warhorse",
    "type": "beast",
    "tier": 4,
    "baseHP": 8800,
    "baseAttack": 0.21
  },
  {
    "id": "ice-mephit",
    "name": "Ice Mephit",
    "type": "elemental",
    "tier": 4,
    "baseHP": 9100,
    "baseAttack": 0.19
  },
  {
    "id": "gray-ooze",
    "name": "Gray Ooze",
    "type": "ooze",
    "tier": 4,
    "baseHP": 9200,
    "baseAttack": 0.21
  },
  {
    "id": "magma-mephit",
    "name": "Magma Mephit",
    "type": "elemental",
    "tier": 4,
    "baseHP": 9200,
    "baseAttack": 0.19
  },
  {
    "id": "sahuagin",
    "name": "Sahuagin",
    "type": "humanoid",
    "tier": 4,
    "baseHP": 9200,
    "baseAttack": 0.18
  },
  {
    "id": "swarm-of-beetles",
    "name": "Swarm of Beetles",
    "type": "swarm of Tiny beasts",
    "tier": 4,
    "baseHP": 9200,
    "baseAttack": 0.21
  },
  {
    "id": "swarm-of-centipedes",
    "name": "Swarm of Centipedes",
    "type": "swarm of Tiny beasts",
    "tier": 4,
    "baseHP": 9200,
    "baseAttack": 0.21
  },
  {
    "id": "swarm-of-insects",
    "name": "Swarm of Insects",
    "type": "swarm of Tiny beasts",
    "tier": 4,
    "baseHP": 9200,
    "baseAttack": 0.21
  },
  {
    "id": "swarm-of-spiders",
    "name": "Swarm of Spiders",
    "type": "swarm of Tiny beasts",
    "tier": 4,
    "baseHP": 9200,
    "baseAttack": 0.21
  },
  {
    "id": "swarm-of-wasps",
    "name": "Swarm of Wasps",
    "type": "swarm of Tiny beasts",
    "tier": 4,
    "baseHP": 9200,
    "baseAttack": 0.21
  },
  {
    "id": "gnoll",
    "name": "Gnoll",
    "type": "humanoid",
    "tier": 4,
    "baseHP": 9200,
    "baseAttack": 0.19
  },
  {
    "id": "lizardfolk",
    "name": "Lizardfolk",
    "type": "humanoid",
    "tier": 4,
    "baseHP": 9200,
    "baseAttack": 0.19
  },
  {
    "id": "reef-shark",
    "name": "Reef Shark",
    "type": "beast",
    "tier": 4,
    "baseHP": 9200,
    "baseAttack": 0.2
  },
  {
    "id": "darkmantle",
    "name": "Darkmantle",
    "type": "monstrosity",
    "tier": 4,
    "baseHP": 9200,
    "baseAttack": 0.2
  },
  {
    "id": "warhorse-skeleton",
    "name": "Warhorse Skeleton",
    "type": "undead",
    "tier": 4,
    "baseHP": 9200,
    "baseAttack": 0.21
  },
  {
    "id": "worg",
    "name": "Worg",
    "type": "monstrosity",
    "tier": 4,
    "baseHP": 9500,
    "baseAttack": 0.21
  },
  {
    "id": "cockatrice",
    "name": "Cockatrice",
    "type": "monstrosity",
    "tier": 4,
    "baseHP": 9600,
    "baseAttack": 0.18
  },
  {
    "id": "rust-monster",
    "name": "Rust Monster",
    "type": "monstrosity",
    "tier": 4,
    "baseHP": 9600,
    "baseAttack": 0.19
  },
  {
    "id": "satyr",
    "name": "Satyr",
    "type": "fey",
    "tier": 4,
    "baseHP": 9900,
    "baseAttack": 0.2
  },
  {
    "id": "thug",
    "name": "Thug",
    "type": "humanoid",
    "tier": 4,
    "baseHP": 9900,
    "baseAttack": 0.19
  },
  {
    "id": "quasit",
    "name": "Quasit",
    "type": "fiend",
    "tier": 5,
    "baseHP": 7400,
    "baseAttack": 0.19
  },
  {
    "id": "imp",
    "name": "Imp",
    "type": "fiend",
    "tier": 5,
    "baseHP": 7400,
    "baseAttack": 0.19
  },
  {
    "id": "brass-dragon-wyrmling",
    "name": "Brass Dragon Wyrmling",
    "type": "dragon",
    "tier": 5,
    "baseHP": 7800,
    "baseAttack": 0.2
  },
  {
    "id": "hippogriff",
    "name": "Hippogriff",
    "type": "monstrosity",
    "tier": 5,
    "baseHP": 8200,
    "baseAttack": 0.21
  },
  {
    "id": "dryad",
    "name": "Dryad",
    "type": "fey",
    "tier": 5,
    "baseHP": 8500,
    "baseAttack": 0.16
  },
  {
    "id": "copper-dragon-wyrmling",
    "name": "Copper Dragon Wyrmling",
    "type": "dragon",
    "tier": 5,
    "baseHP": 8500,
    "baseAttack": 0.2
  },
  {
    "id": "ghoul",
    "name": "Ghoul",
    "type": "undead",
    "tier": 5,
    "baseHP": 8500,
    "baseAttack": 0.2
  },
  {
    "id": "giant-vulture",
    "name": "Giant Vulture",
    "type": "beast",
    "tier": 5,
    "baseHP": 8500,
    "baseAttack": 0.2
  },
  {
    "id": "specter",
    "name": "Specter",
    "type": "undead",
    "tier": 5,
    "baseHP": 8500,
    "baseAttack": 0.2
  },
  {
    "id": "duergar",
    "name": "Duergar",
    "type": "humanoid",
    "tier": 5,
    "baseHP": 8800,
    "baseAttack": 0.19
  },
  {
    "id": "giant-eagle",
    "name": "Giant Eagle",
    "type": "beast",
    "tier": 5,
    "baseHP": 8800,
    "baseAttack": 0.21
  },
  {
    "id": "giant-spider",
    "name": "Giant Spider",
    "type": "beast",
    "tier": 5,
    "baseHP": 8800,
    "baseAttack": 0.2
  },
  {
    "id": "lion",
    "name": "Lion",
    "type": "beast",
    "tier": 5,
    "baseHP": 8800,
    "baseAttack": 0.2
  },
  {
    "id": "bugbear",
    "name": "Bugbear",
    "type": "humanoid",
    "tier": 5,
    "baseHP": 8900,
    "baseAttack": 0.21
  },
  {
    "id": "spy",
    "name": "Spy",
    "type": "humanoid",
    "tier": 5,
    "baseHP": 8900,
    "baseAttack": 0.19
  },
  {
    "id": "swarm-of-quippers",
    "name": "Swarm of Quippers",
    "type": "swarm of Tiny beasts",
    "tier": 5,
    "baseHP": 9000,
    "baseAttack": 0.21
  },
  {
    "id": "animated-armor",
    "name": "Animated Armor",
    "type": "construct",
    "tier": 5,
    "baseHP": 9300,
    "baseAttack": 0.19
  },
  {
    "id": "brown-bear",
    "name": "Brown Bear",
    "type": "beast",
    "tier": 5,
    "baseHP": 9400,
    "baseAttack": 0.21
  },
  {
    "id": "dire-wolf",
    "name": "Dire Wolf",
    "type": "beast",
    "tier": 5,
    "baseHP": 9600,
    "baseAttack": 0.21
  },
  {
    "id": "tiger",
    "name": "Tiger",
    "type": "beast",
    "tier": 5,
    "baseHP": 9600,
    "baseAttack": 0.2
  },
  {
    "id": "harpy",
    "name": "Harpy",
    "type": "monstrosity",
    "tier": 5,
    "baseHP": 9600,
    "baseAttack": 0.19
  },
  {
    "id": "death-dog",
    "name": "Death Dog",
    "type": "monstrosity",
    "tier": 5,
    "baseHP": 9700,
    "baseAttack": 0.19
  },
  {
    "id": "giant-toad",
    "name": "Giant Toad",
    "type": "beast",
    "tier": 5,
    "baseHP": 9700,
    "baseAttack": 0.21
  },
  {
    "id": "giant-hyena",
    "name": "Giant Hyena",
    "type": "beast",
    "tier": 5,
    "baseHP": 10000,
    "baseAttack": 0.21
  },
  {
    "id": "giant-octopus",
    "name": "Giant Octopus",
    "type": "beast",
    "tier": 5,
    "baseHP": 10300,
    "baseAttack": 0.21
  },
  {
    "id": "cult-fanatic",
    "name": "Cult Fanatic",
    "type": "humanoid",
    "tier": 8,
    "baseHP": 7400,
    "baseAttack": 0.18
  },
  {
    "id": "will-o-wisp",
    "name": "Will-o'-Wisp",
    "type": "undead",
    "tier": 8,
    "baseHP": 7400,
    "baseAttack": 0.19
  },
  {
    "id": "druid",
    "name": "Druid",
    "type": "humanoid",
    "tier": 8,
    "baseHP": 7800,
    "baseAttack": 0.16
  },
  {
    "id": "priest",
    "name": "Priest",
    "type": "humanoid",
    "tier": 8,
    "baseHP": 7800,
    "baseAttack": 0.16
  },
  {
    "id": "grick",
    "name": "Grick",
    "type": "monstrosity",
    "tier": 8,
    "baseHP": 7800,
    "baseAttack": 0.19
  },
  {
    "id": "white-dragon-wyrmling",
    "name": "White Dragon Wyrmling",
    "type": "dragon",
    "tier": 8,
    "baseHP": 8200,
    "baseAttack": 0.2
  },
  {
    "id": "bronze-dragon-wyrmling",
    "name": "Bronze Dragon Wyrmling",
    "type": "dragon",
    "tier": 8,
    "baseHP": 8200,
    "baseAttack": 0.19
  },
  {
    "id": "black-dragon-wyrmling",
    "name": "Black Dragon Wyrmling",
    "type": "dragon",
    "tier": 8,
    "baseHP": 8200,
    "baseAttack": 0.2
  },
  {
    "id": "rug-of-smothering",
    "name": "Rug of Smothering",
    "type": "construct",
    "tier": 8,
    "baseHP": 8200,
    "baseAttack": 0.16
  },
  {
    "id": "ghast",
    "name": "Ghast",
    "type": "undead",
    "tier": 8,
    "baseHP": 8400,
    "baseAttack": 0.2
  },
  {
    "id": "swarm-of-poisonous-snakes",
    "name": "Swarm of Poisonous Snakes",
    "type": "swarm of Tiny beasts",
    "tier": 8,
    "baseHP": 8400,
    "baseAttack": 0.19
  },
  {
    "id": "green-dragon-wyrmling",
    "name": "Green Dragon Wyrmling",
    "type": "dragon",
    "tier": 8,
    "baseHP": 8500,
    "baseAttack": 0.2
  },
  {
    "id": "ankheg",
    "name": "Ankheg",
    "type": "monstrosity",
    "tier": 8,
    "baseHP": 8600,
    "baseAttack": 0.21
  },
  {
    "id": "azer",
    "name": "Azer",
    "type": "elemental",
    "tier": 8,
    "baseHP": 8600,
    "baseAttack": 0.2
  },
  {
    "id": "giant-boar",
    "name": "Giant Boar",
    "type": "beast",
    "tier": 8,
    "baseHP": 8700,
    "baseAttack": 0.2
  },
  {
    "id": "giant-elk",
    "name": "Giant Elk",
    "type": "beast",
    "tier": 8,
    "baseHP": 8700,
    "baseAttack": 0.22
  },
  {
    "id": "polar-bear",
    "name": "Polar Bear",
    "type": "beast",
    "tier": 8,
    "baseHP": 8700,
    "baseAttack": 0.21
  },
  {
    "id": "ettercap",
    "name": "Ettercap",
    "type": "monstrosity",
    "tier": 8,
    "baseHP": 8800,
    "baseAttack": 0.2
  },
  {
    "id": "ochre-jelly",
    "name": "Ochre Jelly",
    "type": "ooze",
    "tier": 8,
    "baseHP": 8900,
    "baseAttack": 0.2
  },
  {
    "id": "centaur",
    "name": "Centaur",
    "type": "monstrosity",
    "tier": 8,
    "baseHP": 8900,
    "baseAttack": 0.2
  },
  {
    "id": "hunter-shark",
    "name": "Hunter Shark",
    "type": "beast",
    "tier": 8,
    "baseHP": 8900,
    "baseAttack": 0.21
  },
  {
    "id": "merrow",
    "name": "Merrow",
    "type": "monstrosity",
    "tier": 8,
    "baseHP": 8900,
    "baseAttack": 0.2
  },
  {
    "id": "silver-dragon-wyrmling",
    "name": "Silver Dragon Wyrmling",
    "type": "dragon",
    "tier": 8,
    "baseHP": 8900,
    "baseAttack": 0.2
  },
  {
    "id": "rhinoceros",
    "name": "Rhinoceros",
    "type": "beast",
    "tier": 8,
    "baseHP": 8900,
    "baseAttack": 0.21
  },
  {
    "id": "gargoyle",
    "name": "Gargoyle",
    "type": "elemental",
    "tier": 8,
    "baseHP": 9200,
    "baseAttack": 0.18
  },
  {
    "id": "sea-hag",
    "name": "Sea Hag",
    "type": "fey",
    "tier": 8,
    "baseHP": 9200,
    "baseAttack": 0.2
  },
  {
    "id": "saber-toothed-tiger",
    "name": "Saber-Toothed Tiger",
    "type": "beast",
    "tier": 8,
    "baseHP": 9200,
    "baseAttack": 0.2
  },
  {
    "id": "mimic",
    "name": "Mimic",
    "type": "monstrosity",
    "tier": 8,
    "baseHP": 9400,
    "baseAttack": 0.2
  },
  {
    "id": "awakened-tree",
    "name": "Awakened Tree",
    "type": "plant",
    "tier": 8,
    "baseHP": 9500,
    "baseAttack": 0.21
  },
  {
    "id": "griffon",
    "name": "Griffon",
    "type": "monstrosity",
    "tier": 8,
    "baseHP": 9500,
    "baseAttack": 0.2
  },
  {
    "id": "ogre",
    "name": "Ogre",
    "type": "giant",
    "tier": 8,
    "baseHP": 9500,
    "baseAttack": 0.21
  },
  {
    "id": "pegasus",
    "name": "Pegasus",
    "type": "celestial",
    "tier": 8,
    "baseHP": 9500,
    "baseAttack": 0.2
  },
  {
    "id": "giant-constrictor-snake",
    "name": "Giant Constrictor Snake",
    "type": "beast",
    "tier": 8,
    "baseHP": 9500,
    "baseAttack": 0.21
  },
  {
    "id": "bandit-captain",
    "name": "Bandit Captain",
    "type": "humanoid",
    "tier": 8,
    "baseHP": 9700,
    "baseAttack": 0.19
  },
  {
    "id": "gibbering-mouther",
    "name": "Gibbering Mouther",
    "type": "aberration",
    "tier": 8,
    "baseHP": 9700,
    "baseAttack": 0.21
  },
  {
    "id": "berserker",
    "name": "Berserker",
    "type": "humanoid",
    "tier": 8,
    "baseHP": 9700,
    "baseAttack": 0.2
  },
  {
    "id": "minotaur-skeleton",
    "name": "Minotaur Skeleton",
    "type": "undead",
    "tier": 8,
    "baseHP": 9700,
    "baseAttack": 0.21
  },
  {
    "id": "plesiosaurus",
    "name": "Plesiosaurus",
    "type": "beast",
    "tier": 8,
    "baseHP": 9700,
    "baseAttack": 0.21
  },
  {
    "id": "gelatinous-cube",
    "name": "Gelatinous Cube",
    "type": "ooze",
    "tier": 8,
    "baseHP": 10200,
    "baseAttack": 0.2
  },
  {
    "id": "ogre-zombie",
    "name": "Ogre Zombie",
    "type": "undead",
    "tier": 8,
    "baseHP": 10200,
    "baseAttack": 0.21
  },
  {
    "id": "phase-spider",
    "name": "Phase Spider",
    "type": "monstrosity",
    "tier": 11,
    "baseHP": 7700,
    "baseAttack": 0.19
  },
  {
    "id": "wight",
    "name": "Wight",
    "type": "undead",
    "tier": 11,
    "baseHP": 8400,
    "baseAttack": 0.18
  },
  {
    "id": "hell-hound",
    "name": "Hell Hound",
    "type": "fiend",
    "tier": 11,
    "baseHP": 8400,
    "baseAttack": 0.2
  },
  {
    "id": "giant-scorpion",
    "name": "Giant Scorpion",
    "type": "beast",
    "tier": 11,
    "baseHP": 8700,
    "baseAttack": 0.19
  },
  {
    "id": "basilisk",
    "name": "Basilisk",
    "type": "monstrosity",
    "tier": 11,
    "baseHP": 8700,
    "baseAttack": 0.21
  },
  {
    "id": "bearded-devil",
    "name": "Bearded Devil",
    "type": "fiend",
    "tier": 11,
    "baseHP": 8700,
    "baseAttack": 0.19
  },
  {
    "id": "blue-dragon-wyrmling",
    "name": "Blue Dragon Wyrmling",
    "type": "dragon",
    "tier": 11,
    "baseHP": 8700,
    "baseAttack": 0.2
  },
  {
    "id": "knight",
    "name": "Knight",
    "type": "humanoid",
    "tier": 11,
    "baseHP": 8700,
    "baseAttack": 0.19
  },
  {
    "id": "doppelganger",
    "name": "Doppelganger",
    "type": "monstrosity",
    "tier": 11,
    "baseHP": 8700,
    "baseAttack": 0.19
  },
  {
    "id": "mummy",
    "name": "Mummy",
    "type": "undead",
    "tier": 11,
    "baseHP": 9000,
    "baseAttack": 0.21
  },
  {
    "id": "veteran",
    "name": "Veteran",
    "type": "humanoid",
    "tier": 11,
    "baseHP": 9000,
    "baseAttack": 0.19
  },
  {
    "id": "owlbear",
    "name": "Owlbear",
    "type": "monstrosity",
    "tier": 11,
    "baseHP": 9000,
    "baseAttack": 0.21
  },
  {
    "id": "gold-dragon-wyrmling",
    "name": "Gold Dragon Wyrmling",
    "type": "dragon",
    "tier": 11,
    "baseHP": 9000,
    "baseAttack": 0.2
  },
  {
    "id": "manticore",
    "name": "Manticore",
    "type": "monstrosity",
    "tier": 11,
    "baseHP": 9300,
    "baseAttack": 0.19
  },
  {
    "id": "nightmare",
    "name": "Nightmare",
    "type": "fiend",
    "tier": 11,
    "baseHP": 9300,
    "baseAttack": 0.21
  },
  {
    "id": "winter-wolf",
    "name": "Winter Wolf",
    "type": "monstrosity",
    "tier": 11,
    "baseHP": 9500,
    "baseAttack": 0.2
  },
  {
    "id": "minotaur",
    "name": "Minotaur",
    "type": "monstrosity",
    "tier": 11,
    "baseHP": 9500,
    "baseAttack": 0.21
  },
  {
    "id": "green-hag",
    "name": "Green Hag",
    "type": "fey",
    "tier": 11,
    "baseHP": 9700,
    "baseAttack": 0.2
  },
  {
    "id": "killer-whale",
    "name": "Killer Whale",
    "type": "beast",
    "tier": 11,
    "baseHP": 9900,
    "baseAttack": 0.22
  },
  {
    "id": "ghost",
    "name": "Ghost",
    "type": "undead",
    "tier": 14,
    "baseHP": 7800,
    "baseAttack": 0.2
  },
  {
    "id": "red-dragon-wyrmling",
    "name": "Red Dragon Wyrmling",
    "type": "dragon",
    "tier": 14,
    "baseHP": 8800,
    "baseAttack": 0.19
  },
  {
    "id": "elephant",
    "name": "Elephant",
    "type": "beast",
    "tier": 14,
    "baseHP": 8900,
    "baseAttack": 0.21
  },
  {
    "id": "black-pudding",
    "name": "Black Pudding",
    "type": "ooze",
    "tier": 14,
    "baseHP": 9100,
    "baseAttack": 0.21
  },
  {
    "id": "ettin",
    "name": "Ettin",
    "type": "giant",
    "tier": 14,
    "baseHP": 9100,
    "baseAttack": 0.2
  },
  {
    "id": "chuul",
    "name": "Chuul",
    "type": "aberration",
    "tier": 14,
    "baseHP": 9300,
    "baseAttack": 0.19
  },
  {
    "id": "lamia",
    "name": "Lamia",
    "type": "monstrosity",
    "tier": 14,
    "baseHP": 9400,
    "baseAttack": 0.19
  },
  {
    "id": "couatl",
    "name": "Couatl",
    "type": "celestial",
    "tier": 14,
    "baseHP": 9400,
    "baseAttack": 0.19
  },
  {
    "id": "half-red-dragon-veteran",
    "name": "Half-Red Dragon Veteran",
    "type": "humanoid",
    "tier": 17,
    "baseHP": 8100,
    "baseAttack": 0.18
  },
  {
    "id": "wraith",
    "name": "Wraith",
    "type": "undead",
    "tier": 17,
    "baseHP": 8200,
    "baseAttack": 0.21
  },
  {
    "id": "unicorn",
    "name": "Unicorn",
    "type": "celestial",
    "tier": 17,
    "baseHP": 8200,
    "baseAttack": 0.19
  },
  {
    "id": "xorn",
    "name": "Xorn",
    "type": "elemental",
    "tier": 17,
    "baseHP": 8400,
    "baseAttack": 0.19
  },
  {
    "id": "vampire-spawn",
    "name": "Vampire Spawn",
    "type": "undead",
    "tier": 17,
    "baseHP": 8600,
    "baseAttack": 0.19
  },
  {
    "id": "troll",
    "name": "Troll",
    "type": "giant",
    "tier": 17,
    "baseHP": 8700,
    "baseAttack": 0.19
  },
  {
    "id": "giant-crocodile",
    "name": "Giant Crocodile",
    "type": "beast",
    "tier": 17,
    "baseHP": 8700,
    "baseAttack": 0.21
  },
  {
    "id": "salamander",
    "name": "Salamander",
    "type": "elemental",
    "tier": 17,
    "baseHP": 8800,
    "baseAttack": 0.2
  },
  {
    "id": "air-elemental",
    "name": "Air Elemental",
    "type": "elemental",
    "tier": 17,
    "baseHP": 8800,
    "baseAttack": 0.2
  },
  {
    "id": "flesh-golem",
    "name": "Flesh Golem",
    "type": "construct",
    "tier": 17,
    "baseHP": 8900,
    "baseAttack": 0.2
  },
  {
    "id": "roper",
    "name": "Roper",
    "type": "monstrosity",
    "tier": 17,
    "baseHP": 8900,
    "baseAttack": 0.21
  },
  {
    "id": "bulette",
    "name": "Bulette",
    "type": "monstrosity",
    "tier": 17,
    "baseHP": 8900,
    "baseAttack": 0.22
  },
  {
    "id": "triceratops",
    "name": "Triceratops",
    "type": "beast",
    "tier": 17,
    "baseHP": 8900,
    "baseAttack": 0.21
  },
  {
    "id": "fire-elemental",
    "name": "Fire Elemental",
    "type": "elemental",
    "tier": 17,
    "baseHP": 9100,
    "baseAttack": 0.19
  },
  {
    "id": "hill-giant",
    "name": "Hill Giant",
    "type": "giant",
    "tier": 17,
    "baseHP": 9100,
    "baseAttack": 0.21
  },
  {
    "id": "barbed-devil",
    "name": "Barbed Devil",
    "type": "fiend",
    "tier": 17,
    "baseHP": 9200,
    "baseAttack": 0.19
  },
  {
    "id": "gladiator",
    "name": "Gladiator",
    "type": "humanoid",
    "tier": 17,
    "baseHP": 9300,
    "baseAttack": 0.19
  },
  {
    "id": "night-hag",
    "name": "Night Hag",
    "type": "fiend",
    "tier": 17,
    "baseHP": 9300,
    "baseAttack": 0.2
  },
  {
    "id": "otyugh",
    "name": "Otyugh",
    "type": "aberration",
    "tier": 17,
    "baseHP": 9300,
    "baseAttack": 0.19
  },
  {
    "id": "water-elemental",
    "name": "Water Elemental",
    "type": "elemental",
    "tier": 17,
    "baseHP": 9300,
    "baseAttack": 0.2
  },
  {
    "id": "gorgon",
    "name": "Gorgon",
    "type": "monstrosity",
    "tier": 17,
    "baseHP": 9300,
    "baseAttack": 0.2
  },
  {
    "id": "earth-elemental",
    "name": "Earth Elemental",
    "type": "elemental",
    "tier": 17,
    "baseHP": 9500,
    "baseAttack": 0.2
  },
  {
    "id": "giant-shark",
    "name": "Giant Shark",
    "type": "beast",
    "tier": 17,
    "baseHP": 9500,
    "baseAttack": 0.21
  },
  {
    "id": "shambling-mound",
    "name": "Shambling Mound",
    "type": "plant",
    "tier": 17,
    "baseHP": 9700,
    "baseAttack": 0.2
  },
  {
    "id": "mage",
    "name": "Mage",
    "type": "humanoid",
    "tier": 20,
    "baseHP": 7400,
    "baseAttack": 0.17
  },
  {
    "id": "invisible-stalker",
    "name": "Invisible Stalker",
    "type": "elemental",
    "tier": 20,
    "baseHP": 8900,
    "baseAttack": 0.19
  },
  {
    "id": "vrock",
    "name": "Vrock",
    "type": "fiend",
    "tier": 20,
    "baseHP": 8900,
    "baseAttack": 0.2
  },
  {
    "id": "wyvern",
    "name": "Wyvern",
    "type": "dragon",
    "tier": 20,
    "baseHP": 9000,
    "baseAttack": 0.2
  },
  {
    "id": "young-brass-dragon",
    "name": "Young Brass Dragon",
    "type": "dragon",
    "tier": 20,
    "baseHP": 9000,
    "baseAttack": 0.2
  },
  {
    "id": "chimera",
    "name": "Chimera",
    "type": "monstrosity",
    "tier": 20,
    "baseHP": 9100,
    "baseAttack": 0.19
  },
  {
    "id": "drider",
    "name": "Drider",
    "type": "monstrosity",
    "tier": 20,
    "baseHP": 9200,
    "baseAttack": 0.19
  },
  {
    "id": "mammoth",
    "name": "Mammoth",
    "type": "beast",
    "tier": 20,
    "baseHP": 9300,
    "baseAttack": 0.22
  },
  {
    "id": "medusa",
    "name": "Medusa",
    "type": "monstrosity",
    "tier": 20,
    "baseHP": 9300,
    "baseAttack": 0.2
  },
  {
    "id": "young-white-dragon",
    "name": "Young White Dragon",
    "type": "dragon",
    "tier": 20,
    "baseHP": 9400,
    "baseAttack": 0.21
  },
  {
    "id": "oni",
    "name": "Oni",
    "type": "giant",
    "tier": 23,
    "baseHP": 8700,
    "baseAttack": 0.19
  },
  {
    "id": "young-copper-dragon",
    "name": "Young Copper Dragon",
    "type": "dragon",
    "tier": 23,
    "baseHP": 8800,
    "baseAttack": 0.19
  },
  {
    "id": "stone-giant",
    "name": "Stone Giant",
    "type": "giant",
    "tier": 23,
    "baseHP": 8900,
    "baseAttack": 0.21
  },
  {
    "id": "young-black-dragon",
    "name": "Young Black Dragon",
    "type": "dragon",
    "tier": 23,
    "baseHP": 8900,
    "baseAttack": 0.2
  },
  {
    "id": "shield-guardian",
    "name": "Shield Guardian",
    "type": "construct",
    "tier": 23,
    "baseHP": 9200,
    "baseAttack": 0.19
  },
  {
    "id": "giant-ape",
    "name": "Giant Ape",
    "type": "beast",
    "tier": 23,
    "baseHP": 9400,
    "baseAttack": 0.21
  },
  {
    "id": "spirit-naga",
    "name": "Spirit Naga",
    "type": "monstrosity",
    "tier": 26,
    "baseHP": 8100,
    "baseAttack": 0.18
  },
  {
    "id": "assassin",
    "name": "Assassin",
    "type": "humanoid",
    "tier": 26,
    "baseHP": 8100,
    "baseAttack": 0.21
  },
  {
    "id": "cloaker",
    "name": "Cloaker",
    "type": "aberration",
    "tier": 26,
    "baseHP": 8100,
    "baseAttack": 0.18
  },
  {
    "id": "chain-devil",
    "name": "Chain Devil",
    "type": "fiend",
    "tier": 26,
    "baseHP": 8300,
    "baseAttack": 0.19
  },
  {
    "id": "hezrou",
    "name": "Hezrou",
    "type": "fiend",
    "tier": 26,
    "baseHP": 9300,
    "baseAttack": 0.19
  },
  {
    "id": "young-green-dragon",
    "name": "Young Green Dragon",
    "type": "dragon",
    "tier": 26,
    "baseHP": 9300,
    "baseAttack": 0.2
  },
  {
    "id": "tyrannosaurus-rex",
    "name": "Tyrannosaurus Rex",
    "type": "beast",
    "tier": 26,
    "baseHP": 9300,
    "baseAttack": 0.22
  },
  {
    "id": "frost-giant",
    "name": "Frost Giant",
    "type": "giant",
    "tier": 26,
    "baseHP": 9300,
    "baseAttack": 0.21
  },
  {
    "id": "young-bronze-dragon",
    "name": "Young Bronze Dragon",
    "type": "dragon",
    "tier": 26,
    "baseHP": 9400,
    "baseAttack": 0.2
  },
  {
    "id": "hydra",
    "name": "Hydra",
    "type": "monstrosity",
    "tier": 26,
    "baseHP": 9800,
    "baseAttack": 0.19
  },
  {
    "id": "clay-golem",
    "name": "Clay Golem",
    "type": "construct",
    "tier": 29,
    "baseHP": 8700,
    "baseAttack": 0.19
  },
  {
    "id": "treant",
    "name": "Treant",
    "type": "plant",
    "tier": 29,
    "baseHP": 8700,
    "baseAttack": 0.2
  },
  {
    "id": "bone-devil",
    "name": "Bone Devil",
    "type": "fiend",
    "tier": 29,
    "baseHP": 8800,
    "baseAttack": 0.21
  },
  {
    "id": "young-blue-dragon",
    "name": "Young Blue Dragon",
    "type": "dragon",
    "tier": 29,
    "baseHP": 8900,
    "baseAttack": 0.2
  },
  {
    "id": "glabrezu",
    "name": "Glabrezu",
    "type": "fiend",
    "tier": 29,
    "baseHP": 9000,
    "baseAttack": 0.19
  },
  {
    "id": "fire-giant",
    "name": "Fire Giant",
    "type": "giant",
    "tier": 29,
    "baseHP": 9100,
    "baseAttack": 0.21
  },
  {
    "id": "young-silver-dragon",
    "name": "Young Silver Dragon",
    "type": "dragon",
    "tier": 29,
    "baseHP": 9100,
    "baseAttack": 0.19
  },
  {
    "id": "cloud-giant",
    "name": "Cloud Giant",
    "type": "giant",
    "tier": 29,
    "baseHP": 9500,
    "baseAttack": 0.21
  },
  {
    "id": "guardian-naga",
    "name": "Guardian Naga",
    "type": "monstrosity",
    "tier": 32,
    "baseHP": 8600,
    "baseAttack": 0.18
  },
  {
    "id": "aboleth",
    "name": "Aboleth",
    "type": "aberration",
    "tier": 32,
    "baseHP": 8700,
    "baseAttack": 0.2
  },
  {
    "id": "deva",
    "name": "Deva",
    "type": "celestial",
    "tier": 32,
    "baseHP": 8700,
    "baseAttack": 0.21
  },
  {
    "id": "stone-golem",
    "name": "Stone Golem",
    "type": "construct",
    "tier": 32,
    "baseHP": 9300,
    "baseAttack": 0.2
  },
  {
    "id": "young-gold-dragon",
    "name": "Young Gold Dragon",
    "type": "dragon",
    "tier": 32,
    "baseHP": 9300,
    "baseAttack": 0.2
  },
  {
    "id": "young-red-dragon",
    "name": "Young Red Dragon",
    "type": "dragon",
    "tier": 32,
    "baseHP": 9300,
    "baseAttack": 0.2
  },
  {
    "id": "gynosphinx",
    "name": "Gynosphinx",
    "type": "monstrosity",
    "tier": 35,
    "baseHP": 8400,
    "baseAttack": 0.18
  },
  {
    "id": "djinni",
    "name": "Djinni",
    "type": "elemental",
    "tier": 35,
    "baseHP": 8700,
    "baseAttack": 0.18
  },
  {
    "id": "behir",
    "name": "Behir",
    "type": "monstrosity",
    "tier": 35,
    "baseHP": 8800,
    "baseAttack": 0.21
  },
  {
    "id": "horned-devil",
    "name": "Horned Devil",
    "type": "fiend",
    "tier": 35,
    "baseHP": 8900,
    "baseAttack": 0.19
  },
  {
    "id": "remorhaz",
    "name": "Remorhaz",
    "type": "monstrosity",
    "tier": 35,
    "baseHP": 9100,
    "baseAttack": 0.22
  },
  {
    "id": "efreeti",
    "name": "Efreeti",
    "type": "elemental",
    "tier": 35,
    "baseHP": 9200,
    "baseAttack": 0.19
  },
  {
    "id": "roc",
    "name": "Roc",
    "type": "monstrosity",
    "tier": 35,
    "baseHP": 9600,
    "baseAttack": 0.2
  },
  {
    "id": "archmage",
    "name": "Archmage",
    "type": "humanoid",
    "tier": 38,
    "baseHP": 8500,
    "baseAttack": 0.18
  },
  {
    "id": "erinyes",
    "name": "Erinyes",
    "type": "fiend",
    "tier": 38,
    "baseHP": 9400,
    "baseAttack": 0.21
  },
  {
    "id": "rakshasa",
    "name": "Rakshasa",
    "type": "fiend",
    "tier": 41,
    "baseHP": 8000,
    "baseAttack": 0.17
  },
  {
    "id": "adult-brass-dragon",
    "name": "Adult Brass Dragon",
    "type": "dragon",
    "tier": 41,
    "baseHP": 8900,
    "baseAttack": 0.19
  },
  {
    "id": "nalfeshnee",
    "name": "Nalfeshnee",
    "type": "fiend",
    "tier": 41,
    "baseHP": 9100,
    "baseAttack": 0.21
  },
  {
    "id": "adult-white-dragon",
    "name": "Adult White Dragon",
    "type": "dragon",
    "tier": 41,
    "baseHP": 9200,
    "baseAttack": 0.2
  },
  {
    "id": "storm-giant",
    "name": "Storm Giant",
    "type": "giant",
    "tier": 41,
    "baseHP": 9500,
    "baseAttack": 0.21
  },
  {
    "id": "ice-devil",
    "name": "Ice Devil",
    "type": "fiend",
    "tier": 44,
    "baseHP": 8900,
    "baseAttack": 0.2
  },
  {
    "id": "adult-copper-dragon",
    "name": "Adult Copper Dragon",
    "type": "dragon",
    "tier": 44,
    "baseHP": 9000,
    "baseAttack": 0.2
  },
  {
    "id": "adult-black-dragon",
    "name": "Adult Black Dragon",
    "type": "dragon",
    "tier": 44,
    "baseHP": 9100,
    "baseAttack": 0.2
  },
  {
    "id": "mummy-lord",
    "name": "Mummy Lord",
    "type": "undead",
    "tier": 47,
    "baseHP": 7600,
    "baseAttack": 0.21
  },
  {
    "id": "adult-green-dragon",
    "name": "Adult Green Dragon",
    "type": "dragon",
    "tier": 47,
    "baseHP": 9200,
    "baseAttack": 0.2
  },
  {
    "id": "adult-bronze-dragon",
    "name": "Adult Bronze Dragon",
    "type": "dragon",
    "tier": 47,
    "baseHP": 9200,
    "baseAttack": 0.19
  },
  {
    "id": "purple-worm",
    "name": "Purple Worm",
    "type": "monstrosity",
    "tier": 47,
    "baseHP": 9500,
    "baseAttack": 0.2
  },
  {
    "id": "marilith",
    "name": "Marilith",
    "type": "fiend",
    "tier": 50,
    "baseHP": 8700,
    "baseAttack": 0.19
  },
  {
    "id": "planetar",
    "name": "Planetar",
    "type": "celestial",
    "tier": 50,
    "baseHP": 8900,
    "baseAttack": 0.21
  },
  {
    "id": "iron-golem",
    "name": "Iron Golem",
    "type": "construct",
    "tier": 50,
    "baseHP": 9000,
    "baseAttack": 0.2
  },
  {
    "id": "adult-blue-dragon",
    "name": "Adult Blue Dragon",
    "type": "dragon",
    "tier": 50,
    "baseHP": 9100,
    "baseAttack": 0.2
  },
  {
    "id": "adult-silver-dragon",
    "name": "Adult Silver Dragon",
    "type": "dragon",
    "tier": 50,
    "baseHP": 9300,
    "baseAttack": 0.2
  },
  {
    "id": "androsphinx",
    "name": "Androsphinx",
    "type": "monstrosity",
    "tier": 53,
    "baseHP": 8400,
    "baseAttack": 0.19
  },
  {
    "id": "adult-gold-dragon",
    "name": "Adult Gold Dragon",
    "type": "dragon",
    "tier": 53,
    "baseHP": 8900,
    "baseAttack": 0.2
  },
  {
    "id": "adult-red-dragon",
    "name": "Adult Red Dragon",
    "type": "dragon",
    "tier": 53,
    "baseHP": 8900,
    "baseAttack": 0.2
  },
  {
    "id": "dragon-turtle",
    "name": "Dragon Turtle",
    "type": "dragon",
    "tier": 53,
    "baseHP": 9500,
    "baseAttack": 0.2
  },
  {
    "id": "balor",
    "name": "Balor",
    "type": "fiend",
    "tier": 59,
    "baseHP": 9000,
    "baseAttack": 0.2
  },
  {
    "id": "ancient-brass-dragon",
    "name": "Ancient Brass Dragon",
    "type": "dragon",
    "tier": 62,
    "baseHP": 8900,
    "baseAttack": 0.2
  },
  {
    "id": "pit-fiend",
    "name": "Pit Fiend",
    "type": "fiend",
    "tier": 62,
    "baseHP": 8900,
    "baseAttack": 0.2
  },
  {
    "id": "ancient-white-dragon",
    "name": "Ancient White Dragon",
    "type": "dragon",
    "tier": 62,
    "baseHP": 9100,
    "baseAttack": 0.2
  },
  {
    "id": "lich",
    "name": "Lich",
    "type": "undead",
    "tier": 65,
    "baseHP": 7500,
    "baseAttack": 0.18
  },
  {
    "id": "solar",
    "name": "Solar",
    "type": "celestial",
    "tier": 65,
    "baseHP": 8800,
    "baseAttack": 0.22
  },
  {
    "id": "ancient-copper-dragon",
    "name": "Ancient Copper Dragon",
    "type": "dragon",
    "tier": 65,
    "baseHP": 9500,
    "baseAttack": 0.19
  },
  {
    "id": "ancient-black-dragon",
    "name": "Ancient Black Dragon",
    "type": "dragon",
    "tier": 65,
    "baseHP": 9600,
    "baseAttack": 0.2
  },
  {
    "id": "ancient-green-dragon",
    "name": "Ancient Green Dragon",
    "type": "dragon",
    "tier": 68,
    "baseHP": 8800,
    "baseAttack": 0.2
  },
  {
    "id": "ancient-bronze-dragon",
    "name": "Ancient Bronze Dragon",
    "type": "dragon",
    "tier": 68,
    "baseHP": 9100,
    "baseAttack": 0.2
  },
  {
    "id": "kraken",
    "name": "Kraken",
    "type": "monstrosity",
    "tier": 71,
    "baseHP": 9000,
    "baseAttack": 0.19
  },
  {
    "id": "ancient-blue-dragon",
    "name": "Ancient Blue Dragon",
    "type": "dragon",
    "tier": 71,
    "baseHP": 9000,
    "baseAttack": 0.21
  },
  {
    "id": "ancient-silver-dragon",
    "name": "Ancient Silver Dragon",
    "type": "dragon",
    "tier": 71,
    "baseHP": 9000,
    "baseAttack": 0.2
  },
  {
    "id": "ancient-gold-dragon",
    "name": "Ancient Gold Dragon",
    "type": "dragon",
    "tier": 74,
    "baseHP": 9000,
    "baseAttack": 0.19
  },
  {
    "id": "ancient-red-dragon",
    "name": "Ancient Red Dragon",
    "type": "dragon",
    "tier": 74,
    "baseHP": 9000,
    "baseAttack": 0.21
  },
  {
    "id": "tarrasque",
    "name": "Tarrasque",
    "type": "monstrosity",
    "tier": 92,
    "baseHP": 9000,
    "baseAttack": 0.2
  }
]);

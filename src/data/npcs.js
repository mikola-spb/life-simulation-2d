import Appearance from '../entities/Appearance.js';

/**
 * NPC Data
 * Defines all NPCs in the game with their properties and dialog
 */

export const NPC_DATA = {
  // Home location NPCs
  mom: {
    id: 'mom',
    name: 'Mom',
    appearance: new Appearance({
      skinTone: Appearance.OPTIONS.skinTones.medium,
      hairColor: Appearance.OPTIONS.hairColors.brown,
      shirtColor: Appearance.OPTIONS.shirtColors.purple,
      pantsColor: Appearance.OPTIONS.pantsColors.blue
    }),
    location: 'home',
    position: { x: 300, y: 400 },
    behavior: 'idle',
    dialog: [
      "Good morning, dear! Did you sleep well?",
      "Don't forget to eat something before you head out.",
      "I'll be here if you need anything!"
    ]
  },

  // Shop location NPCs
  shopkeeper: {
    id: 'shopkeeper',
    name: 'Shop Keeper',
    appearance: new Appearance({
      skinTone: Appearance.OPTIONS.skinTones.tan,
      hairColor: Appearance.OPTIONS.hairColors.black,
      shirtColor: Appearance.OPTIONS.shirtColors.red,
      pantsColor: Appearance.OPTIONS.pantsColors.black
    }),
    location: 'shop',
    position: { x: 400, y: 300 },
    behavior: 'idle',
    dialog: [
      "Welcome to the convenience store!",
      "We have everything you need for your daily life.",
      "Come back anytime, we're open 24/7!"
    ]
  },

  customer: {
    id: 'customer',
    name: 'Customer',
    appearance: new Appearance({
      skinTone: Appearance.OPTIONS.skinTones.light,
      hairColor: Appearance.OPTIONS.hairColors.blonde,
      shirtColor: Appearance.OPTIONS.shirtColors.yellow,
      pantsColor: Appearance.OPTIONS.pantsColors.blue
    }),
    location: 'shop',
    position: { x: 600, y: 400 },
    behavior: 'wander',
    wanderSpeed: 40,
    wanderChangeInterval: 4000,
    wanderBounds: { x: 500, y: 300, width: 300, height: 300 },
    dialog: [
      "I'm just browsing for some snacks.",
      "This store has such a great selection!"
    ]
  },

  // Park location NPCs
  parkVisitor: {
    id: 'park_visitor',
    name: 'Park Visitor',
    appearance: new Appearance({
      skinTone: Appearance.OPTIONS.skinTones.brown,
      hairColor: Appearance.OPTIONS.hairColors.black,
      shirtColor: Appearance.OPTIONS.shirtColors.green,
      pantsColor: Appearance.OPTIONS.pantsColors.beige
    }),
    location: 'park',
    position: { x: 500, y: 400 },
    behavior: 'wander',
    wanderSpeed: 50,
    wanderChangeInterval: 3500,
    wanderBounds: { x: 400, y: 300, width: 400, height: 400 },
    dialog: [
      "What a beautiful day to be outside!",
      "I love spending time in the park.",
      "The fresh air really helps me relax."
    ]
  },

  jogger: {
    id: 'jogger',
    name: 'Jogger',
    appearance: new Appearance({
      skinTone: Appearance.OPTIONS.skinTones.medium,
      hairColor: Appearance.OPTIONS.hairColors.red,
      shirtColor: Appearance.OPTIONS.shirtColors.white,
      pantsColor: Appearance.OPTIONS.pantsColors.black
    }),
    location: 'park',
    position: { x: 700, y: 500 },
    behavior: 'wander',
    wanderSpeed: 80,
    wanderChangeInterval: 2000,
    wanderBounds: { x: 300, y: 200, width: 600, height: 600 },
    dialog: [
      "Just getting my daily exercise in!",
      "Running helps keep me energized throughout the day."
    ]
  },

  // Street location NPCs
  neighbor: {
    id: 'neighbor',
    name: 'Neighbor',
    appearance: new Appearance({
      skinTone: Appearance.OPTIONS.skinTones.dark,
      hairColor: Appearance.OPTIONS.hairColors.gray,
      shirtColor: Appearance.OPTIONS.shirtColors.blue,
      pantsColor: Appearance.OPTIONS.pantsColors.brown
    }),
    location: 'street',
    position: { x: 400, y: 500 },
    behavior: 'idle',
    dialog: [
      "Hello there, neighbor!",
      "Nice weather we're having today.",
      "Have a great day!"
    ]
  },

  // Workplace location NPCs
  boss: {
    id: 'boss',
    name: 'Boss',
    appearance: new Appearance({
      skinTone: Appearance.OPTIONS.skinTones.light,
      hairColor: Appearance.OPTIONS.hairColors.gray,
      shirtColor: Appearance.OPTIONS.shirtColors.black,
      pantsColor: Appearance.OPTIONS.pantsColors.gray
    }),
    location: 'workplace',
    position: { x: 700, y: 300 },
    behavior: 'idle',
    dialog: [
      "Good to see you here on time!",
      "Keep up the good work.",
      "We have a lot to accomplish today."
    ]
  },

  coworker: {
    id: 'coworker',
    name: 'Coworker',
    appearance: new Appearance({
      skinTone: Appearance.OPTIONS.skinTones.tan,
      hairColor: Appearance.OPTIONS.hairColors.blonde,
      shirtColor: Appearance.OPTIONS.shirtColors.blue,
      pantsColor: Appearance.OPTIONS.pantsColors.black
    }),
    location: 'workplace',
    position: { x: 500, y: 500 },
    behavior: 'wander',
    wanderSpeed: 40,
    wanderChangeInterval: 5000,
    wanderBounds: { x: 400, y: 400, width: 300, height: 250 },
    dialog: [
      "Hey! How's your day going?",
      "This project is really coming together.",
      "Want to grab lunch later?"
    ]
  }
};

/**
 * Get all NPCs for a specific location
 * @param {string} locationId
 * @returns {array} Array of NPC configs for the location
 */
export function getNPCsForLocation(locationId) {
  return Object.values(NPC_DATA).filter(npc => npc.location === locationId);
}

/**
 * Get a specific NPC by ID
 * @param {string} npcId
 * @returns {object|null} NPC config or null if not found
 */
export function getNPC(npcId) {
  return NPC_DATA[npcId] || null;
}

/**
 * Check if an NPC exists
 * @param {string} npcId
 * @returns {boolean}
 */
export function npcExists(npcId) {
  return npcId in NPC_DATA;
}

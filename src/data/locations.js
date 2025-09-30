/**
 * Location Data
 * Defines all game locations with their properties, obstacles, and transitions
 */

export const LOCATIONS = {
  home: {
    id: 'home',
    name: 'Home',
    description: 'Your cozy apartment',
    worldBounds: { width: 800, height: 600 },
    spawnPoint: { x: 400, y: 300 },
    obstacles: [
      // Furniture
      { x: 150, y: 150, width: 80, height: 60, color: 0x8b4513, name: 'Sofa' },
      { x: 650, y: 150, width: 100, height: 80, color: 0x654321, name: 'Bed' },
      { x: 400, y: 500, width: 120, height: 60, color: 0x8b7355, name: 'Table' },
      { x: 150, y: 450, width: 60, height: 60, color: 0x696969, name: 'TV' }
    ],
    transitions: [
      {
        x: 750,
        y: 300,
        width: 50,
        height: 100,
        to: 'street',
        toSpawn: { x: 100, y: 600 },
        label: 'Exit to Street',
        key: 'E'
      }
    ]
  },

  street: {
    id: 'street',
    name: 'Street',
    description: 'A busy city street',
    worldBounds: { width: 1600, height: 1200 },
    spawnPoint: { x: 800, y: 600 },
    obstacles: [
      // Buildings/walls on sides
      { x: 50, y: 300, width: 80, height: 200, color: 0x808080, name: 'Building' },
      { x: 50, y: 700, width: 80, height: 200, color: 0x808080, name: 'Building' },
      { x: 1550, y: 300, width: 80, height: 200, color: 0x808080, name: 'Building' },
      { x: 1550, y: 700, width: 80, height: 200, color: 0x808080, name: 'Building' },
      // Street elements
      { x: 400, y: 400, width: 100, height: 60, color: 0x228b22, name: 'Tree' },
      { x: 1200, y: 800, width: 100, height: 60, color: 0x228b22, name: 'Tree' },
      { x: 800, y: 200, width: 80, height: 40, color: 0xdaa520, name: 'Bench' }
    ],
    transitions: [
      {
        x: 50,
        y: 600,
        width: 50,
        height: 100,
        to: 'home',
        toSpawn: { x: 700, y: 300 },
        label: 'Enter Home',
        key: 'E'
      },
      {
        x: 800,
        y: 50,
        width: 100,
        height: 50,
        to: 'shop',
        toSpawn: { x: 400, y: 500 },
        label: 'Enter Shop',
        key: 'E'
      },
      {
        x: 1550,
        y: 600,
        width: 50,
        height: 100,
        to: 'park',
        toSpawn: { x: 100, y: 600 },
        label: 'Enter Park',
        key: 'E'
      },
      {
        x: 800,
        y: 1150,
        width: 100,
        height: 50,
        to: 'workplace',
        toSpawn: { x: 400, y: 100 },
        label: 'Enter Workplace',
        key: 'E'
      }
    ]
  },

  shop: {
    id: 'shop',
    name: 'Shop',
    description: 'A small convenience store',
    worldBounds: { width: 800, height: 600 },
    spawnPoint: { x: 400, y: 300 },
    obstacles: [
      // Shelves
      { x: 200, y: 150, width: 100, height: 60, color: 0x654321, name: 'Shelf' },
      { x: 400, y: 150, width: 100, height: 60, color: 0x654321, name: 'Shelf' },
      { x: 600, y: 150, width: 100, height: 60, color: 0x654321, name: 'Shelf' },
      { x: 200, y: 350, width: 100, height: 60, color: 0x654321, name: 'Shelf' },
      { x: 400, y: 350, width: 100, height: 60, color: 0x654321, name: 'Shelf' },
      { x: 600, y: 350, width: 100, height: 60, color: 0x654321, name: 'Shelf' },
      // Counter
      { x: 400, y: 500, width: 200, height: 60, color: 0x8b4513, name: 'Counter' }
    ],
    transitions: [
      {
        x: 400,
        y: 550,
        width: 100,
        height: 50,
        to: 'street',
        toSpawn: { x: 800, y: 100 },
        label: 'Exit to Street',
        key: 'E'
      }
    ]
  },

  park: {
    id: 'park',
    name: 'Park',
    description: 'A peaceful green park',
    worldBounds: { width: 1200, height: 900 },
    spawnPoint: { x: 600, y: 450 },
    obstacles: [
      // Trees scattered around
      { x: 200, y: 200, width: 60, height: 60, color: 0x228b22, name: 'Tree' },
      { x: 500, y: 150, width: 60, height: 60, color: 0x228b22, name: 'Tree' },
      { x: 800, y: 200, width: 60, height: 60, color: 0x228b22, name: 'Tree' },
      { x: 1000, y: 400, width: 60, height: 60, color: 0x228b22, name: 'Tree' },
      { x: 200, y: 700, width: 60, height: 60, color: 0x228b22, name: 'Tree' },
      { x: 800, y: 700, width: 60, height: 60, color: 0x228b22, name: 'Tree' },
      // Benches
      { x: 400, y: 450, width: 80, height: 40, color: 0xdaa520, name: 'Bench' },
      { x: 700, y: 450, width: 80, height: 40, color: 0xdaa520, name: 'Bench' },
      // Pond
      { x: 600, y: 650, width: 150, height: 100, color: 0x4682b4, name: 'Pond' }
    ],
    transitions: [
      {
        x: 50,
        y: 450,
        width: 50,
        height: 100,
        to: 'street',
        toSpawn: { x: 1500, y: 600 },
        label: 'Exit to Street',
        key: 'E'
      }
    ]
  },

  workplace: {
    id: 'workplace',
    name: 'Workplace',
    description: 'A modern office building',
    worldBounds: { width: 1000, height: 800 },
    spawnPoint: { x: 500, y: 400 },
    obstacles: [
      // Office desks arranged in grid
      { x: 200, y: 200, width: 100, height: 60, color: 0x696969, name: 'Desk' },
      { x: 400, y: 200, width: 100, height: 60, color: 0x696969, name: 'Desk' },
      { x: 600, y: 200, width: 100, height: 60, color: 0x696969, name: 'Desk' },
      { x: 800, y: 200, width: 100, height: 60, color: 0x696969, name: 'Desk' },
      { x: 200, y: 400, width: 100, height: 60, color: 0x696969, name: 'Desk' },
      { x: 400, y: 400, width: 100, height: 60, color: 0x696969, name: 'Desk' },
      { x: 600, y: 400, width: 100, height: 60, color: 0x696969, name: 'Desk' },
      { x: 800, y: 400, width: 100, height: 60, color: 0x696969, name: 'Desk' },
      // Meeting room
      { x: 500, y: 650, width: 200, height: 100, color: 0x8b4513, name: 'Conference Table' }
    ],
    transitions: [
      {
        x: 500,
        y: 50,
        width: 100,
        height: 50,
        to: 'street',
        toSpawn: { x: 800, y: 1100 },
        label: 'Exit to Street',
        key: 'E'
      }
    ]
  }
};

/**
 * Get location by ID
 * @param {string} locationId
 * @returns {object|null}
 */
export function getLocation(locationId) {
  return LOCATIONS[locationId] || null;
}

/**
 * Get all location IDs
 * @returns {string[]}
 */
export function getAllLocationIds() {
  return Object.keys(LOCATIONS);
}

/**
 * Check if location exists
 * @param {string} locationId
 * @returns {boolean}
 */
export function locationExists(locationId) {
  return LOCATIONS.hasOwnProperty(locationId);
}

export default LOCATIONS;

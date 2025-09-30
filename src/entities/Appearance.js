/**
 * Appearance Class
 * Manages character appearance data and customization options
 */
export default class Appearance {
  /**
   * Default appearance configuration
   */
  static DEFAULTS = {
    skinTone: 0xffdbac,
    hairColor: 0x3d2817,
    shirtColor: 0x4a9eff,
    pantsColor: 0x2c3e50
  };

  /**
   * Available customization options
   */
  static OPTIONS = {
    skinTones: {
      light: 0xffdbac,
      medium: 0xd4a574,
      tan: 0xc68642,
      brown: 0x8d5524,
      dark: 0x5c4033
    },
    hairColors: {
      black: 0x1a1a1a,
      brown: 0x3d2817,
      blonde: 0xffd700,
      red: 0xa0522d,
      gray: 0x808080,
      white: 0xe8e8e8
    },
    shirtColors: {
      blue: 0x4a9eff,
      red: 0xff4a4a,
      green: 0x4aff4a,
      yellow: 0xffff4a,
      purple: 0xff4aff,
      white: 0xffffff,
      black: 0x1a1a1a
    },
    pantsColors: {
      blue: 0x2c3e50,
      black: 0x1a1a1a,
      brown: 0x5d4037,
      gray: 0x808080,
      beige: 0xd2b48c
    }
  };

  constructor(config = {}) {
    this.skinTone = config.skinTone || Appearance.DEFAULTS.skinTone;
    this.hairColor = config.hairColor || Appearance.DEFAULTS.hairColor;
    this.shirtColor = config.shirtColor || Appearance.DEFAULTS.shirtColor;
    this.pantsColor = config.pantsColor || Appearance.DEFAULTS.pantsColor;
  }

  /**
   * Get appearance data for saving
   * @returns {object}
   */
  getSaveData() {
    return {
      skinTone: this.skinTone,
      hairColor: this.hairColor,
      shirtColor: this.shirtColor,
      pantsColor: this.pantsColor
    };
  }

  /**
   * Load appearance data from save
   * @param {object} data
   */
  loadSaveData(data) {
    if (data.skinTone !== undefined) this.skinTone = data.skinTone;
    if (data.hairColor !== undefined) this.hairColor = data.hairColor;
    if (data.shirtColor !== undefined) this.shirtColor = data.shirtColor;
    if (data.pantsColor !== undefined) this.pantsColor = data.pantsColor;
  }

  /**
   * Create a copy of this appearance
   * @returns {Appearance}
   */
  clone() {
    return new Appearance(this.getSaveData());
  }

  /**
   * Randomize appearance
   * @returns {Appearance}
   */
  static randomize() {
    const getRandomValue = (obj) => {
      const values = Object.values(obj);
      return values[Math.floor(Math.random() * values.length)];
    };

    return new Appearance({
      skinTone: getRandomValue(Appearance.OPTIONS.skinTones),
      hairColor: getRandomValue(Appearance.OPTIONS.hairColors),
      shirtColor: getRandomValue(Appearance.OPTIONS.shirtColors),
      pantsColor: getRandomValue(Appearance.OPTIONS.pantsColors)
    });
  }
}

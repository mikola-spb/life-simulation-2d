import GameConfig from '../config.js';

/**
 * TimeSystem - Manages game time progression and day/night cycles
 *
 * Handles:
 * - Time tracking (hours, minutes, day number)
 * - Accelerated time progression (1 real minute = 1 game hour by default)
 * - Day/night cycle detection
 * - Save/load state
 */
export default class TimeSystem {
  /**
   * Create a new time system
   * @param {Phaser.Scene} scene - The game scene
   */
  constructor(scene) {
    this.scene = scene;

    // Current time state
    this.currentDay = GameConfig.time.startingDay;
    this.currentHour = GameConfig.time.startingHour;
    this.currentMinute = GameConfig.time.startingMinute;

    // Cache config values for performance
    this.minutesPerRealSecond = GameConfig.time.minutesPerRealSecond;
    this.hoursPerDay = GameConfig.time.hoursPerDay;
    this.dayStartHour = GameConfig.time.dayStartHour;
    this.nightStartHour = GameConfig.time.nightStartHour;

    // Track accumulated time for minute progression
    this.accumulatedSeconds = 0;
  }

  /**
   * Update time system - progress game time based on real time delta
   * @param {number} time - Current game time
   * @param {number} delta - Time since last update (ms)
   */
  update(time, delta) {
    // Convert delta from milliseconds to seconds
    const deltaSeconds = delta / 1000;

    // Accumulate real-world seconds
    this.accumulatedSeconds += deltaSeconds;

    // Convert accumulated seconds to game minutes
    const gameMinutesElapsed = this.accumulatedSeconds * this.minutesPerRealSecond;

    // If at least one game minute has passed, update time
    if (gameMinutesElapsed >= 1) {
      const minutesToAdd = Math.floor(gameMinutesElapsed);
      this.accumulatedSeconds -= minutesToAdd / this.minutesPerRealSecond;
      this.addMinutes(minutesToAdd);
    }
  }

  /**
   * Add minutes to current time, handling hour and day rollovers
   * @param {number} minutes - Minutes to add
   */
  addMinutes(minutes) {
    this.currentMinute += minutes;

    // Handle minute overflow to hours
    while (this.currentMinute >= 60) {
      this.currentMinute -= 60;
      this.currentHour += 1;
    }

    // Handle hour overflow to days
    while (this.currentHour >= this.hoursPerDay) {
      this.currentHour -= this.hoursPerDay;
      this.currentDay += 1;
    }
  }

  /**
   * Get current time as formatted string (e.g., "08:30")
   * @returns {string}
   */
  getTimeString() {
    const hourStr = String(this.currentHour).padStart(2, '0');
    const minuteStr = String(this.currentMinute).padStart(2, '0');
    return `${hourStr}:${minuteStr}`;
  }

  /**
   * Get current day number
   * @returns {number}
   */
  getDay() {
    return this.currentDay;
  }

  /**
   * Get current hour (0-23)
   * @returns {number}
   */
  getCurrentHour() {
    return this.currentHour;
  }

  /**
   * Get current minute (0-59)
   * @returns {number}
   */
  getCurrentMinute() {
    return this.currentMinute;
  }

  /**
   * Check if it's currently nighttime
   * Night is from nightStartHour to dayStartHour (wrapping around midnight)
   * @returns {boolean}
   */
  isNightTime() {
    // If night starts before day starts (e.g., 18:00 to 6:00)
    if (this.nightStartHour > this.dayStartHour) {
      return this.currentHour >= this.nightStartHour || this.currentHour < this.dayStartHour;
    }
    // If night starts after day starts (shouldn't happen in normal config, but handle it)
    return this.currentHour >= this.nightStartHour && this.currentHour < this.dayStartHour;
  }

  /**
   * Check if it's currently daytime
   * @returns {boolean}
   */
  isDayTime() {
    return !this.isNightTime();
  }

  /**
   * Set time directly (useful for testing or game events)
   * @param {number} day - Day number
   * @param {number} hour - Hour (0-23)
   * @param {number} minute - Minute (0-59)
   */
  setTime(day, hour, minute) {
    this.currentDay = Math.max(1, day);
    this.currentHour = Math.max(0, Math.min(this.hoursPerDay - 1, hour));
    this.currentMinute = Math.max(0, Math.min(59, minute));
    this.accumulatedSeconds = 0;
  }

  /**
   * Get save data
   * @returns {object}
   */
  getSaveData() {
    return {
      day: this.currentDay,
      hour: this.currentHour,
      minute: this.currentMinute
    };
  }

  /**
   * Load save data
   * @param {object} data
   */
  loadSaveData(data) {
    if (data.day !== undefined) {
      this.currentDay = Math.max(1, data.day);
    }
    if (data.hour !== undefined) {
      this.currentHour = Math.max(0, Math.min(this.hoursPerDay - 1, data.hour));
    }
    if (data.minute !== undefined) {
      this.currentMinute = Math.max(0, Math.min(59, data.minute));
    }
    this.accumulatedSeconds = 0;
  }

  /**
   * Reset time to starting values
   */
  reset() {
    this.currentDay = GameConfig.time.startingDay;
    this.currentHour = GameConfig.time.startingHour;
    this.currentMinute = GameConfig.time.startingMinute;
    this.accumulatedSeconds = 0;
  }
}

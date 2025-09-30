import { describe, it, expect } from 'vitest';
import GameConfig from './config.js';

describe('GameConfig', () => {
  it('should export a valid configuration object', () => {
    expect(GameConfig).toBeDefined();
    expect(typeof GameConfig).toBe('object');
  });

  it('should have canvas dimensions', () => {
    expect(GameConfig.width).toBe(800);
    expect(GameConfig.height).toBe(600);
    expect(typeof GameConfig.width).toBe('number');
    expect(typeof GameConfig.height).toBe('number');
  });

  it('should have gravity setting', () => {
    expect(GameConfig.gravity).toBe(0);
    expect(typeof GameConfig.gravity).toBe('number');
  });

  it('should have player settings', () => {
    expect(GameConfig.player).toBeDefined();
    expect(GameConfig.player.speed).toBe(160);
    expect(GameConfig.player.sprintMultiplier).toBe(1.5);
    expect(GameConfig.player.size).toBe(32);
  });

  it('should have storage configuration', () => {
    expect(GameConfig.storage).toBeDefined();
    expect(GameConfig.storage.saveKey).toBe('lifesim_save_v1');
  });

  it('should have version', () => {
    expect(GameConfig.version).toBe('1.0.0');
    expect(typeof GameConfig.version).toBe('string');
  });

  it('should have positive dimensions', () => {
    expect(GameConfig.width).toBeGreaterThan(0);
    expect(GameConfig.height).toBeGreaterThan(0);
  });

  it('should have positive player speed', () => {
    expect(GameConfig.player.speed).toBeGreaterThan(0);
    expect(GameConfig.player.size).toBeGreaterThan(0);
  });
});

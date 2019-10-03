import { InjectionToken } from '@angular/core';
import { Point } from './point';

export interface PraparatConfig {
  initialScale: number;
  initialPan: Point;
  wheelZoomFactor: number;
  maxScale: number;
  minScale: number;
  willChangeDebounceTime: number;
  friction: number;
  stopMomentumScrollThreshold: number;
}

export function createPrapratConfig(config: Partial<PraparatConfig> = {}): PraparatConfig {
  const {
    initialScale = 1,
    initialPan = { x: 0, y: 0 },
    wheelZoomFactor = 0.01,
    maxScale = 100,
    minScale = 0.01,
    willChangeDebounceTime = 300,
    friction = 0.995,
    stopMomentumScrollThreshold = 0.1,
  } = config;

  return {
    initialScale,
    initialPan,
    wheelZoomFactor,
    maxScale,
    minScale,
    willChangeDebounceTime,
    friction,
    stopMomentumScrollThreshold,
  };
}

export function DEFAULT_PRAPARAT_CONFIG_FACTORY() {
  return createPrapratConfig();
}

export const DEFAULT_PRAPARAT_CONFIG = new InjectionToken<PraparatConfig>('DEFAULT_PRAPARAT_CONFIG', {
  providedIn: 'root',
  factory: DEFAULT_PRAPARAT_CONFIG_FACTORY,
});

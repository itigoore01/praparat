import { Point } from './point';

interface VelocitySample {
  timestamp: number;
  point: Point;
}

export interface Velocity {
  velocity: number;
  velocityX: number;
  velocityY: number;
}

export class VelocityTracker {

  private samples: VelocitySample[] = [];

  constructor(private units: number) {
  }

  reset() {
    this.samples = [];
  }

  addTrackingPoint(point: Point) {
    this.samples.push({
      timestamp: performance.now(),
      point,
    });
    this.prune();
  }

  getVelocity(): Velocity {
    this.prune();

    if (this.samples.length < 2) {
      return {
        velocity: 0,
        velocityX: 0,
        velocityY: 0,
      };
    }

    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];

    const time = (last.timestamp - first.timestamp);

    const distanceX = (last.point.x - first.point.x);
    const distanceY = (last.point.y - first.point.y);

    return {
      velocityX: distanceX / time,
      velocityY: distanceY / time,
      velocity: Math.sqrt(Math.pow(distanceX, 2) + Math.pow(distanceY, 2)) / time,
    };
  }

  private prune() {
    const time = performance.now();
    while (this.samples.length > 0 && time - this.samples[0].timestamp > this.units) {
      this.samples.shift();
    }
  }

}

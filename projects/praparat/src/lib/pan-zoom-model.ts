import { BehaviorSubject } from 'rxjs';
import { Point } from './point';
import { VelocityTracker } from './velocity-tracker';

export interface ZoomOptions {
  initialScale: number;
  initialPan: Point;
  wheelZoomFactor: number;
  maxScale: number;
  minScale: number;
  friction: number;
  stopMomentumScrollThreshold: number;
}

export class PanZoomModel {

  initialScale = this.options.initialScale;

  initialPan = this.options.initialPan;

  wheelZoomFactor = this.options.wheelZoomFactor;

  maxScale = this.options.maxScale;

  minScale = this.options.minScale;

  friction = this.options.friction;

  stopMomentumScrollThreshold = this.options.stopMomentumScrollThreshold;

  private velocityTracker = new VelocityTracker(100);

  private _snapshot: {
    pan: Point;
    touches: Point[];
    referencePoint: Point;
    scale: number;
    distance: number;
  } | null = null;

  get scale() {
    return this._scale$.value;
  }
  private _scale$ = new BehaviorSubject(this.initialScale);

  get panPoint() {
    return this._pan$.value;
  }
  private _pan$ = new BehaviorSubject(this.initialPan);

  readonly scaleObservable = this._scale$.asObservable();
  readonly panObservable = this._pan$.asObservable();

  constructor(private options: ZoomOptions) {
  }

  pan(point: Point) {
    // TODO: 制約をかける
    this.setPan(point);
  }

  touchStart(touches: Point[]) {
    const distance = touches.length > 1 ? this.getDistance(touches[0], touches[1]) : 0;

    const referencePoint = this.getMiddlePoint(touches);

    this.velocityTracker.reset();
    this.velocityTracker.addTrackingPoint(referencePoint);

    this._snapshot = {
      pan: this.panPoint,
      scale: this.scale,
      touches,
      referencePoint,
      distance,
    };
  }

  touchMove(touches: Point[]) {
    if (!this._snapshot) {
      return;
    }

    const { pan, referencePoint, scale, distance } = this._snapshot;
    const point = this.getMiddlePoint(touches);

    this.velocityTracker.addTrackingPoint(point);

    if (touches.length > 1) {
      const scaleMultiplier = this.getDistance(touches[0], touches[1]) / distance;
      const newScale = this.constrainScale(scale * scaleMultiplier);
      this.zoom(newScale);

      this.pan({
        x: pan.x + (point.x - referencePoint.x) / this.scale + (referencePoint.x / this.scale - referencePoint.x / scale),
        y: pan.y + (point.y - referencePoint.y) / this.scale + (referencePoint.y / this.scale - referencePoint.y / scale),
      });
      return;
    }

    this.pan({
      x: pan.x + (point.x - referencePoint.x) / this.scale,
      y: pan.y + (point.y - referencePoint.y) / this.scale,
    });
  }

  touchEnd() {
    this._snapshot = null;
  }

  createUpdateMomentam() {
    let lastTick = performance.now();
    let { velocityX, velocityY } = this.velocityTracker.getVelocity();
    let done = false;

    return () => {
      let delta = performance.now() - lastTick;
      lastTick = performance.now();

      let { x, y } = this.panPoint;

      for (; delta > 0 && !done; delta--) {
        if (Math.abs(velocityX) <= this.stopMomentumScrollThreshold && Math.abs(velocityY) <= this.stopMomentumScrollThreshold) {
          done = true;
        }

        velocityX *= this.friction;
        velocityY *= this.friction;

        x += velocityX;
        y += velocityY;
      }

      this.pan({
        x,
        y,
      });

      return done;
    };
  }

  zoom(scale: number, { focal }: { focal?: Point } = {}) {
    const currentScale = this.scale;
    const newScale = this.constrainScale(scale);
    this.setScale(newScale);

    if (focal) {
      const currentPan = this.panPoint;

      const newPan: Point = {
        x: (focal.x / newScale - focal.x / currentScale + currentPan.x * newScale) / newScale,
        y: (focal.y / newScale - focal.y / currentScale + currentPan.y * newScale) / newScale,
      };

      this.setPan(newPan);
    }
  }

  zoomToPoint(scale: number, point: Point) {
    scale = this.constrainScale(scale);

    const focal: Point = {
      x: point.x * scale,
      y: point.y * scale,
    };

    this.zoom(scale, { focal });
  }

  wheelZoom(delta: number, focal: Point) {
    delta = -delta;
    const newScale = this.scale + (this.scale * delta * this.wheelZoomFactor);

    this.zoomToPoint(newScale, focal);
  }

  clone() {
    return new PanZoomModel({
      initialScale: this.initialScale,
      initialPan: this.initialPan,
      maxScale: this.maxScale,
      minScale: this.minScale,
      wheelZoomFactor: this.wheelZoomFactor,
      friction: this.friction,
      stopMomentumScrollThreshold: this.stopMomentumScrollThreshold,
    });
  }

  private setScale(scale: number) {
    if (this.scale !== scale) {
      this._scale$.next(scale);
    }
  }

  private setPan({ x, y }: Point) {
    if (this.panPoint.x !== x || this.panPoint.y !== y) {
      this._pan$.next({
        x,
        y
      });
    }
  }

  private constrainScale(scale: number) {
    return Math.min(Math.max(scale, this.minScale), this.maxScale);
  }

  private getDistance(p1: Point, p2: Point) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }

  private getMiddlePoint(points: Point[]): Point {
    const temp = points.reduce((sum, value) => ({
      x: sum.x + value.x,
      y: sum.y + value.y,
    }), { x: 0, y: 0 });

    return {
      x: temp.x / points.length,
      y: temp.y / points.length,
    };
  }
}

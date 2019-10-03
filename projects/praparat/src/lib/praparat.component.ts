import {
  Component,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  Renderer2,
  NgZone,
  AfterViewInit,
  OnDestroy,
  Inject,
  Input,
} from '@angular/core';
import { PanZoomModel } from './pan-zoom-model';
import { Subject, combineLatest, animationFrameScheduler } from 'rxjs';
import { takeUntil, debounceTime, throttleTime } from 'rxjs/operators';
import { DOCUMENT } from '@angular/common';
import { Point } from './point';
import { DEFAULT_PRAPARAT_CONFIG, PraparatConfig } from './praparat-config';

/**
 * @dynamic
 */
@Component({
  selector: 'praparat',
  exportAs: 'praparat',
  templateUrl: './praparat.component.html',
  styleUrls: ['./praparat.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PraparatComponent implements OnDestroy, AfterViewInit {

  @ViewChild('zoomElement', { static: true })
  zoomElement!: ElementRef<HTMLElement>;

  @Input()
  get initialScale() {
    return this.model.initialScale;
  }
  set initialScale(value) {
    this.model.initialScale = value;
  }

  @Input()
  get initialPan() {
    return this.model.initialPan;
  }
  set initialPan(value) {
    this.model.initialPan = value;
  }

  @Input()
  get wheelZoomFactor() {
    return this.model.wheelZoomFactor;
  }
  set wheelZoomFactor(value) {
    this.model.wheelZoomFactor = value;
  }

  @Input()
  get maxScale() {
    return this.model.maxScale;
  }
  set maxScale(value) {
    this.model.maxScale = value;
  }

  @Input()
  get minScale() {
    return this.model.minScale;
  }
  set minScale(value) {
    this.model.minScale = value;
  }

  private model = new PanZoomModel({
    ...this.defaultConfig,
  });

  private destroyed = new Subject<void>();
  private removeListeners: (() => void)[] = [];

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    private ngZone: NgZone,
    @Inject(DOCUMENT) private document: Document,
    @Inject(DEFAULT_PRAPARAT_CONFIG) private defaultConfig: PraparatConfig,
  ) { }

  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();

    for (const removeListener of this.removeListeners) {
      removeListener();
    }
  }

  ngAfterViewInit() {
    this.model = this.model.clone();

    this.ngZone.runOutsideAngular(() => {
      // マウスホイールでのズーム
      this.removeListeners.push(
        this.renderer.listen(this.elementRef.nativeElement, 'wheel', (event: WheelEvent) => {
          event.preventDefault();
          event.stopPropagation();

          const {
            deltaY,
            clientX,
            clientY,
          } = event;

          this.model.wheelZoom(deltaY, {
            x: clientX,
            y: clientY,
          });
        })
      );

      // タッチでのパン&ズーム
      this.removeListeners.push(
        this.renderer.listen(this.elementRef.nativeElement, 'touchstart', (event: TouchEvent) => {
          event.preventDefault();
          event.stopPropagation();

          const touches: Point[] = this.touchListToPoints(event.touches);

          this.model.touchStart(touches);

          const removeTouchMoveListener = this.renderer.listen(this.document, 'touchmove', (moveEvent: TouchEvent) => {
            this.model.touchMove(this.touchListToPoints(moveEvent.touches));
          });

          const removeTouchEndListener = this.renderer.listen(this.document, 'touchend', () => {
            this.model.touchEnd();

            removeTouchMoveListener();
            removeTouchEndListener();
          });
        })
      );

      this.removeListeners.push(
        this.renderer.listen(this.elementRef.nativeElement, 'mousedown', (downEvent: MouseEvent) => {
          downEvent.preventDefault();
          downEvent.stopPropagation();

          this.model.touchStart([{
            x: downEvent.clientX,
            y: downEvent.clientY,
          }]);

          const removeMouseMoveListener = this.renderer.listen(this.document, 'mousemove', (moveEvent: MouseEvent) => {
            this.model.touchMove([{
              x: moveEvent.clientX,
              y: moveEvent.clientY,
            }]);
          });

          const removeMouseUpListener = this.renderer.listen(this.document, 'mouseup', () => {
            this.model.touchEnd();

            removeMouseMoveListener();
            removeMouseUpListener();
          });
        })
      );

      const panZoomObservable$ = combineLatest([
        this.model.scaleObservable,
        this.model.panObservable,
      ]);

      panZoomObservable$.pipe(
        throttleTime(0, animationFrameScheduler, { leading: true, trailing: true }),
        takeUntil(this.destroyed),
      ).subscribe(([scale, pan]) => {
        this.renderer.setStyle(this.zoomElement.nativeElement, 'transform', `scale(${scale}) translate3d(${pan.x}px, ${pan.y}px, 0px)`);
      });
    });
  }

  zoomToFit(element: HTMLElement) {
    const {
      width: viewportWidth,
      height: viewportHeight,
    } = this.elementRef.nativeElement.getBoundingClientRect();

    let {
      top: targetTop,
      left: targetLeft,
      width: targetWidth,
      height: targetHeight,
    } = element.getBoundingClientRect();

    const currentScale = this.model.scale;
    const currentPan = this.model.panPoint;

    targetTop = targetTop / currentScale - currentPan.y;
    targetLeft = targetLeft / currentScale - currentPan.x;
    targetWidth = targetWidth / currentScale;
    targetHeight = targetHeight / currentScale;

    this.model.zoom(Math.min(viewportWidth / targetWidth, viewportHeight / targetHeight));

    const newScale = this.model.scale;

    this.model.pan({
      x: (viewportWidth - targetWidth * newScale) / newScale / 2 - targetLeft,
      y: (viewportHeight - targetHeight * newScale) / newScale / 2 - targetTop,
    });
  }

  private touchListToPoints(touchList: TouchList): Point[] {
    const touches: Point[] = [];

    for (let index = 0; index < touchList.length; index++) {
      const touch = touchList.item(index)!;
      touches.push({
        x: touch.clientX,
        y: touch.clientY,
      });
    }

    return touches;
  }

}

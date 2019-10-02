import {
  Component,
  OnInit,
  ChangeDetectionStrategy,
  ViewChild,
  ElementRef,
  Renderer2,
  NgZone,
  AfterViewInit,
  OnDestroy,
  Inject
} from '@angular/core';
import { PanZoomModel } from './pan-zoom-model';
import { Subject, combineLatest, animationFrameScheduler } from 'rxjs';
import { takeUntil, debounceTime } from 'rxjs/operators';
import { DOCUMENT } from '@angular/common';
import { Point } from './point';

/**
 * @dynamic
 */
@Component({
  selector: 'praparat',
  templateUrl: './praparat.component.html',
  styleUrls: ['./praparat.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PraparatComponent implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('zoomElement', { static: true })
  zoomElement!: ElementRef<HTMLElement>;

  private model = new PanZoomModel();

  private destroyed = new Subject<void>();
  private removeListeners: (() => void)[] = [];

  constructor(
    private elementRef: ElementRef<HTMLElement>,
    private renderer: Renderer2,
    private ngZone: NgZone,
    @Inject(DOCUMENT) private document: Document,
  ) { }

  ngOnInit() {
  }

  ngOnDestroy() {
    this.destroyed.next();
    this.destroyed.complete();

    for (const removeListener of this.removeListeners) {
      removeListener();
    }
  }

  ngAfterViewInit() {

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

      combineLatest([
        this.model.scaleObservable,
        this.model.panObservable,
      ]).pipe(
        debounceTime(0, animationFrameScheduler),
        takeUntil(this.destroyed),
      ).subscribe(([scale, pan]) => {
        this.renderer.setStyle(this.zoomElement.nativeElement, 'transform', `scale(${scale}) translate(${pan.x}px, ${pan.y}px) `);
      });
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

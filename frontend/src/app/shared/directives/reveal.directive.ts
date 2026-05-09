import type { OnInit, OnDestroy} from '@angular/core';
import { Directive, ElementRef, inject, input } from '@angular/core';

/**
 * IntersectionObserver-based reveal animation — replaces useReveal() from Landing Page.html.
 * Respects prefers-reduced-motion (WCAG 2.2 AAA, SPEC § 13).
 */
@Directive({ selector: '[lbaReveal]', standalone: true })
export class RevealDirective implements OnInit, OnDestroy {
  lbaReveal = input(0);  // optional delay in ms

  private el = inject(ElementRef<HTMLElement>);
  private observer: IntersectionObserver | null = null;

  ngOnInit() {
    const prefersReduced =
      typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced || typeof IntersectionObserver === 'undefined') {
      this.el.nativeElement.classList.add('reveal--visible');
      return;
    }

    this.el.nativeElement.classList.add('reveal');
    this.observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const delay = this.lbaReveal();
          setTimeout(() => this.el.nativeElement.classList.add('reveal--visible'), delay);
          this.observer?.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    this.observer.observe(this.el.nativeElement);
  }

  ngOnDestroy() {
    this.observer?.disconnect();
  }
}

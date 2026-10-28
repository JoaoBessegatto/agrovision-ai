import {
  Component,
  HostListener,
  signal
} from '@angular/core';

import { RouterLink } from '@angular/router';

import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [RouterLink, MatIconModule],
  templateUrl: './landing.html',
  styleUrl: './landing.scss'
})
export class Landing {

  readonly anoAtual =
    new Date().getFullYear();

  /** Barra de navegação ganha fundo depois que a página rola. */
  readonly scrolled =
    signal(false);

  /** Menu suspenso no celular. */
  readonly menuOpen =
    signal(false);


  constructor() {

    this.onScroll();

  }


  @HostListener('window:scroll')
  onScroll(): void {

    if (typeof window === 'undefined') {
      return;
    }

    this.scrolled.set(window.scrollY > 24);

  }


  @HostListener('document:keydown.escape')
  onEscape(): void {

    this.menuOpen.set(false);

  }


  alternarMenu(): void {

    this.menuOpen.update(aberto => !aberto);

  }


  scrollToSection(
    event: Event,
    id: string
  ): void {

    event.preventDefault();

    this.menuOpen.set(false);

    const el = document.getElementById(id);

    if (!el) {
      return;
    }

    const reduzirMovimento =
      window.matchMedia(
        '(prefers-reduced-motion: reduce)'
      ).matches;

    el.scrollIntoView({
      behavior: reduzirMovimento ? 'auto' : 'smooth',
      block: 'start'
    });

  }

}
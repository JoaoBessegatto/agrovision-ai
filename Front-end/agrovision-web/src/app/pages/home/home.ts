import {
  Component,
  inject
} from '@angular/core';

import {
  RouterLink
} from '@angular/router';

import {
  MatIconModule
} from '@angular/material/icon';

import {
  FazendaContextService
} from '../../core/fazenda/services/fazenda-context.service';

@Component({
  selector: 'app-home',

  standalone: true,

  imports: [
    RouterLink,
    MatIconModule
  ],

  templateUrl: './home.html',
  styleUrl: './home.scss'
})
export class Home {

  readonly fazendaContext =
    inject(FazendaContextService);

}
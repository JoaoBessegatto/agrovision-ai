import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [MatButtonModule, MatIconModule],
  templateUrl: './landing.html',
  styleUrl: './landing.scss'
})
export class Landing {

  constructor(private router: Router) {}

  irParaLogin(): void {
    this.router.navigate(['/login']);
  }

  irParaCadastro(): void {
    this.router.navigate(['/cadastro']);
  }

}
import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { AuthService } from '../../core/auth/services/auth.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    RouterLink
  ],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {

  private readonly formBuilder = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  private errorTimeout?: ReturnType<typeof setTimeout>;

  // Em uma aplicação zoneless (sem zone.js), o Angular só sabe
  // que precisa re-renderizar quando um signal muda de valor.
  // Uma propriedade comum (`loading = false`) sendo reatribuída
  // dentro de um callback assíncrono (como o subscribe de uma
  // chamada HTTP) NÃO dispara detecção de mudanças sozinha.
  loading = signal(false);
  errorMessage = signal('');
  showPassword = false;

  loginForm = this.formBuilder.nonNullable.group({
    email: ['', [
      Validators.required,
      Validators.email
    ]],

    password: ['', [
      Validators.required,
      Validators.minLength(6)
    ]]
  });

  onSubmit(): void {

    this.clearError();

    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const credentials = this.loginForm.getRawValue();

    this.authService.login(credentials)
      .pipe(
        // Garante que o loading SEMPRE termina, independente
        // do resultado do observable (sucesso, erro ou até
        // algo tratado silenciosamente em um interceptor).
        finalize(() => {
          this.loading.set(false);
        })
      )
      .subscribe({

        next: () => {
          this.router.navigate(['/dashboard']);
        },

        error: (error) => {

          if (error.status === 401 || error.status === 400) {
            this.showErrorMessage('E-mail ou senha incorretos. Verifique e tente novamente.');
          } else if (error.status === 0) {
            this.showErrorMessage('Não foi possível conectar ao servidor. Verifique sua conexão.');
          } else {
            this.showErrorMessage('Não foi possível realizar o login. Tente novamente.');
          }

          console.error('Erro ao realizar login:', error);
        }

      });
  }

  private showErrorMessage(message: string): void {
    this.errorMessage.set(message);

    // Reinicia o timer se já houver um alerta visível
    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
    }

    this.errorTimeout = setTimeout(() => {
      this.errorMessage.set('');
    }, 6000);
  }

  clearError(): void {
    this.errorMessage.set('');

    if (this.errorTimeout) {
      clearTimeout(this.errorTimeout);
      this.errorTimeout = undefined;
    }
  }
}
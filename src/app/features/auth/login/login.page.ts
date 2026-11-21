import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonButton,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonSpinner
} from '@ionic/angular';

import { EMAIL_REGEX, LIMITS, NO_SPACES_REGEX } from '@core/constants/app.constants';
import { AuthService } from '@core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonContent,
    IonItem,
    IonInput,
    IonButton,
    IonIcon,
    IonSpinner
  ],
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss']
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly limits = LIMITS;

  readonly form = this.fb.nonNullable.group({
    email: [
      '',
      [Validators.required, Validators.pattern(EMAIL_REGEX), Validators.maxLength(LIMITS.emailMax)]
    ],
    password: [
      '',
      [
        Validators.required,
        Validators.pattern(NO_SPACES_REGEX),
        Validators.maxLength(LIMITS.passwordMax)
      ]
    ]
  });

  readonly loading = signal(false);
  readonly error = signal('');
  readonly showPassword = signal(false);

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    const { email, password } = this.form.getRawValue();
    const result = await this.auth.login(email, password);
    this.loading.set(false);
    if (!result.ok) {
      this.error.set(result.error ?? 'No se pudo iniciar sesión.');
      return;
    }
    await this.router.navigateByUrl('/tabs/explore', { replaceUrl: true });
  }

  goToRegister(): void {
    void this.router.navigateByUrl('/register');
  }
}

import { Component, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonBackButton,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonInput,
  IonItem,
  IonSpinner,
  IonTitle,
  IonToolbar
} from '@ionic/angular';

import { EMAIL_REGEX, LIMITS, NO_SPACES_REGEX } from '@core/constants/app.constants';
import type { UserRole } from '@core/models/user.model';
import { AuthService } from '@core/services/auth.service';

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirm')?.value;
  return password === confirm ? null : { passwordsMismatch: true };
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonBackButton,
    IonTitle,
    IonContent,
    IonItem,
    IonInput,
    IonButton,
    IonIcon,
    IonSpinner
  ],
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss']
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly limits = LIMITS;

  readonly form = this.fb.nonNullable.group(
    {
      name: [
        '',
        [
          Validators.required,
          Validators.pattern(NO_SPACES_REGEX),
          Validators.minLength(LIMITS.nameMin),
          Validators.maxLength(LIMITS.nameMax)
        ]
      ],
      email: [
        '',
        [Validators.required, Validators.pattern(EMAIL_REGEX), Validators.maxLength(LIMITS.emailMax)]
      ],
      password: [
        '',
        [
          Validators.required,
          Validators.pattern(NO_SPACES_REGEX),
          Validators.minLength(LIMITS.passwordMin),
          Validators.maxLength(LIMITS.passwordMax)
        ]
      ],
      confirm: ['', [Validators.required]],
      role: this.fb.nonNullable.control<UserRole>('user', Validators.required)
    },
    { validators: passwordsMatchValidator }
  );

  readonly loading = signal(false);
  readonly error = signal('');
  readonly showPassword = signal(false);

  selectRole(role: UserRole): void {
    this.form.controls.role.setValue(role);
  }

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.loading.set(true);
    this.error.set('');
    const { name, email, password, role } = this.form.getRawValue();
    const result = await this.auth.register({ name, email, password, role });
    this.loading.set(false);
    if (!result.ok) {
      this.error.set(result.error ?? 'No se pudo crear la cuenta.');
      return;
    }
    await this.router.navigateByUrl('/tabs/explore', { replaceUrl: true });
  }

  goToLogin(): void {
    void this.router.navigateByUrl('/login');
  }
}

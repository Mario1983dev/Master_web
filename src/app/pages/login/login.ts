import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthMaster } from '../../services/auth-master';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.scss']
})
export class Login {
  identifier = '';
  password = '';

  showPass = false;
  loading = false;
  errorMsg = '';

  constructor(
    private auth: AuthMaster,
    private router: Router
  ) {}

  onSubmit() {
    if (this.loading) return;

    if (!this.identifier.trim() || !this.password.trim()) {
      this.errorMsg = 'Ingresa usuario o correo y contraseña.';
      return;
    }

    this.loading = true;
    this.errorMsg = '';

    this.auth.login(this.identifier.trim(), this.password.trim()).subscribe({
      next: (res: any) => {
        console.log('RESP LOGIN:', res);

        this.auth.setToken(res.token);
        this.auth.setUser(res.user);
        this.auth.clearSelectedCompany();

        const scope = String(res?.user?.scope || '').trim().toLowerCase();
        const role = String(res?.user?.role || '').trim().toUpperCase();

        if (scope === 'master' || role === 'MASTER') {
          this.loading = false;
          this.router.navigate(['/master']);
          return;
        }

        if (
          scope === 'office_admin' ||
          scope === 'office_user' ||
          scope === 'office' ||
          role === 'OFFICE_ADMIN' ||
          role === 'OFFICE_USER'
        ) {
          this.loading = false;
          this.router.navigate(['/office']);
          return;
        }

        this.errorMsg = `Rol no reconocido. scope="${scope}" role="${role}"`;
        this.loading = false;
      },

      error: (err) => {
        console.error('ERR LOGIN:', err);

        if (err?.status === 401) {
          this.errorMsg = 'Usuario o contraseña incorrectos.';
        } else if (err?.status === 403) {
          this.errorMsg = err?.error?.message || 'Usuario sin acceso.';
        } else if (err?.status === 0) {
          this.errorMsg = 'No se pudo conectar con el servidor.';
        } else {
          this.errorMsg =
            err?.error?.message ||
            'Error de login. Revisa tus credenciales.';
        }

        this.loading = false;
      }
    });
  }
}
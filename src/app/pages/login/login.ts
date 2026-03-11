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

  email = '';
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

    this.loading = true;
    this.errorMsg = '';

    this.auth.login(this.email, this.password).subscribe({

      next: (res: any) => {

        localStorage.setItem('token', res.token);
        localStorage.setItem('user', JSON.stringify(res.user));

        console.log('RESP:', res);

        const scope = String(res?.user?.scope || '').trim();
        const role = String(res?.user?.role || '').trim();

        if (scope === 'master' || role === 'MASTER') {
          this.router.navigate(['/master']);
        } else if (scope === 'office_admin' || role === 'OFFICE_ADMIN') {
          this.router.navigate(['/office']);
        } else {
          this.errorMsg = 'Rol de usuario no reconocido';
        }

        this.loading = false;

      },

      error: (err) => {

        console.error('ERR:', err);

        this.errorMsg =
          err?.error?.message ??
          'Error de login. Revisa tus credenciales.';

        this.loading = false;

      }

    });

  }

}
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

        console.log('RESP:', res);

        this.router.navigate(['/master']);

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
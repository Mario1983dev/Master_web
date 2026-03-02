import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthMaster } from '../../services/auth-master';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {
  email = '';
  password = '';

  constructor(private auth: AuthMaster) {}

  onSubmit() {
    this.auth.login(this.email, this.password).subscribe({
      next: (res: any) => {
        localStorage.setItem('token', res.token);
        alert('Login correcto ✅');
        console.log('RESP:', res);
      },
      error: (err) => {
        console.error('ERR:', err);
        alert(err?.error?.message ?? 'Error de login');
      }
    });
  }
}
import { Component } from '@angular/core';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-master',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './master.html',
  styleUrl: './master.scss'
})
export class Master {

  year = new Date().getFullYear();

  constructor(private router: Router) {}

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

}

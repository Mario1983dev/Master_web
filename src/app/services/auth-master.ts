import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthMaster {

  private apiUrl = environment.apiUrl; // http://localhost:3000

  constructor(private http: HttpClient) {}

  login(email: string, password: string) {

    return this.http.post<{ token: string; user: any }>(
      `${this.apiUrl}/api/login`,
      {
        email: email,
        username: email,
        password: password
      }
    );

  }

  setToken(token: string) {
    localStorage.setItem('token', token);
  }

  getToken() {
    return localStorage.getItem('token');
  }

  logout() {
    localStorage.removeItem('token');
  }

}
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthMaster {
  private apiUrl = environment.apiUrl; // http://localhost:3000

  constructor(private http: HttpClient) {}

  login(identifier: string, password: string) {
    const value = identifier.trim();

    const body = value.includes('@')
      ? { email: value, password }
      : { username: value, password };

    return this.http.post<{ token: string; user: any }>(
      `${this.apiUrl}/api/login`,
      body
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
    localStorage.removeItem('user');
  }
}
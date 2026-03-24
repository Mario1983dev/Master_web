import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthMaster {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  login(identifier: string, password: string) {
    return this.http.post<{ token: string; user: any }>(
      `${this.apiUrl}/api/login`,
      {
        usernameOrEmail: identifier.trim(),
        password
      }
    );
  }

  setToken(token: string) {
    localStorage.setItem('token', token);
  }

  getToken() {
    return localStorage.getItem('token');
  }

  setUser(user: any) {
    localStorage.setItem('user', JSON.stringify(user));
  }

  getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  getOfficeId(): number | null {
    const user = this.getUser();
    return user?.office_id ?? null;
  }

  isMaster(): boolean {
    const user = this.getUser();
    const scope = String(user?.scope || '').trim().toLowerCase();
    const role = String(user?.role || '').trim().toUpperCase();

    return scope === 'master' || role === 'MASTER';
  }

  isOfficeAdmin(): boolean {
    const user = this.getUser();
    const scope = String(user?.scope || '').trim().toLowerCase();
    const role = String(user?.role || '').trim().toUpperCase();

    return scope === 'office_admin' || role === 'OFFICE_ADMIN';
  }

  isOfficeUser(): boolean {
    const user = this.getUser();
    const scope = String(user?.scope || '').trim().toLowerCase();
    const role = String(user?.role || '').trim().toUpperCase();

    return scope === 'office_user' || role === 'OFFICE_USER';
  }

  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}
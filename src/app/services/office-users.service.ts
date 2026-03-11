import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OfficeUser {
  id: number;
  office_id: number;
  name: string;
  email: string;
  role: 'admin' | 'user';
  status: number;
  created_at?: string;
  updated_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class OfficeUsersService {
  private http = inject(HttpClient);
  private baseUrl = 'http://localhost:3000/office-users';

  getByOffice(officeId: number): Observable<OfficeUser[]> {
    return this.http.get<OfficeUser[]>(`${this.baseUrl}/office/${officeId}`);
  }

  create(data: any): Observable<any> {
    return this.http.post(this.baseUrl, data);
  }

  update(id: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, data);
  }

  changeStatus(id: number, status: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}/status`, { status });
  }
}
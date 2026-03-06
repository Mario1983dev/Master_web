import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class OfficesService {
  constructor(private http: HttpClient) {}

  list() {
    return this.http.get<any[]>(`${environment.apiUrl}/offices`);
  }

  getById(id: number) {
    return this.http.get<any>(`${environment.apiUrl}/offices/${id}`);
  }

  create(data: any) {
    return this.http.post(`${environment.apiUrl}/offices`, data);
  }

  update(id: number, data: any) {
    return this.http.put(`${environment.apiUrl}/offices/${id}`, data);
  }

  delete(id: number) {
    return this.http.delete(`${environment.apiUrl}/offices/${id}`);
  }
}
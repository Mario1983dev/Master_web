import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OfficesService {

  private baseUrl = `${environment.apiUrl}/api/master/offices`;

  constructor(private http: HttpClient) {}

  private getHeaders() {
    const token = localStorage.getItem('token') || '';

    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${token}`
      })
    };
  }

  list() {
    return this.http.get<any[]>(this.baseUrl, this.getHeaders());
  }

  getById(id: number) {
    return this.http.get<any>(`${this.baseUrl}/${id}`, this.getHeaders());
  }

  create(data: any) {
    return this.http.post(this.baseUrl, data, this.getHeaders());
  }

  update(id: number, data: any) {
    return this.http.put(`${this.baseUrl}/${id}`, data, this.getHeaders());
  }

  delete(id: number) {
    return this.http.delete(`${this.baseUrl}/${id}`, this.getHeaders());
  }

  changeStatus(id: number, status: number) {
    return this.http.put(
      `${this.baseUrl}/${id}/status`,
      { status },
      this.getHeaders()
    );
  }

}
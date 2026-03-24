import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CompaniesService {
  private http = inject(HttpClient);

  private apiUrl = `${environment.apiUrl}/companies`;

  getCompanies(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getCompanyById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createCompany(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  updateCompany(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  deleteCompany(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
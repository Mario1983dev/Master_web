import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CompaniesService {
  private http = inject(HttpClient);

  private apiUrl = 'http://localhost:3000/companies';

  getCompanies(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  createCompany(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }

  getCompanyById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  updateCompany(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  deleteCompany(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }
}
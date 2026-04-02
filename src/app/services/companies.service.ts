import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CompaniesService {
  private apiUrl = `${environment.apiUrl}/companies`;
  private companiesCache: any[] | null = null;

  constructor(private http: HttpClient) {}

  getCompanies(forceReload: boolean = false): Observable<any[]> {
    if (!forceReload && this.companiesCache) {
      console.log('COMPANIES CACHE OK');
      return of(this.companiesCache);
    }

    console.log('COMPANIES API CALL');

    return this.http.get<any[]>(this.apiUrl).pipe(
      tap((companies) => {
        this.companiesCache = companies || [];
      })
    );
  }

  getCompanyById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createCompany(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data).pipe(
      tap(() => this.clearCompaniesCache())
    );
  }

  updateCompany(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data).pipe(
      tap(() => this.clearCompaniesCache())
    );
  }

  deleteCompany(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.clearCompaniesCache())
    );
  }

  clearCompaniesCache(): void {
    this.companiesCache = null;
  }
}
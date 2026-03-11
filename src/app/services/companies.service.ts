import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Company {
  id?: number;
  office_id: number;
  rut: string;
  name: string;
  legal_name?: string;
  business_type?: string;
  email?: string;
  phone?: string;
  address?: string;
  commune?: string;
  city?: string;
  region_name?: string;
  status?: string;
  notes?: string;
  year_num?: number;
  created_at?: string;
  updated_at?: string;
  office_name?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CompaniesService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/companies';

  getAll(): Observable<Company[]> {
    return this.http.get<Company[]>(this.apiUrl);
  }

  getById(id: number): Observable<Company> {
    return this.http.get<Company>(`${this.apiUrl}/${id}`);
  }

  create(company: Company): Observable<any> {
    return this.http.post(this.apiUrl, company);
  }

  update(id: number, company: Company): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, company);
  }
}
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LibrosCvService {

  private apiUrl = `${environment.apiUrl}/libros-cv`;

  constructor(private http: HttpClient) {}

  getRecords(companyId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.apiUrl}?company_id=${companyId}`
    );
  }

  getDetail(id: number): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/${id}`
    );
  }

}
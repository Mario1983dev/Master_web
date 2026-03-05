import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment'; // ajusta ruta si corresponde

@Injectable({ providedIn: 'root' })
export class OfficesService {
  constructor(private http: HttpClient) {}

  list() {
    return this.http.get<any[]>(`${environment.apiUrl}/offices`);
  }
}
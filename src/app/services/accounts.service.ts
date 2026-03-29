import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Account {
  id: number;
  company_id: number;
  code: string;
  name: string;
  account_type: string;
  balance_nature: string;
  parent_code: string | null;
  level_num: number;
  allows_entries: number;
  is_active: number;
  sort_order: number;
  notes: string;
}

@Injectable({
  providedIn: 'root'
})
export class AccountsService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/accounts`;

getAccounts(companyId: number): Observable<Account[]> {
  return this.http.get<Account[]>(
    `${this.apiUrl}?company_id=${companyId}&_=${Date.now()}`
  );
}

  createAccount(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl, data);
  }
}
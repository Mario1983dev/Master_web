import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

export interface AccountMapping {
  id: number;
  company_id: number;
  mapping_key: string;
  account_id: number;
  notes: string;
  created_at?: string;
  updated_at?: string;
  code?: string;
  name?: string;
}

export interface CreateAccountMappingPayload {
  company_id: number;
  mapping_key: string;
  account_id: number;
  notes?: string;
}

export interface UpdateAccountMappingPayload {
  account_id: number;
  notes?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {
  private apiUrl = `${environment.apiUrl}/configuration`;

  constructor(private http: HttpClient) {}

 getAccountMappings(companyId: number): Observable<AccountMapping[]> {
  return this.http.get<AccountMapping[]>(
    `${this.apiUrl}/account-mappings?company_id=${companyId}&_=${Date.now()}`
  );
}

  createAccountMapping(payload: CreateAccountMappingPayload): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/account-mappings`,
      payload
    );
  }

  updateAccountMapping(id: number, payload: UpdateAccountMappingPayload): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/account-mappings/${id}`,
      payload
    );
  }
}
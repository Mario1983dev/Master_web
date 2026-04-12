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

export interface AccountingPeriod {
  id?: number;
  company_id: number;
  year_num: number;
  status: 'OPEN' | 'CLOSED';
  is_current?: number;
  start_date?: string;
  end_date?: string;
  created_at?: string;
  updated_at?: string;
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

  updateAccountMapping(
    id: number,
    payload: UpdateAccountMappingPayload
  ): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/account-mappings/${id}`,
      payload
    );
  }

  getAccountingPeriod(companyId: number): Observable<AccountingPeriod | null> {
    return this.http.get<AccountingPeriod | null>(
      `${this.apiUrl}/accounting-period?company_id=${companyId}&_=${Date.now()}`
    );
  }

  createAccountingPeriod(payload: AccountingPeriod): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/accounting-period`,
      payload
    );
  }

  updateAccountingPeriod(
    id: number,
    payload: Partial<AccountingPeriod>
  ): Observable<any> {
    return this.http.put<any>(
      `${this.apiUrl}/accounting-period/${id}`,
      payload
    );
  }
}
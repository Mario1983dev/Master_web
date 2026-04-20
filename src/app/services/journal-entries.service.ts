import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface EntryType {
  id: number;
  code: string;
  name: string;
  description?: string;
  affects_balance?: number;
  is_system?: number;
  created_at?: string;
}

export interface JournalEntryLinePayload {
  account_id: number | null;
  description: string;
  debit: number;
  credit: number;
}

export interface JournalEntryPayload {
  company_id: number;
  entry_date: string;
  entry_type: string;
  description: string;
  lines: JournalEntryLinePayload[];
  copy_until_december?: boolean;
}

export interface JournalEntryItem {
  id: number;
  entry_date: string;
  entry_type: string;
  description: string;
  company_id?: number;
  status?: number;
  created_at?: string;
  total_debit?: number;
  total_credit?: number;
}

export interface JournalEntryLineDetail {
  id?: number;
  entry_id?: number;
  account_id: number;
  account_code?: string;
  account_name?: string;
  description: string;
  debit: number;
  credit: number;
}

export interface JournalReportRow {
  id: number;
  company_id: number;
  entry_date: string;
  entry_type: string;
  description: string;
  status: number;
  line_id: number;
  account_id: number;
  account_code: string;
  account_name: string;
  line_description: string;
  debit: number;
  credit: number;
}

export interface JournalEntryDetail extends JournalEntryItem {
  lines: JournalEntryLineDetail[];
}

export interface CashBalanceResponse {
  saldo: number;
  total_debe?: number;
  total_haber?: number;
  account_id: number | null;
  account_code: string;
  account_name?: string;
}

@Injectable({
  providedIn: 'root'
})
export class JournalEntriesService {
  private readonly apiUrl = `${environment.apiUrl}/journal-entries`;

  constructor(private http: HttpClient) {}

  private buildNoCacheParams(baseParams?: Record<string, string | number | boolean>): HttpParams {
    let params = new HttpParams();

    if (baseParams) {
      Object.keys(baseParams).forEach((key) => {
        const value = baseParams[key];
        if (value !== null && value !== undefined && value !== '') {
          params = params.set(key, String(value));
        }
      });
    }

    return params.set('_', Date.now().toString());
  }

  getEntryTypes(): Observable<EntryType[]> {
    return this.http.get<EntryType[]>(`${this.apiUrl}/types`);
  }

  getEntries(companyId: number): Observable<JournalEntryItem[]> {
    const params = this.buildNoCacheParams({
      company_id: companyId
    });

    return this.http.get<JournalEntryItem[]>(this.apiUrl, { params });
  }

  getEntryById(id: number): Observable<JournalEntryDetail> {
    return this.http.get<JournalEntryDetail>(`${this.apiUrl}/${id}`);
  }

  createEntry(payload: JournalEntryPayload): Observable<any> {
    return this.http.post<any>(this.apiUrl, payload);
  }

  updateEntry(id: number, payload: JournalEntryPayload): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, payload);
  }

  voidEntry(id: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/void`, {});
  }

  getCashBalance(companyId: number): Observable<CashBalanceResponse> {
    const params = this.buildNoCacheParams({
      company_id: companyId
    });

    return this.http.get<CashBalanceResponse>(`${this.apiUrl}/cash-balance`, {
      params
    });
  }

  getJournalReport(
    companyId: number,
    fromDate: string,
    toDate: string
  ): Observable<JournalReportRow[]> {
    const params = this.buildNoCacheParams({
      company_id: companyId,
      from_date: fromDate,
      to_date: toDate
    });

    return this.http.get<JournalReportRow[]>(`${this.apiUrl}/report`, {
      params
    });
  }
}
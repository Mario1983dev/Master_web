import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

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

export interface EntryType {
  id: number;
  code: string;
  name: string;
  description?: string;
  affects_balance?: number;
  is_system?: number;
  created_at?: string;
}

export interface JournalReportRow {
  id: number;
  company_id: number;
  entry_date: string;
  entry_type: string;
  description: string;
  status: number;
  line_id: number;
  line_description: string;
  debit: number;
  credit: number;
  account_code: string;
  account_name: string;
}

@Injectable({
  providedIn: 'root'
})
export class JournalEntriesService {
  private apiUrl = `${environment.apiUrl}/journal-entries`;
  private entryTypesUrl = `${environment.apiUrl}/entry-types`;

  constructor(private http: HttpClient) {}

  createJournalEntry(payload: JournalEntryPayload): Observable<any> {
    return this.http.post<any>(this.apiUrl, payload);
  }

  getJournalEntries(companyId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?company_id=${companyId}`);
  }

  getJournalReport(companyId: number, dateFrom: string, dateTo: string): Observable<JournalReportRow[]> {
    const url = `${this.apiUrl}/report?company_id=${companyId}&date_from=${dateFrom}&date_to=${dateTo}`;
    return this.http.get<JournalReportRow[]>(url);
  }

  getEntryTypes(): Observable<EntryType[]> {
    return this.http.get<EntryType[]>(this.entryTypesUrl);
  }
}
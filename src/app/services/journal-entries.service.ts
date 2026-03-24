import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface JournalEntryLinePayload {
  account_id: number | null;
  description?: string;
  debit: number;
  credit: number;
}

export interface JournalEntryPayload {
  company_id: number;
  entry_date: string;
  entry_type: string;
  description?: string;
  lines: JournalEntryLinePayload[];
}

@Injectable({
  providedIn: 'root'
})
export class JournalEntriesService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/journal-entries';

  create(payload: JournalEntryPayload): Observable<any> {
    return this.http.post(this.apiUrl, payload);
  }

  getByCompany(companyId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?company_id=${companyId}`);
  }
}
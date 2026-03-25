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
  company_id: number | null;
  entry_date: string;
  entry_type: string;
  description: string;
  lines: JournalEntryLinePayload[];
}

@Injectable({ providedIn: 'root' })
export class JournalEntriesService {
  private apiUrl = `${environment.apiUrl}/journal-entries`;

  constructor(private http: HttpClient) {}

  create(payload: JournalEntryPayload): Observable<any> {
    return this.http.post<any>(this.apiUrl, payload);
  }
}
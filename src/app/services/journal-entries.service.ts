import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
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
}

@Injectable({
  providedIn: 'root'
})
export class JournalEntriesService {
  private apiUrl = `${environment.apiUrl}/journal-entries`;

  constructor(private http: HttpClient) {}

  createJournalEntry(payload: JournalEntryPayload): Observable<any> {
    return this.http.post<any>(this.apiUrl, payload);
  }

  getJournalEntries(companyId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}?company_id=${companyId}`);
  }

  getJournalEntryById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  updateJournalEntry(id: number, payload: JournalEntryPayload): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, payload);
  }

  getCashBalance(companyId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/cash-balance?company_id=${companyId}`);
  }

  deleteJournalEntry(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  getJournalEntryPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, {
      responseType: 'blob'
    });
  }

  private handleError(err: HttpErrorResponse): never {
    console.error('HTTP ERROR:', err);
    throw err;
  }
}
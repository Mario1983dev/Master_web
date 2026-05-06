import { CommonModule, Location } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
import { finalize } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-trial-balance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './trial-balance.component.html',
  styleUrls: ['./trial-balance.component.scss']
})
export class TrialBalanceComponent implements OnInit {
  private http = inject(HttpClient);
  private location = inject(Location);
  private cdr = inject(ChangeDetectorRef);

  rows: any[] = [];
  loading = false;
  exportingPdf = false;

  fromDate = '';
  toDate = '';

  ngOnInit(): void {
    const today = new Date();
    this.fromDate = `${today.getFullYear()}-01-01`;
    this.toDate = `${today.getFullYear()}-12-31`;
  }

  search(): void {
    const companyId = this.getCompanyId();

    if (!companyId) {
      alert('Debes seleccionar una empresa activa.');
      return;
    }

    const params = new HttpParams()
      .set('company_id', String(companyId))
      .set('from', this.fromDate)
      .set('to', this.toDate)
      .set('_t', Date.now().toString());

    this.loading = true;
    this.rows = [];
    this.cdr.detectChanges();

    this.http
      .get<any[]>(`${environment.apiUrl}/trial-balance`, { params })
      .pipe(
        finalize(() => {
          this.loading = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (res) => {
          const data = Array.isArray(res) ? res : [];

          this.rows = data.filter((r) =>
            Number(r.debit || 0) !== 0 ||
            Number(r.credit || 0) !== 0 ||
            Number(r.saldo || 0) !== 0
          );

          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Error cargando balance:', err);
          alert('Error cargando balance.');
        }
      });
  }

  exportPdf(): void {
    const companyId = this.getCompanyId();

    if (!companyId) {
      alert('Debes seleccionar una empresa activa.');
      return;
    }

    const params = new HttpParams()
      .set('company_id', String(companyId))
      .set('from', this.fromDate)
      .set('to', this.toDate)
      .set('_t', Date.now().toString());

    this.exportingPdf = true;

    this.http
      .get(`${environment.apiUrl}/trial-balance/pdf`, {
        params,
        responseType: 'blob'
      })
      .pipe(
        finalize(() => {
          this.exportingPdf = false;
          this.cdr.detectChanges();
        })
      )
      .subscribe({
        next: (blob) => {
          const file = new Blob([blob], { type: 'application/pdf' });
          const url = window.URL.createObjectURL(file);
          window.open(url, '_blank');

          setTimeout(() => {
            window.URL.revokeObjectURL(url);
          }, 10000);
        },
        error: (err) => {
          console.error('Error exportando PDF:', err);
          alert('Error exportando PDF.');
        }
      });
  }

  private getCompanyId(): string | number | null {
    const selected = localStorage.getItem('selected_company');

    if (selected) {
      try {
        const company = JSON.parse(selected);
        if (company?.id) return company.id;
      } catch {}
    }

    return localStorage.getItem('company_id');
  }

  trackByCode(index: number, item: any): string {
    return item.account_code || item.code || index.toString();
  }

  goBack(): void {
    this.location.back();
  }

  get totalDebit(): number {
    return this.rows.reduce((sum, r) => sum + Number(r.debit || 0), 0);
  }

  get totalCredit(): number {
    return this.rows.reduce((sum, r) => sum + Number(r.credit || 0), 0);
  }

  get totalSaldo(): number {
    return this.rows.reduce((sum, r) => sum + Number(r.saldo || 0), 0);
  }

  formatAmount(value: any): string {
    return Number(value || 0).toLocaleString('es-CL');
  }
}
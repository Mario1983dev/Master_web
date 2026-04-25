import { CommonModule, Location } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpParams } from '@angular/common/http';
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

  rows: any[] = [];
  loading = false;

  fromDate = '';
  toDate = '';

  ngOnInit(): void {
    const today = new Date();
    this.fromDate = `${today.getFullYear()}-01-01`;
    this.toDate = `${today.getFullYear()}-12-31`;
    // ❌ quitamos el auto search
  }

  search(): void {
   const selected = localStorage.getItem('selected_company');
const company = selected ? JSON.parse(selected) : null;
const companyId = company?.id;

    if (!companyId) {
      alert('Debes seleccionar una empresa activa.');
      return;
    }

    const params = new HttpParams()
      .set('company_id', companyId)
      .set('from', this.fromDate)
      .set('to', this.toDate);

    this.loading = true;
    this.rows = []; // limpia resultados anteriores

    this.http
      .get<any[]>(`${environment.apiUrl}/api/reports/trial-balance`, { params })
      .subscribe({
        next: (res) => {
          this.rows = res || [];
          this.loading = false;
        },
        error: (err) => {
          console.error('Error cargando balance:', err);
          this.loading = false;
          // ❌ evitamos alert molesto
        }
      });
  }

  goBack(): void {
    this.location.back();
  }

  get totalDebit(): number {
    return this.rows.reduce((sum, r) => sum + Number(r.total_debit || 0), 0);
  }

  get totalCredit(): number {
    return this.rows.reduce((sum, r) => sum + Number(r.total_credit || 0), 0);
  }

  get totalDebtor(): number {
    return this.rows.reduce((sum, r) => sum + Number(r.saldo_deudor || 0), 0);
  }

  get totalCreditor(): number {
    return this.rows.reduce((sum, r) => sum + Number(r.saldo_acreedor || 0), 0);
  }
}
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-accounting-periods',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './accounting-periods.html',
  styleUrls: ['./accounting-periods.scss']
})
export class AccountingPeriods implements OnInit {

  periods: any[] = [];

  loading = false;
  errorMessage = '';
  successMessage = '';

  companyId = 0;
  companyName = '';

  newYear = new Date().getFullYear();

  constructor(
    private http: HttpClient,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const company = localStorage.getItem('selected_company');

    if (!company) {
      this.router.navigate(['/office/dashboard']);
      return;
    }

    const parsed = JSON.parse(company);

    this.companyId = parsed.id;
    this.companyName = parsed.name;

    this.loadPeriods();
  }

  getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');

    return new HttpHeaders({
      Authorization: `Bearer ${token}`
    });
  }

  loadPeriods(): void {
    this.loading = true;
    this.errorMessage = '';

    this.http.get<any>(
      `${environment.apiUrl}/accounting-periods?company_id=${this.companyId}`,
      {
        headers: this.getHeaders()
      }
    ).subscribe({
      next: (response: any) => {
        console.log('RESPUESTA PERIODOS:', response);

        this.periods = Array.isArray(response)
          ? response
          : response.periods || response.data || [];

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(err);

        this.errorMessage = 'Error al cargar períodos';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  createPeriod(): void {
    this.errorMessage = '';
    this.successMessage = '';

    this.http.post(
      `${environment.apiUrl}/accounting-periods`,
      {
        company_id: this.companyId,
        year_num: this.newYear
      },
      {
        headers: this.getHeaders()
      }
    ).subscribe({
      next: () => {
        this.successMessage = 'Período creado correctamente';
        this.loadPeriods();
      },
      error: (err) => {
        this.errorMessage =
          err?.error?.message || 'Error al crear período';
      }
    });
  }

  changeStatus(periodId: number, status: string): void {
    this.http.put(
      `${environment.apiUrl}/accounting-periods/${periodId}`,
      { status },
      { headers: this.getHeaders() }
    ).subscribe({
      next: () => {
        this.loadPeriods();
      },
      error: () => {
        this.errorMessage = 'Error al actualizar período';
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/office/dashboard']);
  }
}
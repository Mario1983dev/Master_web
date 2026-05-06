import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { JournalEntriesService, LedgerRow } from '../../../services/journal-entries.service';
import { AuthMaster } from '../../../services/auth-master';
import { AccountsService } from '../../../services/accounts.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-ledger-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './ledger-report.component.html',
  styleUrls: ['./ledger-report.component.scss']
})
export class LedgerReportComponent implements OnInit {
  private journalService = inject(JournalEntriesService);
  private authService = inject(AuthMaster);
  private accountsService = inject(AccountsService);
  private cdr = inject(ChangeDetectorRef);

  fromDate = '';
  toDate = '';

  accounts: any[] = [];
  selectedAccountId: number | null = null;

  ledger: LedgerRow[] = [];

  loading = false;
  loadingAccounts = false;
  searched = false;

  ngOnInit(): void {
    this.setDefaultDates();
    this.loadAccounts();
  }

  setDefaultDates(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);

    this.fromDate = firstDay.toISOString().split('T')[0];
    this.toDate = today.toISOString().split('T')[0];
  }

  loadAccounts(): void {
    const companyId = this.authService.getSelectedCompanyId();

    if (!companyId) {
      console.warn('No hay empresa seleccionada.');
      this.accounts = [];
      this.selectedAccountId = null;
      return;
    }

    this.loadingAccounts = true;
    this.accounts = [];
    this.selectedAccountId = null;

    this.accountsService.getAccounts(companyId).subscribe({
      next: (resp: any) => {
        if (Array.isArray(resp)) {
          this.accounts = resp;
        } else if (Array.isArray(resp?.data)) {
          this.accounts = resp.data;
        } else if (Array.isArray(resp?.accounts)) {
          this.accounts = resp.accounts;
        } else {
          this.accounts = [];
        }

        if (this.accounts.length > 0) {
          this.selectedAccountId = Number(this.accounts[0].id);
        }

        this.loadingAccounts = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error cargando cuentas:', err);
        this.accounts = [];
        this.selectedAccountId = null;
        this.loadingAccounts = false;
        this.cdr.detectChanges();
      }
    });
  }

  onFiltersChanged(): void {
    this.ledger = [];
    this.searched = false;
    this.loading = false;
    this.cdr.detectChanges();
  }

  search(): void {
    const companyId = this.authService.getSelectedCompanyId();

    if (!companyId) {
      alert('Debes seleccionar una empresa primero.');
      return;
    }

    if (!this.selectedAccountId) {
      alert('Debes seleccionar una cuenta.');
      return;
    }

    console.log('BUSCANDO LIBRO MAYOR', {
      companyId,
      accountId: this.selectedAccountId,
      fromDate: this.fromDate,
      toDate: this.toDate
    });

    this.loading = true;
    this.searched = true;
    this.ledger = [];
    this.cdr.detectChanges();

    this.journalService
      .getLedger(
        Number(companyId),
        Number(this.selectedAccountId),
        this.fromDate,
        this.toDate
      )
      .subscribe({
        next: (resp: any) => {
          console.log('RESP LIBRO MAYOR', resp);

          if (Array.isArray(resp)) {
            this.ledger = resp;
          } else if (Array.isArray(resp?.data)) {
            this.ledger = resp.data;
          } else if (Array.isArray(resp?.rows)) {
            this.ledger = resp.rows;
          } else {
            this.ledger = [];
          }

          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('Error cargando libro mayor:', err);
          this.ledger = [];
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  openPdf(): void {
    const companyId = this.authService.getSelectedCompanyId();

    if (!companyId) {
      alert('Debes seleccionar una empresa primero.');
      return;
    }

    if (!this.selectedAccountId) {
      alert('Debes seleccionar una cuenta.');
      return;
    }

    const url =
      `${environment.apiUrl}/ledger/pdf` +
      `?company_id=${companyId}` +
      `&account_id=${this.selectedAccountId}` +
      `&fromDate=${this.fromDate}` +
      `&toDate=${this.toDate}`;

    window.open(url, '_blank');
  }

  goBack(): void {
    window.history.back();
  }
}
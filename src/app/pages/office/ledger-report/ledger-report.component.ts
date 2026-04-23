import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { JournalEntriesService, LedgerRow } from '../../../services/journal-entries.service';
import { AuthMaster } from '../../../services/auth-master';
import { AccountsService } from '../../../services/accounts.service';

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

  fromDate = '';
  toDate = '';

  accounts: any[] = [];
  selectedAccountId: number | null = null;

  ledger: LedgerRow[] = [];

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
      return;
    }

    this.accountsService.getAccounts(companyId).subscribe({
      next: (data: any[]) => {
        this.accounts = data;
      },
      error: (err: any) => {
        console.error('Error cargando cuentas:', err);
      }
    });
  }

  search(): void {
    const companyId = this.authService.getSelectedCompanyId();

    if (!companyId || !this.selectedAccountId) {
      return;
    }

    this.journalService
      .getLedger(companyId, this.selectedAccountId, this.fromDate, this.toDate)
      .subscribe({
        next: (data: LedgerRow[]) => {
          this.ledger = data;
        },
        error: (err: any) => {
          console.error('Error cargando libro mayor:', err);
        }
      });
  }

  goBack(): void {
    window.history.back();
  }
}
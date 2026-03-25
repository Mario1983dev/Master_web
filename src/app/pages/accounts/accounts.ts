import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountsService, Account } from '../../services/accounts.service';
import { AuthMaster } from '../../services/auth-master';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './accounts.html',
  styleUrls: ['./accounts.scss']
})
export class AccountsComponent implements OnInit {

  private accountsService = inject(AccountsService);
  private auth = inject(AuthMaster);

  accounts: Account[] = [];
  companyId: number | null = null;

  ngOnInit(): void {
    this.companyId = this.auth.getSelectedCompanyId();

    if (!this.companyId) {
      alert('Debes seleccionar una empresa primero.');
      return;
    }

    this.loadAccounts();
  }

  loadAccounts(): void {
    if (!this.companyId) return;

    this.accountsService.getByCompany(this.companyId).subscribe({
      next: (data) => {
        console.log('CUENTAS =>', data);
        this.accounts = data;
      },
      error: (err) => {
        console.error('ERROR CUENTAS:', err);
        alert('Error al cargar cuentas');
      }
    });
  }
}
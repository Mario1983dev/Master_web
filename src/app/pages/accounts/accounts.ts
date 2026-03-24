import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AccountsService, Account } from '../../services/accounts.service';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './accounts.html',
  styleUrls: ['./accounts.scss']
})
export class AccountsComponent implements OnInit {

  private accountsService = inject(AccountsService);

  accounts: Account[] = [];
  companyId = 5;

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
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
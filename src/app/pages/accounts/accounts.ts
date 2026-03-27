import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthMaster } from '../../services/auth-master';
import { AccountsService, Account } from '../../services/accounts.service';

@Component({
  selector: 'app-accounts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './accounts.html',
  styleUrls: ['./accounts.scss']
})
export class Accounts implements OnInit {
  accounts: Account[] = [];
  filteredAccounts: Account[] = [];

  loading = false;
  saving = false;
  error = '';
  success = '';
  companyName = '';

  searchTerm = '';

  puedeAdministrarCuentas = false;

  form = {
    code: '',
    name: '',
    account_type: 'ACTIVO',
    balance_nature: 'DEBITO',
    parent_code: '',
    level_num: 1,
    sort_order: 1,
    allows_entries: 1,
    notes: ''
  };

  constructor(
    private auth: AuthMaster,
    private accountsService: AccountsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const company = this.auth.getSelectedCompany();

    if (!company) {
      this.error = 'Debes seleccionar una empresa primero';
      return;
    }

    this.companyName = company.name || '';

    const user = this.auth.getUser();
    console.log('👤 USER ACCOUNTS =>', user);

    this.definirPermisos(user);
    this.onAccountTypeChange();
    this.loadAccounts(Number(company.id));
  }

  definirPermisos(user: any): void {
    const role = (user?.role || '').toString().toUpperCase();

    this.puedeAdministrarCuentas =
      role === 'ADMIN' ||
      role === 'OFFICE_ADMIN';
  }

  loadAccounts(companyId: number): void {
    this.loading = true;
    this.error = '';

    this.accountsService.getAccounts(companyId).subscribe({
      next: (resp) => {
        this.accounts = resp || [];
        this.filteredAccounts = [...this.accounts];
        this.loading = false;

        this.generarCodigoPropuesto();
        this.filterAccounts();

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error cargando cuentas', err);
        this.error = err?.error?.message || 'No se pudieron cargar las cuentas';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onAccountTypeChange(): void {
    const map: any = {
      ACTIVO: 'DEBITO',
      GASTO: 'DEBITO',
      PASIVO: 'CREDITO',
      PATRIMONIO: 'CREDITO',
      INGRESO: 'CREDITO'
    };

    this.form.balance_nature = map[this.form.account_type] || 'DEBITO';
    this.generarCodigoPropuesto();
  }

  onParentCodeChange(): void {
    if (!this.form.parent_code) {
      this.form.level_num = 1;
    } else {
      const parent = this.accounts.find(a => a.code === this.form.parent_code);

      if (parent) {
        this.form.level_num = Number(parent.level_num || 1) + 1;
      } else {
        this.form.level_num = 1;
      }
    }

    this.generarCodigoPropuesto();
  }

  generarCodigoPropuesto(): void {
    if (!this.accounts.length) {
      this.form.code = '1010101';
      return;
    }

    if (!this.form.parent_code) {
      const sameTypeAccounts = this.accounts.filter(
        a => a.account_type === this.form.account_type
      );

      if (!sameTypeAccounts.length) {
        const baseMap: any = {
          ACTIVO: '1010101',
          PASIVO: '2010101',
          PATRIMONIO: '3010101',
          INGRESO: '4010101',
          GASTO: '5010101'
        };

        this.form.code = baseMap[this.form.account_type] || '1010101';
        return;
      }

      const maxCode = Math.max(...sameTypeAccounts.map(a => Number(a.code || 0)));
      this.form.code = String(maxCode + 1);
      return;
    }

    const parentCode = String(this.form.parent_code);

    const children = this.accounts.filter(
      a => String(a.parent_code || '') === parentCode
    );

    if (!children.length) {
      this.form.code = String(Number(parentCode) + 1);
      return;
    }

    const maxChildCode = Math.max(...children.map(a => Number(a.code || 0)));
    this.form.code = String(maxChildCode + 1);
  }

  filterAccounts(): void {
    const term = this.searchTerm.trim().toLowerCase();

    if (!term) {
      this.filteredAccounts = [...this.accounts];
      return;
    }

    this.filteredAccounts = this.accounts.filter(account =>
      String(account.code || '').toLowerCase().includes(term) ||
      String(account.name || '').toLowerCase().includes(term) ||
      String(account.account_type || '').toLowerCase().includes(term) ||
      String(account.balance_nature || '').toLowerCase().includes(term)
    );
  }

  saveAccount(): void {
    if (!this.puedeAdministrarCuentas) {
      this.error = 'No tienes permisos para crear cuentas';
      return;
    }

    const company = this.auth.getSelectedCompany();

    if (!company) {
      this.error = 'Debes seleccionar una empresa primero';
      return;
    }

    if (!this.form.code) {
      this.generarCodigoPropuesto();
    }

    this.saving = true;
    this.error = '';
    this.success = '';

    const payload = {
      company_id: Number(company.id),
      ...this.form
    };

    this.accountsService.createAccount(payload).subscribe({
      next: () => {
        this.success = 'Cuenta creada correctamente';
        this.saving = false;

        this.form = {
          code: '',
          name: '',
          account_type: 'ACTIVO',
          balance_nature: 'DEBITO',
          parent_code: '',
          level_num: 1,
          sort_order: 1,
          allows_entries: 1,
          notes: ''
        };

        this.onAccountTypeChange();
        this.loadAccounts(Number(company.id));
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('❌ Error guardando cuenta', err);
        this.error = err?.error?.message || 'No se pudo guardar la cuenta';
        this.saving = false;
        this.cdr.detectChanges();
      }
    });
  }
}
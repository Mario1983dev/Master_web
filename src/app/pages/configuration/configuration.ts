import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthMaster } from '../../services/auth-master';
import { AccountsService, Account } from '../../services/accounts.service';
import {
  ConfigurationService,
  AccountMapping
} from '../../services/configuration.service';

type MappingRow = {
  key: string;
  label: string;
  account_id: number | null;
  notes: string;
  existing_id: number | null;
  searchText: string;
  filteredAccounts: Account[];
};

@Component({
  selector: 'app-configuration',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './configuration.html',
  styleUrls: ['./configuration.scss']
})
export class Configuration implements OnInit {
  private auth = inject(AuthMaster);
  private accountsService = inject(AccountsService);
  private configurationService = inject(ConfigurationService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);

  companyId: number | null = null;
  companyName = '';

  loading = false;
  saving = false;
  error = '';
  success = '';

  accounts: Account[] = [];
  mappings: AccountMapping[] = [];

  rows: MappingRow[] = [
    { key: 'CAJA', label: 'Caja', account_id: null, notes: '', existing_id: null, searchText: '', filteredAccounts: [] },
    { key: 'BANCO', label: 'Banco', account_id: null, notes: '', existing_id: null, searchText: '', filteredAccounts: [] },
    { key: 'CLIENTES', label: 'Clientes', account_id: null, notes: '', existing_id: null, searchText: '', filteredAccounts: [] },
    { key: 'PROVEEDORES', label: 'Proveedores', account_id: null, notes: '', existing_id: null, searchText: '', filteredAccounts: [] },
    { key: 'IVA_CREDITO', label: 'IVA Crédito', account_id: null, notes: '', existing_id: null, searchText: '', filteredAccounts: [] },
    { key: 'IVA_DEBITO', label: 'IVA Débito', account_id: null, notes: '', existing_id: null, searchText: '', filteredAccounts: [] },
    { key: 'VENTAS', label: 'Ventas', account_id: null, notes: '', existing_id: null, searchText: '', filteredAccounts: [] },
    { key: 'COMPRAS', label: 'Compras', account_id: null, notes: '', existing_id: null, searchText: '', filteredAccounts: [] }
  ];

  ngOnInit(): void {
    const company = this.auth.getSelectedCompany();

    if (!company) {
      this.error = 'Debes seleccionar una empresa primero';
      this.cdr.detectChanges();
      return;
    }

    this.companyId = Number(company.id);
    this.companyName = String(company.name || company.legal_name || '').trim();

    this.loadAll();
  }

  goBack(): void {
    this.router.navigate(['/office/dashboard']);
  }

  loadAll(): void {
    if (!this.companyId) {
      this.error = 'Debes seleccionar una empresa válida';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';
    this.cdr.detectChanges();

    let accountsLoaded = false;
    let mappingsLoaded = false;

    const finishLoading = () => {
      if (accountsLoaded && mappingsLoaded) {
        this.loading = false;
        this.cdr.detectChanges();
      }
    };

    this.accountsService.getAccounts(this.companyId).subscribe({
      next: (accounts) => {
        this.accounts = (accounts || []).filter(
          (acc) => Number(acc.is_active) === 1
        );

        accountsLoaded = true;
        this.refreshFilteredAccounts();
        finishLoading();
      },
      error: (err) => {
        console.error('ERROR ACCOUNTS:', err);
        this.accounts = [];
        this.error = err?.error?.message || 'Error al cargar cuentas';
        accountsLoaded = true;
        this.refreshFilteredAccounts();
        finishLoading();
      }
    });

    this.configurationService.getAccountMappings(this.companyId).subscribe({
      next: (mappings) => {
        this.mappings = mappings || [];
        this.bindMappingsToRows();
        mappingsLoaded = true;
        finishLoading();
      },
      error: (err) => {
        console.error('ERROR MAPPINGS:', err);
        this.mappings = [];
        this.bindMappingsToRows();
        this.error = err?.error?.message || 'Error al cargar configuración';
        mappingsLoaded = true;
        finishLoading();
      }
    });
  }

  bindMappingsToRows(): void {
    this.rows = this.rows.map((row) => {
      const existing = this.mappings.find(
        (m) => String(m.mapping_key).trim().toUpperCase() === row.key
      );

      const selectedId = existing ? Number(existing.account_id) : null;

      return {
        ...row,
        account_id: selectedId,
        notes: existing?.notes || '',
        existing_id: existing ? Number(existing.id) : null,
        searchText: this.getSelectedAccountLabel(selectedId),
        filteredAccounts: []
      };
    });

    this.refreshFilteredAccounts();
    this.cdr.detectChanges();
  }

  filterAccounts(row: MappingRow): void {
    const term = String(row.searchText || '').trim().toLowerCase();

    if (!term) {
      row.filteredAccounts = [];
      this.cdr.detectChanges();
      return;
    }

    row.filteredAccounts = this.accounts
      .filter((acc) => {
        const code = String(acc.code || '').toLowerCase();
        const name = String(acc.name || '').toLowerCase();
        return code.includes(term) || name.includes(term);
      })
      .slice(0, 8);

    this.cdr.detectChanges();
  }

  selectAccount(row: MappingRow, id: number | null | undefined): void {
    if (!id) {
      return;
    }

    row.account_id = Number(id);
    row.searchText = this.getSelectedAccountLabel(Number(id));
    row.filteredAccounts = [];
    this.error = '';
    this.cdr.detectChanges();
  }

  getSelectedAccountLabel(id: number | null | undefined): string {
    if (!id) {
      return '';
    }

    const acc = this.accounts.find(
      (a) => Number(a.id) === Number(id)
    );

    return acc ? `${acc.code} - ${acc.name}` : '';
  }

  refreshFilteredAccounts(): void {
    this.rows.forEach((row) => {
      if (row.searchText && row.searchText.trim()) {
        this.filterAccounts(row);
      } else {
        row.filteredAccounts = [];
      }
    });

    this.cdr.detectChanges();
  }

  saveRow(row: MappingRow): void {
    if (!this.companyId) {
      this.error = 'Debes seleccionar una empresa';
      this.success = '';
      this.cdr.detectChanges();
      return;
    }

    if (!row.account_id) {
      this.error = `Selecciona cuenta para ${row.label}`;
      this.success = '';
      this.cdr.detectChanges();
      return;
    }

    this.saving = true;
    this.error = '';
    this.success = '';
    this.cdr.detectChanges();

    const payload = {
      account_id: row.account_id,
      notes: row.notes
    };

    const doneOk = () => {
      this.success = row.existing_id
        ? `Configuración actualizada: ${row.label}`
        : `Configuración guardada: ${row.label}`;

      this.saving = false;
      row.filteredAccounts = [];
      row.searchText = this.getSelectedAccountLabel(row.account_id);
      this.cdr.detectChanges();
      this.loadAll();
    };

    const doneError = (err: any) => {
      console.error('ERROR SAVE CONFIG:', err);
      this.error = err?.error?.message || 'Error al guardar configuración';
      this.saving = false;
      this.cdr.detectChanges();
    };

    if (row.existing_id) {
      this.configurationService.updateAccountMapping(row.existing_id, payload).subscribe({
        next: doneOk,
        error: doneError
      });
      return;
    }

    this.configurationService.createAccountMapping({
      company_id: this.companyId,
      mapping_key: row.key,
      account_id: row.account_id,
      notes: row.notes
    }).subscribe({
      next: doneOk,
      error: doneError
    });
  }
}
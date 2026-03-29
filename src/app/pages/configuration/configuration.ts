import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

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

  companyId: number | null = null;
  companyName = '';

  loading = false;
  saving = false;
  error = '';
  success = '';

  accounts: Account[] = [];
  mappings: AccountMapping[] = [];

  rows: MappingRow[] = [
    { key: 'CAJA', label: 'Caja', account_id: null, notes: '', existing_id: null },
    { key: 'BANCO', label: 'Banco', account_id: null, notes: '', existing_id: null },
    { key: 'CLIENTES', label: 'Clientes', account_id: null, notes: '', existing_id: null },
    { key: 'PROVEEDORES', label: 'Proveedores', account_id: null, notes: '', existing_id: null },
    { key: 'IVA_CREDITO', label: 'IVA Crédito', account_id: null, notes: '', existing_id: null },
    { key: 'IVA_DEBITO', label: 'IVA Débito', account_id: null, notes: '', existing_id: null },
    { key: 'VENTAS', label: 'Ventas', account_id: null, notes: '', existing_id: null },
    { key: 'COMPRAS', label: 'Compras', account_id: null, notes: '', existing_id: null }
  ];

  ngOnInit(): void {
    const company = this.auth.getSelectedCompany();

    if (!company) {
      this.error = 'Debes seleccionar una empresa primero';
      return;
    }

    this.companyId = Number(company.id);
    this.companyName = String(company.name || '').trim();

    this.loadAll();
  }

  loadAll(): void {
    if (!this.companyId) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    forkJoin({
      accounts: this.accountsService.getAccounts(this.companyId),
      mappings: this.configurationService.getAccountMappings(this.companyId)
    }).subscribe({
      next: ({ accounts, mappings }) => {
        this.accounts = (accounts || []).filter(
          (acc) => Number(acc.is_active) === 1
        );

        this.mappings = mappings || [];
        this.bindMappingsToRows();
        this.loading = false;
      },
      error: (err) => {
        console.error('ERROR LOAD CONFIG:', err);
        this.error = err?.error?.message || 'Error al cargar configuración';
        this.loading = false;
      }
    });
  }

  bindMappingsToRows(): void {
    this.rows = this.rows.map((row) => {
      const existing = this.mappings.find(
        (m) => String(m.mapping_key).trim().toUpperCase() === row.key
      );

      return {
        ...row,
        account_id: existing ? Number(existing.account_id) : null,
        notes: existing?.notes || '',
        existing_id: existing ? Number(existing.id) : null
      };
    });
  }

  saveRow(row: MappingRow): void {
    if (!this.companyId) {
      this.error = 'Debes seleccionar una empresa';
      this.success = '';
      return;
    }

    if (!row.account_id) {
      this.error = `Debes seleccionar una cuenta para ${row.label}`;
      this.success = '';
      return;
    }

    this.saving = true;
    this.error = '';
    this.success = '';

    if (row.existing_id) {
      this.configurationService.updateAccountMapping(row.existing_id, {
        account_id: row.account_id,
        notes: row.notes
      }).subscribe({
        next: () => {
          this.success = `Configuración actualizada: ${row.label}`;
          this.saving = false;
          this.loadAll();
        },
        error: (err) => {
          console.error('ERROR UPDATE CONFIG:', err);
          this.error = err?.error?.message || 'Error al actualizar configuración';
          this.saving = false;
        }
      });

      return;
    }

    this.configurationService.createAccountMapping({
      company_id: this.companyId,
      mapping_key: row.key,
      account_id: row.account_id,
      notes: row.notes
    }).subscribe({
      next: () => {
        this.success = `Configuración guardada: ${row.label}`;
        this.saving = false;
        this.loadAll();
      },
      error: (err) => {
        console.error('ERROR CREATE CONFIG:', err);
        this.error = err?.error?.message || 'Error al guardar configuración';
        this.saving = false;
      }
    });
  }
}
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthMaster } from '../../services/auth-master';
import { JournalEntriesService } from '../../services/journal-entries.service';
import { AccountsService, Account } from '../../services/accounts.service';

@Component({
  selector: 'app-journal-entries',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './journal-entries.html',
  styleUrls: ['./journal-entries.scss']
})
export class JournalEntries implements OnInit {
  entries: any[] = [];
  accounts: Account[] = [];

  loading = false;
  saving = false;
  error = '';
  success = '';
  companyName = '';

  codigoCuentaCaja = '1010101';
  saldoCaja = 0;

  form: any = this.getEmptyForm();
  lines: any[] = [this.getEmptyLine()];

  constructor(
    private auth: AuthMaster,
    private journalEntriesService: JournalEntriesService,
    private accountsService: AccountsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const company = this.auth.getSelectedCompany();

    if (!company?.id) {
      this.error = 'Debes seleccionar una empresa primero';
      return;
    }

    this.companyName = company.name || '';
    this.loadAccounts(company.id);
    this.loadJournalEntries(company.id);
    this.loadCaja();
  }

  getEmptyForm() {
    return {
      id: null,
      entry_date: this.getToday(),
      description: '',
      entry_type: 'MANUAL'
    };
  }

  getEmptyLine() {
    return {
      account_id: null,
      account_code: '',
      account_search: '',
      filteredAccounts: [],
      description: '',
      debit: 0,
      credit: 0
    };
  }

  getToday(): string {
    const d = new Date();
    return d.toISOString().substring(0, 10);
  }

  loadAccounts(companyId: number): void {
    this.accountsService.getAccounts(companyId).subscribe({
      next: (rows) => {
        this.accounts = rows || [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'No se pudieron cargar las cuentas';
        this.cdr.detectChanges();
      }
    });
  }

  loadJournalEntries(companyId: number): void {
    this.loading = true;

    this.journalEntriesService.getJournalEntries(companyId).subscribe({
      next: (rows) => {
        this.entries = rows || [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'No se pudieron cargar los asientos';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  loadCaja(): void {
    const company = this.auth.getSelectedCompany();

    if (!company?.id) return;

    this.journalEntriesService.getCashBalance(company.id).subscribe({
      next: (resp) => {
        this.saldoCaja = Number(resp.balance || 0);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('ERROR CAJA', err);
      }
    });
  }

  onSearchAccount(index: number): void {
    const value = String(this.lines[index]?.account_search || '').trim().toLowerCase();

    if (!value) {
      this.lines[index].filteredAccounts = [];
      this.lines[index].account_id = null;
      this.lines[index].account_code = '';
      this.cdr.detectChanges();
      return;
    }

    this.lines[index].filteredAccounts = this.accounts
      .filter(acc =>
        String(acc.code || '').toLowerCase().includes(value) ||
        String(acc.name || '').toLowerCase().includes(value)
      )
      .slice(0, 8);

    this.cdr.detectChanges();
  }

  selectAccount(index: number, acc: any): void {
    this.lines[index].account_id = acc.id;
    this.lines[index].account_code = acc.code;
    this.lines[index].account_search = `${acc.code} - ${acc.name}`;
    this.lines[index].filteredAccounts = [];
    this.error = '';
    this.cdr.detectChanges();
  }

  hideAccountSuggestions(index: number): void {
    setTimeout(() => {
      this.lines[index].filteredAccounts = [];
      this.cdr.detectChanges();
    }, 150);
  }

  addLine(): void {
    this.lines.push(this.getEmptyLine());
    this.cdr.detectChanges();
  }

  removeLine(index: number): void {
    if (this.lines.length === 1) return;
    this.lines.splice(index, 1);
    this.cdr.detectChanges();
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    if (event.key === 'Tab' && index === this.lines.length - 1) {
      this.addLine();
      this.cdr.detectChanges();
    }
  }

  onDebitChange(i: number): void {
    if (Number(this.lines[i].debit || 0) > 0) {
      this.lines[i].credit = 0;
    }
    this.cdr.detectChanges();
  }

  onCreditChange(i: number): void {
    if (Number(this.lines[i].credit || 0) > 0) {
      this.lines[i].debit = 0;
    }
    this.cdr.detectChanges();
  }

  get totalDebit(): number {
    return this.lines.reduce((s, l) => s + Number(l.debit || 0), 0);
  }

  get totalCredit(): number {
    return this.lines.reduce((s, l) => s + Number(l.credit || 0), 0);
  }

  get difference(): number {
    return this.totalDebit - this.totalCredit;
  }

  get impactoCaja(): number {
    let impacto = 0;

    for (const l of this.lines) {
      if (String(l.account_code || '').trim() === this.codigoCuentaCaja) {
        impacto += Number(l.debit || 0);
        impacto -= Number(l.credit || 0);
      }
    }

    return impacto;
  }

  get cajaProyectada(): number {
    return this.saldoCaja + this.impactoCaja;
  }

  get canSave(): boolean {
    return (
      String(this.form.description || '').trim().length > 0 &&
      this.totalDebit > 0 &&
      this.totalDebit === this.totalCredit &&
      this.lines.every(
        l =>
          l.account_id &&
          ((Number(l.debit || 0) > 0 && Number(l.credit || 0) === 0) ||
            (Number(l.credit || 0) > 0 && Number(l.debit || 0) === 0))
      )
    );
  }

  saveEntry(): void {
    const company = this.auth.getSelectedCompany();

    if (!company?.id) {
      this.error = 'Empresa no seleccionada';
      return;
    }

    if (!this.canSave) {
      this.error = 'Asiento inválido o descuadrado';
      return;
    }

    this.saving = true;
    this.error = '';
    this.success = '';

    const payload = {
      company_id: company.id,
      entry_date: this.form.entry_date,
      entry_type: this.form.entry_type,
      description: String(this.form.description || '').trim(),
      lines: this.lines.map(l => ({
        account_id: l.account_id,
        description: l.description || '',
        debit: Number(l.debit || 0),
        credit: Number(l.credit || 0)
      }))
    };

    const request = this.form.id
      ? this.journalEntriesService.updateJournalEntry(this.form.id, payload)
      : this.journalEntriesService.createJournalEntry(payload);

    request.subscribe({
      next: () => {
        this.success = this.form.id
          ? 'Asiento actualizado correctamente'
          : 'Asiento guardado correctamente';

        this.resetForm();
        this.loadJournalEntries(company.id);
        this.loadCaja();
        this.saving = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Error al guardar';
        this.saving = false;
        this.cdr.detectChanges();
      }
    });
  }

  editEntry(entry: any): void {
    this.journalEntriesService.getJournalEntryById(entry.id).subscribe({
      next: (resp: any) => {
        this.form = {
          id: resp.id,
          entry_date: String(resp.entry_date || '').substring(0, 10),
          description: resp.description || '',
          entry_type: resp.entry_type || 'MANUAL'
        };

        this.lines = (resp.lines || []).map((line: any) => ({
          account_id: line.account_id,
          account_code: line.account_code || '',
          account_search:
            line.account_code && line.account_name
              ? `${line.account_code} - ${line.account_name}`
              : (line.account_code || ''),
          filteredAccounts: [],
          description: line.description || '',
          debit: Number(line.debit || 0),
          credit: Number(line.credit || 0)
        }));

        if (this.lines.length === 0) {
          this.lines = [this.getEmptyLine()];
        }

        this.error = '';
        this.success = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('ERROR CARGANDO ASIENTO', err);
        this.error = 'No se pudo cargar el asiento para edición';
        this.cdr.detectChanges();
      }
    });
  }

  deleteEntry(entry: any): void {
    if (!confirm('¿Eliminar asiento?')) return;

    this.journalEntriesService.deleteJournalEntry(entry.id).subscribe({
      next: () => {
        const company = this.auth.getSelectedCompany();
        this.success = 'Asiento eliminado';
        this.loadJournalEntries(company.id);
        this.loadCaja();
        this.cdr.detectChanges();
      },
      error: () => {
        this.error = 'No se pudo eliminar';
        this.cdr.detectChanges();
      }
    });
  }

  resetForm(): void {
    this.form = this.getEmptyForm();
    this.lines = [this.getEmptyLine()];
    this.error = '';
    this.success = '';
    this.cdr.detectChanges();
  }

  printEntry(entry: any): void {
    window.open(`/asientos/${entry.id}/pdf`, '_blank');
  }
}
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  JournalEntriesService,
  EntryType,
  JournalEntryItem,
  JournalEntryPayload
} from '../../services/journal-entries.service';
import { AccountsService, Account } from '../../services/accounts.service';
import { ConfigurationService, AccountingPeriod } from '../../services/configuration.service';
import { formatInteger, parseFormattedInteger } from '../../shared/utils/erp-validators';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface CompanyAccountOption {
  id: number;
  code: string;
  name: string;
}

interface JournalEntryLineForm {
  account_id: number | null;
  account_search: string;
  account_code: string;
  account_name: string;
  description: string;
  debit: number | null;
  credit: number | null;
}

interface JournalEntryDetail {
  id?: number;
  account_id: number | null;
  account_code?: string;
  account_name?: string;
  description: string;
  debit: number;
  credit: number;
}

@Component({
  selector: 'app-journal-entries',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './journal-entries.html',
  styleUrls: ['./journal-entries.scss']
})
export class JournalEntries implements OnInit {
  private router = inject(Router);
  private service = inject(JournalEntriesService);
  private accountsService = inject(AccountsService);
  private configurationService = inject(ConfigurationService);
  private cdr = inject(ChangeDetectorRef);

  companyId = 0;

  entryDate = '';
  entryType = '';
  description = '';
  copyUntilDecember = false;

  entryTypes: EntryType[] = [];
  entries: JournalEntryItem[] = [];
  availableAccounts: CompanyAccountOption[] = [];

  lines: JournalEntryLineForm[] = [
    this.createEmptyLine(),
    this.createEmptyLine()
  ];

  loading = false;
  loadingEntries = false;
  loadingAccounts = false;
  loadingPdf = false;
  deletingId: number | null = null;
  editingEntryId: number | null = null;

  successMsg = '';
  errorMsg = '';
  warningMsg = '';
  validationMessages: string[] = [];

  accountingPeriod: AccountingPeriod | null = null;
  accountingPeriodYear: number | null = null;
  accountingPeriodStatus = '';

  cashAccountCode = '1010101';
  currentCashBalance = 0;

  ngOnInit(): void {
    const companyIdFromStorage =
      localStorage.getItem('company_id') ||
      localStorage.getItem('selected_company_id') ||
      localStorage.getItem('active_company_id');

    this.companyId = Number(companyIdFromStorage || '0');
    this.entryDate = this.getTodayLocalDate();

    if (this.companyId > 0) {
      this.loadEntryTypes();
      this.loadEntries();
      this.loadAccounts();
      this.loadCashBalance();
      this.loadAccountingPeriod();
    } else {
      this.errorMsg = 'No hay empresa seleccionada.';
    }
  }

  private createEmptyLine(): JournalEntryLineForm {
    return {
      account_id: null,
      account_search: '',
      account_code: '',
      account_name: '',
      description: '',
      debit: null,
      credit: null
    };
  }

  private getTodayLocalDate(): string {
    const now = new Date();
    return now.toISOString().substring(0, 10);
  }

  toNumber(value: any): number {
    return Number(value ?? 0) || 0;
  }

  private roundAmount(value: number): number {
    return Math.round((Number(value) || 0) * 100) / 100;
  }

  formatAmountInput(value: number | null): string {
    const amount = this.toNumber(value);
    return amount > 0 ? '$ ' + formatInteger(amount) : '';
  }

  onDebitAmountInput(index: number, value: string): void {
    const amount = parseFormattedInteger(value);
    this.lines[index].debit = amount > 0 ? amount : null;
    if (amount > 0) {
      this.lines[index].credit = null;
    }
    this.clearValidationState();
  }

  onCreditAmountInput(index: number, value: string): void {
    const amount = parseFormattedInteger(value);
    this.lines[index].credit = amount > 0 ? amount : null;
    if (amount > 0) {
      this.lines[index].debit = null;
    }
    this.clearValidationState();
  }

  private clearValidationState(): void {
    this.errorMsg = '';
    this.successMsg = '';
    this.validationMessages = [];
  }

  private logTechnicalError(context: string, error: any, extra: Record<string, unknown> = {}): void {
    console.error('[ERP][Asientos]', {
      context,
      companyId: this.companyId,
      editingEntryId: this.editingEntryId,
      entryDate: this.entryDate,
      entryType: this.entryType,
      extra,
      error
    });
  }

  private formatAccountOption(account: CompanyAccountOption): string {
    return `${account.code} - ${account.name}`;
  }

  private formatPdfAmount(value: number): string {
    return '$ ' + this.toNumber(value).toLocaleString('es-CL');
  }

  loadAccounts(): void {
    if (!this.companyId) return;

    this.loadingAccounts = true;

    this.accountsService.getAccounts(this.companyId).subscribe({
      next: (accounts: Account[]) => {
        this.availableAccounts = (accounts || [])
          .filter(a => Number(a.is_active) === 1 && Number(a.allows_entries) === 1)
          .map(a => ({
            id: a.id,
            code: a.code,
            name: a.name
          }));

        this.loadingAccounts = false;
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        this.logTechnicalError('Error cargando cuentas', error);
        this.availableAccounts = [];
        this.loadingAccounts = false;
        this.errorMsg = 'No se pudieron cargar las cuentas.';
        this.cdr.detectChanges();
      }
    });
  }

  loadAccountingPeriod(): void {
    if (!this.companyId) return;

    this.configurationService.getAccountingPeriod(this.companyId).subscribe({
      next: (period) => {
        this.accountingPeriod = period;
        this.accountingPeriodYear = period ? Number(period.year_num) : null;
        this.accountingPeriodStatus = period?.status || '';
        this.updatePeriodWarning();
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        this.logTechnicalError('Error cargando período contable', error);
        this.accountingPeriod = null;
        this.accountingPeriodYear = null;
        this.accountingPeriodStatus = '';
        this.warningMsg = 'No se pudo verificar el período contable activo.';
        this.cdr.detectChanges();
      }
    });
  }

  updatePeriodWarning(): void {
    const entryYear = this.entryDate ? Number(this.entryDate.substring(0, 4)) : null;

    if (!this.entryDate || !this.accountingPeriodYear) {
      this.warningMsg = '';
      return;
    }

    if (this.accountingPeriodStatus === 'CLOSED') {
      this.warningMsg = `El período contable ${this.accountingPeriodYear} está cerrado. No deberías ingresar asientos sin reabrirlo.`;
      return;
    }

    if (entryYear && entryYear !== this.accountingPeriodYear) {
      this.warningMsg = `La fecha del asiento pertenece al año ${entryYear}, pero el período activo es ${this.accountingPeriodYear}.`;
      return;
    }

    this.warningMsg = '';
  }

  loadCashBalance(): void {
    if (!this.companyId) return;

    this.service.getCashBalance(this.companyId).subscribe({
      next: (res) => {
        this.currentCashBalance = Number(res?.saldo || 0);
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        this.logTechnicalError('Error cargando saldo de caja', error);
        this.currentCashBalance = 0;
        this.cdr.detectChanges();
      }
    });
  }

  onAccountSearchChange(index: number): void {
    const line = this.lines[index];
    const value = (line.account_search || '').trim().toLowerCase();

    if (!value) {
      line.account_id = null;
      line.account_code = '';
      line.account_name = '';
      return;
    }

    const exactMatch = this.availableAccounts.find((account) => {
      const full = this.formatAccountOption(account).toLowerCase();
      return (
        full === value ||
        account.code.toLowerCase() === value ||
        account.name.toLowerCase() === value
      );
    });

    if (exactMatch) {
      line.account_id = exactMatch.id;
      line.account_code = exactMatch.code;
      line.account_name = exactMatch.name;
      line.account_search = this.formatAccountOption(exactMatch);
      return;
    }

    const partialMatch = this.availableAccounts.find((account) => {
      return (
        account.code.toLowerCase().includes(value) ||
        account.name.toLowerCase().includes(value)
      );
    });

    if (partialMatch) {
      line.account_id = partialMatch.id;
      line.account_code = partialMatch.code;
      line.account_name = partialMatch.name;
      return;
    }

    line.account_id = null;
    line.account_code = '';
    line.account_name = '';
  }

  selectAccount(index: number, account: CompanyAccountOption): void {
    const line = this.lines[index];
    line.account_id = account.id;
    line.account_code = account.code;
    line.account_name = account.name;
    line.account_search = this.formatAccountOption(account);
  }

  loadEntryTypes(): void {
    this.service.getEntryTypes().subscribe({
      next: (res) => {
        const rows = Array.isArray(res) ? [...res] : [];
        this.entryTypes = rows;
        this.entryType = rows.length > 0 ? rows[0].code : '';
        this.cdr.detectChanges();
      },
      error: (error: any) => {
        this.logTechnicalError('Error cargando tipos de asiento', error);
        this.entryTypes = [];
        this.entryType = '';
        this.errorMsg = 'No se pudieron cargar los tipos de asiento.';
        this.cdr.detectChanges();
      }
    });
  }

  loadEntries(): void {
    if (!this.companyId) return;

    this.loadingEntries = true;

    this.service.getEntries(this.companyId).subscribe({
      next: (res) => {
        this.entries = res || [];
        this.loadingEntries = false;
      },
      error: (error: any) => {
        this.logTechnicalError('Error cargando asientos', error);
        this.loadingEntries = false;
      }
    });
  }

  addLine(): void {
    this.lines.push(this.createEmptyLine());
  }

  removeLine(index: number): void {
    if (this.lines.length <= 2) return;
    this.lines.splice(index, 1);
  }

  onDebitChange(i: number): void {
    if (this.lines[i].debit) {
      this.lines[i].credit = null;
    }
    this.clearValidationState();
  }

  onCreditChange(i: number): void {
    if (this.lines[i].credit) {
      this.lines[i].debit = null;
    }
    this.clearValidationState();
  }

  get totalDebit(): number {
    return this.lines.reduce((s, l) => s + this.toNumber(l.debit), 0);
  }

  get totalCredit(): number {
    return this.lines.reduce((s, l) => s + this.toNumber(l.credit), 0);
  }

  get difference(): number {
    return this.roundAmount(this.totalDebit - this.totalCredit);
  }

  get cashDraftImpact(): number {
    return this.lines.reduce((sum, l) => {
      if (l.account_code !== this.cashAccountCode) return sum;
      return sum + this.toNumber(l.debit) - this.toNumber(l.credit);
    }, 0);
  }

  get cashDraftImpactAbs(): number {
    return Math.abs(this.cashDraftImpact);
  }

  get cashDraftImpactText(): string {
    const sign = this.cashDraftImpact >= 0 ? '+' : '-';
    return `${sign}$ ${this.formatMoney(this.cashDraftImpactAbs)}`;
  }

  get projectedCashBalance(): number {
    return this.currentCashBalance + this.cashDraftImpact;
  }

  get cashImpactClass(): string {
    if (this.cashDraftImpact > 0) return 'positive';
    if (this.cashDraftImpact < 0) return 'negative';
    return 'neutral';
  }

  get cashImpactLabel(): string {
    if (this.cashDraftImpact > 0) return 'La caja aumenta.';
    if (this.cashDraftImpact < 0) return 'La caja disminuye.';
    return 'No afecta caja.';
  }

  formatMoney(value: number): string {
    return new Intl.NumberFormat('es-CL').format(value);
  }

  resetForm(): void {
    this.editingEntryId = null;
    this.entryDate = this.getTodayLocalDate();
    this.description = '';
    this.copyUntilDecember = false;
    this.successMsg = '';
    this.errorMsg = '';
    this.warningMsg = '';
    this.validationMessages = [];
    this.entryType = this.entryTypes.length > 0 ? this.entryTypes[0].code : '';
    this.lines = [
      this.createEmptyLine(),
      this.createEmptyLine()
    ];
  }

  editEntry(entry: JournalEntryItem): void {
    this.errorMsg = '';
    this.successMsg = '';
    this.validationMessages = [];

    this.service.getEntryById(entry.id).subscribe({
      next: (res: any) => {
        this.editingEntryId = res.id;
        this.entryDate = res.entry_date?.substring(0, 10) || '';
        this.entryType = res.entry_type || '';
        this.description = res.description || '';
        this.copyUntilDecember = false;

        this.lines = (res.lines || []).map((line: any) => ({
          account_id: line.account_id,
          account_search: line.account_code && line.account_name
            ? `${line.account_code} - ${line.account_name}`
            : '',
          account_code: line.account_code || '',
          account_name: line.account_name || '',
          description: line.description || '',
          debit: Number(line.debit || 0) > 0 ? Number(line.debit) : null,
          credit: Number(line.credit || 0) > 0 ? Number(line.credit) : null
        }));

        while (this.lines.length < 2) {
          this.lines.push(this.createEmptyLine());
        }

        window.scrollTo({ top: 0, behavior: 'smooth' });
      },
      error: (error: any) => {
        this.logTechnicalError('Error cargando asiento para editar', error, { entryId: entry.id });
        this.errorMsg = error?.error?.message || 'No se pudo cargar el asiento.';
      }
    });
  }

  private validateEntryBeforeSave(): JournalEntryLineForm[] | null {
    this.validationMessages = [];
    this.updatePeriodWarning();

    if (!this.companyId) {
      this.validationMessages.push('No hay empresa seleccionada.');
    }

    if (!this.entryDate) {
      this.validationMessages.push('La fecha es obligatoria.');
    }

    if (this.accountingPeriodYear && this.entryDate) {
      const entryYear = Number(this.entryDate.substring(0, 4));

      if (this.accountingPeriodStatus === 'CLOSED') {
        this.validationMessages.push(`El período contable ${this.accountingPeriodYear} está cerrado.`);
      }

      if (entryYear !== this.accountingPeriodYear) {
        this.validationMessages.push(`La fecha del asiento no corresponde al período activo ${this.accountingPeriodYear}.`);
      }
    }

    if (!this.entryType) {
      this.validationMessages.push('El tipo de asiento es obligatorio.');
    }

    if (!String(this.description || '').trim()) {
      this.validationMessages.push('La glosa del asiento es obligatoria.');
    }

    this.lines.forEach((line, index) => {
      const debit = this.toNumber(line.debit);
      const credit = this.toNumber(line.credit);
      const hasAccountText = !!String(line.account_search || '').trim();
      const hasDescription = !!String(line.description || '').trim();
      const hasAnyData = !!line.account_id || hasAccountText || hasDescription || debit > 0 || credit > 0;

      if (!hasAnyData) {
        return;
      }

      if (!line.account_id) {
        this.validationMessages.push(`Línea ${index + 1}: selecciona una cuenta válida.`);
      }

      if (debit <= 0 && credit <= 0) {
        this.validationMessages.push(`Línea ${index + 1}: ingresa monto en Debe o Haber.`);
      }

      if (debit > 0 && credit > 0) {
        this.validationMessages.push(`Línea ${index + 1}: no puede tener Debe y Haber al mismo tiempo.`);
      }

      if (debit < 0 || credit < 0) {
        this.validationMessages.push(`Línea ${index + 1}: los montos no pueden ser negativos.`);
      }
    });

    const validLines = this.lines.filter((l) => {
      const debit = this.toNumber(l.debit);
      const credit = this.toNumber(l.credit);
      return l.account_id && (debit > 0 || credit > 0) && !(debit > 0 && credit > 0);
    });

    if (validLines.length < 2) {
      this.validationMessages.push('Debes ingresar al menos 2 líneas completas.');
    }

    if (this.totalDebit <= 0 || this.totalCredit <= 0) {
      this.validationMessages.push('El asiento debe tener total en Debe y total en Haber.');
    }

    if (this.roundAmount(this.totalDebit) !== this.roundAmount(this.totalCredit)) {
      this.validationMessages.push(`El asiento no está cuadrado. Diferencia: $ ${this.formatMoney(Math.abs(this.difference))}.`);
    }

    if (this.validationMessages.length) {
      this.errorMsg = 'No se pudo guardar el asiento. Revisa las validaciones.';
      return null;
    }

    return validLines;
  }

  saveEntry(): void {
    this.errorMsg = '';
    this.successMsg = '';
    this.validationMessages = [];

    const validLines = this.validateEntryBeforeSave();

    if (!validLines) {
      return;
    }

    const payload: JournalEntryPayload = {
      company_id: this.companyId,
      entry_date: this.entryDate,
      entry_type: this.entryType,
      description: String(this.description || '').trim(),
      copy_until_december: this.editingEntryId ? false : this.copyUntilDecember,
      lines: validLines.map((l) => ({
        account_id: l.account_id,
        description: String(l.description || '').trim(),
        debit: this.toNumber(l.debit),
        credit: this.toNumber(l.credit)
      }))
    };

    this.loading = true;

    const request$ = this.editingEntryId
      ? this.service.updateEntry(this.editingEntryId, payload)
      : this.service.createEntry(payload);

    request$.subscribe({
      next: () => {
        const wasEditing = !!this.editingEntryId;

        this.loading = false;
        this.errorMsg = '';

        this.resetForm();

        this.successMsg = wasEditing
          ? 'Asiento actualizado correctamente.'
          : 'Asiento guardado correctamente.';

        this.loadEntries();
        this.loadCashBalance();
        this.loadAccountingPeriod();
      },
      error: (error: any) => {
        this.logTechnicalError('Error guardando/actualizando asiento', error, { payload });
        this.loading = false;
        this.errorMsg = error?.error?.message || 'No se pudo guardar el asiento.';
      }
    });
  }

  deleteEntry(id: number): void {
    if (!confirm('¿Deseas anular este asiento?')) return;

    this.deletingId = id;
    this.errorMsg = '';
    this.successMsg = '';
    this.validationMessages = [];

    this.service.voidEntry(id).subscribe({
      next: () => {
        this.deletingId = null;
        this.successMsg = 'Asiento anulado correctamente.';
        this.loadEntries();
        this.loadCashBalance();
        this.loadAccountingPeriod();

        if (this.editingEntryId === id) {
          this.resetForm();
        }
      },
      error: (error: any) => {
        this.logTechnicalError('Error anulando asiento', error, { entryId: id });
        this.deletingId = null;
        this.errorMsg = error?.error?.message || 'No se pudo anular el asiento.';
      }
    });
  }

  exportEntryPdf(entry: JournalEntryItem): void {
    this.loadingPdf = true;
    this.errorMsg = '';
    this.successMsg = '';
    this.validationMessages = [];

    this.service.getEntryById(entry.id).subscribe({
      next: (res: any) => {
        const detailLines: JournalEntryDetail[] = res?.lines || [];

        const doc = new jsPDF();

        doc.setFontSize(16);
        doc.text('Asiento Contable', 14, 15);

        doc.setFontSize(10);
        doc.text(`ID: ${entry.id}`, 14, 25);
        doc.text(`Fecha: ${entry.entry_date}`, 14, 31);
        doc.text(`Tipo: ${entry.entry_type}`, 14, 37);
        doc.text(`Glosa: ${entry.description || ''}`, 14, 43);

        const generalDescription = entry.description || '';

        const body = detailLines.map((line) => [
          line.account_code || '',
          line.account_name || '',
          (line.description && line.description.trim()) || generalDescription,
          this.formatPdfAmount(line.debit),
          this.formatPdfAmount(line.credit)
        ]);

        autoTable(doc, {
          startY: 50,
          head: [['Código', 'Cuenta', 'Descripción', 'Debe', 'Haber']],
          body,
          styles: {
            fontSize: 9
          },
          headStyles: {
            fontSize: 9
          }
        });

        const totalDebe = detailLines.reduce(
          (sum, line) => sum + this.toNumber(line.debit),
          0
        );

        const totalHaber = detailLines.reduce(
          (sum, line) => sum + this.toNumber(line.credit),
          0
        );

        const finalY = (doc as any).lastAutoTable?.finalY || 80;

        doc.setFontSize(10);
        doc.text(`Total Debe: ${this.formatPdfAmount(totalDebe)}`, 14, finalY + 10);
        doc.text(`Total Haber: ${this.formatPdfAmount(totalHaber)}`, 14, finalY + 16);

        doc.save(`asiento_${entry.id}_${entry.entry_date}.pdf`);
        this.loadingPdf = false;
      },
      error: (error: any) => {
        this.logTechnicalError('Error generando PDF', error, { entryId: entry.id });
        this.loadingPdf = false;
        this.errorMsg = 'No se pudo generar el PDF del asiento.';
      }
    });
  }

  formatDate(d: string): string {
    return d?.substring(0, 10) || '';
  }

  goBack(): void {
    this.router.navigate(['/contabilidad']);
  }

  trackByIndex(index: number): number {
    return index;
  }
}
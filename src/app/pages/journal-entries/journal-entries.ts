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
  saldoCaja = 1000000; // temporal, después vendrá desde backend

  form = {
    entry_date: this.getToday(),
    description: '',
    entry_type: 'MANUAL'
  };

  lines: Array<{
    account_id: number | null;
    account_code?: string;
    description: string;
    debit: number;
    credit: number;
  }> = [
    {
      account_id: null,
      account_code: '',
      description: '',
      debit: 0,
      credit: 0
    }
  ];

  constructor(
    private auth: AuthMaster,
    private journalEntriesService: JournalEntriesService,
    private accountsService: AccountsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('🚀 JOURNAL ENTRIES NGONINIT');

    const company = this.auth.getSelectedCompany();

    if (!company || !company.id) {
      console.error('❌ No hay empresa seleccionada');
      this.error = 'Debes seleccionar una empresa primero';
      return;
    }

    this.companyName = company.name || '';
    console.log('🏢 EMPRESA ACTIVA EN ASIENTOS =>', company);

    this.loadAccounts(Number(company.id));
    this.loadJournalEntries(Number(company.id));
  }

  getToday(): string {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  loadAccounts(companyId: number): void {
    console.log('📡 CARGANDO CUENTAS PARA EMPRESA =>', companyId);

    this.accountsService.getAccounts(companyId).subscribe({
      next: (rows: Account[]) => {
        console.log('✅ CUENTAS RECIBIDAS RAW =>', rows);

        this.accounts = [];
        this.cdr.detectChanges();

        setTimeout(() => {
          this.accounts = Array.isArray(rows) ? rows : [];

          console.log('✅ CUENTAS CARGADAS EN SELECT =>', this.accounts);

          if (this.accounts.length === 0) {
            console.warn('⚠️ NO HAY CUENTAS DISPONIBLES PARA ESTA EMPRESA');
          }

          this.cdr.detectChanges();
        }, 0);
      },
      error: (err: any) => {
        console.error('❌ ERROR CARGANDO CUENTAS PARA ASIENTOS =>', err);
        this.error = 'No se pudieron cargar las cuentas';
        this.cdr.detectChanges();
      }
    });
  }

  loadJournalEntries(companyId: number): void {
    console.log('📡 CARGANDO ASIENTOS PARA EMPRESA =>', companyId);

    this.loading = true;
    this.error = '';

    this.journalEntriesService.getJournalEntries(companyId).subscribe({
      next: (rows: any[]) => {
        console.log('✅ ASIENTOS RECIBIDOS =>', rows);
        this.entries = Array.isArray(rows) ? rows : [];
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('❌ ERROR CARGANDO ASIENTOS =>', err);
        this.loading = false;
        this.error = 'No se pudieron cargar los asientos';
        this.cdr.detectChanges();
      }
    });
  }

  addLine(): void {
    this.lines.push({
      account_id: null,
      account_code: '',
      description: '',
      debit: 0,
      credit: 0
    });
  }

  removeLine(index: number): void {
    if (this.lines.length === 1) {
      return;
    }
    this.lines.splice(index, 1);
  }

  onAccountChange(line: any): void {
    const cuenta = this.accounts.find(a => a.id == line.account_id);
    line.account_code = cuenta ? cuenta.code : '';
  }

  onDebitChange(index: number): void {
    const line = this.lines[index];
    if (Number(line.debit) > 0) {
      line.credit = 0;
    }
  }

  onCreditChange(index: number): void {
    const line = this.lines[index];
    if (Number(line.credit) > 0) {
      line.debit = 0;
    }
  }

  get totalDebit(): number {
    return this.lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
  }

  get totalCredit(): number {
    return this.lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
  }

  get difference(): number {
    return this.totalDebit - this.totalCredit;
  }

  get impactoCaja(): number {
    let impacto = 0;

    for (const line of this.lines) {
      const codigo = String(line.account_code || '').trim();
      const debe = Number(line.debit || 0);
      const haber = Number(line.credit || 0);

      if (codigo === this.codigoCuentaCaja) {
        impacto += debe;
        impacto -= haber;
      }
    }

    return impacto;
  }

  get cajaProyectada(): number {
    return this.saldoCaja + this.impactoCaja;
  }

  get canSave(): boolean {
    const hasDescription = this.form.description.trim().length > 0;
    const hasValidLines = this.lines.every(line =>
      line.account_id &&
      (
        (Number(line.debit) > 0 && Number(line.credit) === 0) ||
        (Number(line.credit) > 0 && Number(line.debit) === 0)
      )
    );

    return hasDescription && hasValidLines && this.totalDebit > 0 && this.totalDebit === this.totalCredit;
  }

  saveEntry(): void {
    const company = this.auth.getSelectedCompany();

    if (!company || !company.id) {
      this.error = 'Debes seleccionar una empresa primero';
      return;
    }

    if (!this.canSave) {
      this.error = 'El asiento debe tener glosa, líneas válidas y cuadrar Debe = Haber';
      return;
    }

    this.saving = true;
    this.error = '';
    this.success = '';

    const payload = {
      company_id: Number(company.id),
      entry_date: this.form.entry_date,
      entry_type: this.form.entry_type,
      description: this.form.description.trim(),
      lines: this.lines.map(line => ({
        account_id: Number(line.account_id),
        description: line.description || '',
        debit: Number(line.debit || 0),
        credit: Number(line.credit || 0)
      }))
    };

    console.log('📤 PAYLOAD ASIENTO =>', payload);

    this.journalEntriesService.createJournalEntry(payload).subscribe({
      next: (resp: any) => {
        console.log('✅ ASIENTO GUARDADO =>', resp);

        this.success = 'Asiento guardado correctamente';
        this.saving = false;

        this.form = {
          entry_date: this.getToday(),
          description: '',
          entry_type: 'MANUAL'
        };

        this.lines = [
          {
            account_id: null,
            account_code: '',
            description: '',
            debit: 0,
            credit: 0
          }
        ];

        this.loadAccounts(Number(company.id));
        this.loadJournalEntries(Number(company.id));
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('❌ ERROR GUARDANDO ASIENTO =>', err);
        this.saving = false;
        this.error = err?.error?.message || 'No se pudo guardar el asiento';
        this.cdr.detectChanges();
      }
    });
  }
}
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountsService, Account } from '../../services/accounts.service';
import {
  JournalEntriesService,
  JournalEntryPayload
} from '../../services/journal-entries.service';

interface EntryLineForm {
  account_id: number | null;
  description: string;
  debit: number | null;
  credit: number | null;
}

@Component({
  selector: 'app-journal-entries',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './journal-entries.html',
  styleUrls: ['./journal-entries.scss']
})
export class JournalEntriesComponent implements OnInit {
  private accountsService = inject(AccountsService);
  private journalEntriesService = inject(JournalEntriesService);

  companyId = 5;

  accounts: Account[] = [];

  entryDate = this.getToday();
  entryType = 'DIARIO';
  description = '';

  lines = signal<EntryLineForm[]>([
    { account_id: null, description: '', debit: null, credit: null },
    { account_id: null, description: '', debit: null, credit: null }
  ]);

  totalDebit = computed(() =>
    this.lines().reduce((sum, line) => sum + Number(line.debit || 0), 0)
  );

  totalCredit = computed(() =>
    this.lines().reduce((sum, line) => sum + Number(line.credit || 0), 0)
  );

  difference = computed(() =>
    Number((this.totalDebit() - this.totalCredit()).toFixed(2))
  );

  ngOnInit(): void {
    this.loadAccounts();
  }

  loadAccounts(): void {
    this.accountsService.getByCompany(this.companyId).subscribe({
      next: (data) => {
        this.accounts = data.filter(a => a.is_active === 1 && a.allows_entries === 1);
      },
      error: (err) => {
        console.error('ERROR LOAD ACCOUNTS:', err);
        alert(err?.error?.message || 'Error al cargar cuentas');
      }
    });
  }

  addLine(): void {
    this.lines.update(current => [
      ...current,
      { account_id: null, description: '', debit: null, credit: null }
    ]);
  }

  removeLine(index: number): void {
    this.lines.update(current => {
      if (current.length <= 2) {
        return current;
      }
      return current.filter((_, i) => i !== index);
    });
  }

  updateLine<K extends keyof EntryLineForm>(index: number, field: K, value: EntryLineForm[K]): void {
    this.lines.update(current =>
      current.map((line, i) => {
        if (i !== index) return line;

        const updated = { ...line, [field]: value };

        if (field === 'debit' && Number(value || 0) > 0) {
          updated.credit = null;
        }

        if (field === 'credit' && Number(value || 0) > 0) {
          updated.debit = null;
        }

        return updated;
      })
    );
  }

  saveEntry(): void {
    const cleanLines = this.lines()
      .map(line => ({
        account_id: line.account_id,
        description: line.description?.trim() || '',
        debit: Number(line.debit || 0),
        credit: Number(line.credit || 0)
      }))
      .filter(line => line.account_id && (line.debit > 0 || line.credit > 0));

    if (!this.entryDate || !this.entryType) {
      alert('Fecha y tipo de comprobante son obligatorios');
      return;
    }

    if (!this.description.trim()) {
      alert('La glosa es obligatoria');
      return;
    }

    if (cleanLines.length < 2) {
      alert('Debes ingresar al menos 2 líneas válidas');
      return;
    }

    if (this.totalDebit() <= 0 || this.totalCredit() <= 0) {
      alert('Debe y Haber deben tener valores mayores a 0');
      return;
    }

    if (this.difference() !== 0) {
      alert('El asiento no cuadra. Total Debe debe ser igual a Total Haber');
      return;
    }

    const payload: JournalEntryPayload = {
      company_id: this.companyId,
      entry_date: this.entryDate,
      entry_type: this.entryType,
      description: this.description.trim(),
      lines: cleanLines
    };

    this.journalEntriesService.create(payload).subscribe({
      next: () => {
        alert('Asiento creado correctamente');
        this.resetForm();
      },
      error: (err) => {
        console.error('ERROR CREATE ENTRY:', err);
        alert(err?.error?.message || 'Error al guardar asiento');
      }
    });
  }

  resetForm(): void {
    this.entryDate = this.getToday();
    this.entryType = 'DIARIO';
    this.description = '';
    this.lines.set([
      { account_id: null, description: '', debit: null, credit: null },
      { account_id: null, description: '', debit: null, credit: null }
    ]);
  }

  private getToday(): string {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
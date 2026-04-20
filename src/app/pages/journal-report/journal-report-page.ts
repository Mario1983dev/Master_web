import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  JournalEntriesService,
  JournalReportRow
} from '../../services/journal-entries.service';
import { AuthMaster } from '../../services/auth-master';

@Component({
  selector: 'app-journal-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './journal-report.html',
  styleUrls: ['./journal-report.scss']
})
export class JournalReport implements OnInit {
  private journalService = inject(JournalEntriesService);
  private auth = inject(AuthMaster);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  rows: JournalReportRow[] = [];
  loading = false;
  errorMsg = '';

  fromDate = '';
  toDate = '';
  companyName = '';
  companyId: number | null = null;

 ngOnInit(): void {
  this.setCurrentMonthDates();
  this.loadSelectedCompany();

  if (this.companyId) {
    this.loadReport();
  }
}

  setCurrentMonthDates(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    this.fromDate = this.formatDate(firstDay);
    this.toDate = this.formatDate(lastDay);
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  loadSelectedCompany(): void {
    const company = this.auth.getSelectedCompany();

    if (!company || !company.id) {
      this.companyId = null;
      this.companyName = '';
      this.errorMsg = 'No hay empresa seleccionada.';
      return;
    }

    this.companyId = Number(company.id);
    this.companyName =
      String(company.name || '').trim() ||
      String(company.legal_name || '').trim() ||
      String(company.label || '').trim() ||
      `Empresa #${company.id}`;

    this.errorMsg = '';
  }

  loadReport(): void {
  console.log('LOAD REPORT');
  console.log('companyId:', this.companyId);
  console.log('fromDate:', this.fromDate);
  console.log('toDate:', this.toDate);
   if (!this.companyId) {
  console.warn('NO HAY COMPANY ID');
  this.rows = [];
  this.loading = false;
  this.cdr.detectChanges();
  return;
}

    this.loading = true;
    this.errorMsg = '';
    this.rows = [];
    this.cdr.detectChanges();

    this.journalService
      .getJournalReport(this.companyId, this.fromDate, this.toDate)
      .subscribe({
        next: (data: any[]) => {
          this.rows = Array.isArray(data) ? data : [];
          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (error: any) => {
          console.error('ERROR REPORT:', error);
          this.errorMsg = 'No se pudo cargar el libro diario.';
          this.rows = [];
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  search(): void {
    this.loadReport();
  }

  goBack(): void {
    this.router.navigate(['/office/dashboard']);
  }

  exportPdf(): void {
    if (!this.groupedEntries.length) {
      alert('No hay datos para exportar.');
      return;
    }

    const doc = new jsPDF();
    let currentY = 15;

    doc.setFontSize(18);
    doc.text('Libro Diario', 14, currentY);

    currentY += 8;
    doc.setFontSize(11);
    doc.text(`Empresa: ${this.companyName}`, 14, currentY);

    currentY += 6;
    doc.text(`Desde: ${this.fromDate}`, 14, currentY);
    doc.text(`Hasta: ${this.toDate}`, 80, currentY);

    currentY += 10;

    this.groupedEntries.forEach((entry: any, index: number) => {
      if (currentY > 250) {
        doc.addPage();
        currentY = 15;
      }

      doc.setFontSize(11);
      doc.text(`Fecha: ${this.formatDisplayDate(entry.entry_date)}`, 14, currentY);

      currentY += 6;
      doc.text(`Tipo: ${entry.entry_type}`, 14, currentY);

      currentY += 6;
      doc.text(`Glosa: ${entry.description || '-'}`, 14, currentY);

      currentY += 4;

      autoTable(doc, {
        startY: currentY,
        head: [['Código', 'Cuenta', 'Descripción', 'Debe', 'Haber']],
        body: entry.lines.map((line: any) => [
          line.account_code || '',
          line.account_name || '',
          line.line_description || '',
          this.formatNumber(line.debit),
          this.formatNumber(line.credit)
        ]),
        styles: { fontSize: 9 },
        headStyles: { fontSize: 9 },
        margin: { left: 14, right: 14 }
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;

      if (index < this.groupedEntries.length - 1 && currentY > 240) {
        doc.addPage();
        currentY = 15;
      }
    });

    doc.save(`libro-diario-${this.fromDate}-${this.toDate}.pdf`);
  }

  formatDisplayDate(dateValue: string): string {
    if (!dateValue) return '';
    const datePart = String(dateValue).substring(0, 10);
    const [year, month, day] = datePart.split('-');
    return `${day}-${month}-${year}`;
  }

  formatNumber(value: number): string {
    return Number(value || 0).toLocaleString('es-CL');
  }

  get groupedEntries(): any[] {
    const map = new Map<number, any>();

    for (const row of this.rows) {
      if (!map.has(row.id)) {
        map.set(row.id, {
          id: row.id,
          entry_date: row.entry_date,
          entry_type: row.entry_type,
          description: row.description,
          lines: []
        });
      }

      map.get(row.id).lines.push({
        line_id: row.line_id,
        line_description: row.line_description,
        debit: row.debit,
        credit: row.credit,
        account_code: row.account_code,
        account_name: row.account_name
      });
    }

    return Array.from(map.values());
  }
}
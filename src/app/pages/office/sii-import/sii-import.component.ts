import { CommonModule, Location } from '@angular/common';
import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { timeout } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-sii-import',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sii-import.component.html',
  styleUrls: ['./sii-import.component.scss']
})
export class SiiImportComponent {
  private http = inject(HttpClient);
  private location = inject(Location);
  private cdr = inject(ChangeDetectorRef);

  bookType = '';

  selectedFile: File | null = null;
  loading = false;
  importing = false;
  generatingEntries = false;

  message = '';
  error = '';

  previewRows: any[] = [];
  totalRows = 0;
  uploadedFile = '';
  libroCvId: number | null = null;

  objectKeys = Object.keys;

  onFileSelected(event: Event): void {
    this.resetResult();

    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) {
      this.selectedFile = null;
      this.cdr.detectChanges();
      return;
    }

    const fileName = file.name.toLowerCase();

    if (!fileName.endsWith('.csv')) {
      this.selectedFile = null;
      this.error = 'El archivo debe ser CSV.';
      input.value = '';
      this.cdr.detectChanges();
      return;
    }

    this.selectedFile = file;
    this.cdr.detectChanges();
  }

  uploadFile(): void {
    this.resetResult();

    if (!this.bookType) {
      this.error = 'Debes seleccionar si es Libro de Compras o Libro de Ventas.';
      this.cdr.detectChanges();
      return;
    }

    if (!this.selectedFile) {
      this.error = 'Debes seleccionar un archivo CSV primero.';
      this.cdr.detectChanges();
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile);
    formData.append('bookType', this.bookType);

    this.loading = true;
    this.cdr.detectChanges();

    this.http
      .post<any>(`${environment.apiUrl}/sii/upload`, formData)
      .pipe(timeout(15000))
      .subscribe({
        next: (res) => {
          console.log('RESPUESTA SII:', res);

          this.message = res?.message || 'CSV leído correctamente.';
          this.previewRows = Array.isArray(res?.preview) ? res.preview : [];
          this.totalRows = Number(res?.totalRows ?? this.previewRows.length);
          this.uploadedFile = res?.file || this.selectedFile?.name || '';

          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('ERROR SII:', err);

          this.error =
            err?.error?.message ||
            'El archivo no respondió a tiempo o no se pudo procesar.';

          this.loading = false;
          this.cdr.detectChanges();
        }
      });
  }

  importToERP(): void {
    this.error = '';
    this.message = '';

    if (!this.bookType) {
      this.error = 'Debes seleccionar si es Libro de Compras o Libro de Ventas.';
      this.cdr.detectChanges();
      return;
    }

    if (!this.previewRows.length) {
      this.error = 'Primero debes validar el archivo antes de importarlo.';
      this.cdr.detectChanges();
      return;
    }

    const companyId = Number(localStorage.getItem('company_id'));

    if (!companyId) {
      this.error = 'Debes seleccionar una empresa antes de importar.';
      this.cdr.detectChanges();
      return;
    }

    const payload = {
      company_id: companyId,
      bookType: this.bookType,
      fileName: this.uploadedFile || this.selectedFile?.name || '',
      totalRows: this.totalRows,
      rows: this.previewRows
    };

    this.importing = true;
    this.cdr.detectChanges();

    this.http
      .post<any>(`${environment.apiUrl}/sii/import`, payload)
      .pipe(timeout(15000))
      .subscribe({
        next: (res) => {
          console.log('IMPORTACIÓN SII:', res);

          this.libroCvId = Number(res?.libroCvId || 0) || null;

          this.message =
            res?.message ||
            'Libro importado correctamente al ERP.';

          this.importing = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('ERROR IMPORTANDO SII:', err);

          this.error =
            err?.error?.message ||
            'No se pudo importar el libro al ERP.';

          this.importing = false;
          this.cdr.detectChanges();
        }
      });
  }

  generateEntries(): void {
    this.error = '';
    this.message = '';

    if (!this.libroCvId) {
      this.error = 'Primero debes importar el libro al ERP.';
      this.cdr.detectChanges();
      return;
    }

    this.generatingEntries = true;
    this.cdr.detectChanges();

    this.http
      .post<any>(
        `${environment.apiUrl}/sii/generate-entries/${this.libroCvId}`,
        {}
      )
      .pipe(timeout(15000))
      .subscribe({
        next: (res) => {
          console.log('ASIENTO GENERADO:', res);

          this.message =
            res?.message ||
            'Asiento generado correctamente.';

          this.generatingEntries = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('ERROR GENERANDO ASIENTO:', err);

          this.error =
            err?.error?.message ||
            'No se pudo generar el asiento automático.';

          this.generatingEntries = false;
          this.cdr.detectChanges();
        }
      });
  }

  resetResult(): void {
    this.message = '';
    this.error = '';
    this.previewRows = [];
    this.totalRows = 0;
    this.uploadedFile = '';
    this.libroCvId = null;
    this.generatingEntries = false;
  }

  goBack(): void {
    this.location.back();
  }

  trackByIndex(index: number): number {
    return index;
  }
}
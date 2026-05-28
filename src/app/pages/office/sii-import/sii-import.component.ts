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
  warning = '';
  validationMessages: string[] = [];

  previewRows: any[] = [];
  totalRows = 0;
  uploadedFile = '';
  libroCvId: number | null = null;

  objectKeys = Object.keys;

  private logTechnicalError(context: string, error: any, extra: Record<string, unknown> = {}): void {
    console.error('[ERP][Importador SII]', {
      context,
      bookType: this.bookType,
      fileName: this.selectedFile?.name || this.uploadedFile || '',
      totalRows: this.totalRows,
      libroCvId: this.libroCvId,
      extra,
      error
    });
  }

  private validateUploadInput(): boolean {
    this.validationMessages = [];

    if (!this.bookType) {
      this.validationMessages.push('Selecciona si el archivo corresponde a Compras o Ventas.');
    }

    if (!this.selectedFile) {
      this.validationMessages.push('Selecciona un archivo CSV antes de validar.');
    }

    if (this.selectedFile) {
      const fileName = this.selectedFile.name.toLowerCase();

      if (!fileName.endsWith('.csv')) {
        this.validationMessages.push('El archivo debe tener extensión .csv.');
      }

      if (this.selectedFile.size <= 0) {
        this.validationMessages.push('El archivo está vacío.');
      }

      if (this.selectedFile.size > 8 * 1024 * 1024) {
        this.validationMessages.push('El archivo supera 8 MB. Divide el CSV o revisa el origen.');
      }
    }

    if (this.validationMessages.length) {
      this.error = 'No se pudo validar el archivo. Revisa los datos.';
      return false;
    }

    return true;
  }

  private validateImportInput(): boolean {
    this.validationMessages = [];

    if (!this.bookType) {
      this.validationMessages.push('Debes seleccionar si es Libro de Compras o Libro de Ventas.');
    }

    if (!this.previewRows.length) {
      this.validationMessages.push('Primero debes validar el archivo antes de importarlo.');
    }

    const companyId = Number(localStorage.getItem('company_id'));

    if (!companyId) {
      this.validationMessages.push('Debes seleccionar una empresa antes de importar.');
    }

    if (this.libroCvId) {
      this.validationMessages.push('Este archivo ya fue importado en esta sesión.');
    }

    if (this.validationMessages.length) {
      this.error = 'No se pudo importar el libro. Revisa las validaciones.';
      return false;
    }

    return true;
  }

  onFileSelected(event: Event): void {
    this.resetResult();
    this.warning = '';

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
    this.warning = 'Archivo seleccionado. Valídalo y revisa la vista previa antes de importar.';
    this.cdr.detectChanges();
  }

  uploadFile(): void {
    this.resetResult();

    if (!this.validateUploadInput()) {
      this.cdr.detectChanges();
      return;
    }

    const formData = new FormData();
    formData.append('file', this.selectedFile!);
    formData.append('bookType', this.bookType);

    this.loading = true;
    this.cdr.detectChanges();

    this.http
      .post<any>(`${environment.apiUrl}/sii/upload`, formData)
      .pipe(timeout(15000))
      .subscribe({
        next: (res) => {
          console.log('[ERP][Importador SII] Respuesta validación:', res);

          this.message = res?.message || 'CSV leído correctamente.';
          this.previewRows = Array.isArray(res?.preview) ? res.preview : [];
          this.totalRows = Number(res?.totalRows ?? this.previewRows.length);
          this.uploadedFile = res?.file || this.selectedFile?.name || '';
          this.warning = 'Revisa la vista previa antes de importar. Si ya importaste este libro antes, evita duplicarlo.';

          this.loading = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.logTechnicalError('Error validando CSV', err);

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

    if (!this.validateImportInput()) {
      this.cdr.detectChanges();
      return;
    }

    if (!confirm('¿Confirmas importar este libro al ERP? Revisa que no esté duplicado.')) {
      return;
    }

    const companyId = Number(localStorage.getItem('company_id'));

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
          console.log('[ERP][Importador SII] Importación:', res);

          this.libroCvId = Number(res?.libroCvId || 0) || null;

          this.message =
            res?.message ||
            'Libro importado correctamente al ERP.';
          this.warning = 'Importación realizada. Genera asientos solo si corresponde y evita duplicar registros ingresados manualmente.';

          this.importing = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.logTechnicalError('Error importando libro SII', err, { companyId });

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
          console.log('[ERP][Importador SII] Asiento generado:', res);

          this.message =
            res?.message ||
            'Asiento generado correctamente.';

          this.generatingEntries = false;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.logTechnicalError('Error generando asiento automático', err);

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
    this.warning = '';
    this.validationMessages = [];
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
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';
import { OfficesService } from '../../../services/offices.service';

@Component({
  selector: 'app-offices',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './offices.html',
  styleUrls: ['./offices.scss']
})
export class Offices implements OnInit {
  loading = false;
  errorMsg = '';
  offices: any[] = [];

  constructor(private officesSrv: OfficesService) {}

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.errorMsg = '';

    this.officesSrv.list()
      .pipe(finalize(() => (this.loading = false)))
      .subscribe({
        next: (rows: any) => {
          this.offices = Array.isArray(rows) ? rows : [];
        },
        error: (err) => {
          console.error('LOAD OFFICES ERROR:', err);

          // Si fue 304, lo reportamos explícito para que lo veas
          if (err?.status === 304) {
            this.errorMsg = 'El API respondió 304 (Not Modified). Hay caché/ETag activo en /offices.';
            return;
          }

          this.errorMsg = err?.error?.message ?? 'No se pudieron cargar las oficinas.';
        }
      });
  }
}
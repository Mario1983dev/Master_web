import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { OfficesService } from '../../../services/offices.service';

@Component({
  selector: 'app-offices',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './offices.html',
  styleUrls: ['./offices.scss']
})
export class Offices implements OnInit {

  loading = false;
  errorMsg = '';
  offices: any[] = [];

  constructor(
    private officesSrv: OfficesService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    this.load();
  }

  /* =========================================
     CARGAR OFICINAS
  ========================================= */
  load(): void {

    this.loading = true;
    this.errorMsg = '';
    this.offices = [];

    this.officesSrv.list().subscribe({

      next: (resp: any) => {

        this.zone.run(() => {

          this.offices = Array.isArray(resp) ? resp : [];

          this.loading = false;
          this.cdr.detectChanges();

        });

      },

      error: (err: any) => {

        this.zone.run(() => {

          this.errorMsg = err?.error?.message || 'Error al cargar oficinas';
          this.offices = [];
          this.loading = false;

          this.cdr.detectChanges();

        });

      }

    });

  }


  /* =========================================
     ELIMINAR OFICINA
  ========================================= */
  deleteOffice(office: any): void {

    const ok = confirm(`¿Eliminar oficina "${office.name}"?`);

    if (!ok) return;

    this.loading = true;

    this.officesSrv.delete(office.id).subscribe({

      next: () => {

        alert('Oficina eliminada correctamente');

        this.load();

      },

      error: (err: any) => {

        console.error('DELETE ERROR', err);

        this.errorMsg = err?.error?.message || 'Error eliminando oficina';

        this.loading = false;

      }

    });

  }

}
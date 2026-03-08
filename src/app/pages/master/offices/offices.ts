import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
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
    private router: Router,
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
     NUEVA OFICINA
  ========================================= */
  newOffice(): void {
    this.router.navigate(['/master/offices/new']);
  }

  /* =========================================
     EDITAR OFICINA
  ========================================= */
  editOffice(office: any): void {
    this.router.navigate(['/master/offices/edit', office.id]);
  }

  /* =========================================
     CAMBIAR ESTADO
  ========================================= */
  toggleOfficeStatus(office: any): void {
    const currentStatus = Number(office.status);
    const newStatus = currentStatus === 1 ? 0 : 1;

    console.log('Oficina:', office);
    console.log('Estado actual:', currentStatus);
    console.log('Nuevo estado:', newStatus);

    this.officesSrv.changeStatus(office.id, newStatus).subscribe({
      next: (resp) => {
        console.log('Respuesta cambio estado:', resp);
        this.load();
      },
      error: (err) => {
        console.error('Error al cambiar estado:', err);
        alert('No se pudo cambiar el estado');
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
import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OfficesService } from '../../../services/offices.service';

@Component({
  selector: 'app-offices-new',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './offices-new.html',
  styleUrls: ['./offices-new.scss']
})
export class OfficesNew implements OnInit {
  loading = false;
  errorMsg = '';
  isEdit = false;
  officeId = 0;

  form: any = {
    rut: '',
    name: '',
    legal_name: '',
    email: '',
    phone: '',
    status: 1
  };

  constructor(
    private officesSrv: OfficesService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private zone: NgZone
  ) {}

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    console.log('ROUTE ID:', id);

    if (id) {
      this.isEdit = true;
      this.officeId = id;
      this.loadOffice(id);
    }
  }

  loadOffice(id: number): void {
    this.loading = true;
    this.errorMsg = '';

    console.log('LOAD OFFICE ID:', id);

    this.officesSrv.getById(id).subscribe({
      next: (resp: any) => {
        console.log('GET OFFICE RESPONSE:', resp);

        const office = resp?.data || resp;

        this.zone.run(() => {
          this.form.rut = String(office?.rut ?? '');
          this.form.name = String(office?.name ?? '');
          this.form.legal_name = String(office?.legal_name ?? '');
          this.form.email = String(office?.email ?? '');
          this.form.phone = String(office?.phone ?? '');
          this.form.status = Number(office?.status ?? 1);

          console.log('FORM CARGADO:', this.form);

          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => {
        console.error('GET OFFICE ERROR:', err);

        this.zone.run(() => {
          this.errorMsg = err?.error?.message || 'Error al cargar oficina';
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  save(): void {
    this.loading = true;
    this.errorMsg = '';

    if (this.isEdit) {
      console.log('UPDATE ID:', this.officeId);
      console.log('UPDATE PAYLOAD:', this.form);

      this.officesSrv.update(this.officeId, this.form).subscribe({
        next: () => {
          this.loading = false;
          alert('Oficina actualizada correctamente');
          this.router.navigate(['/master/offices']);
        },
        error: (err: any) => {
          console.error('UPDATE OFFICE ERROR:', err);
          this.errorMsg = err?.error?.message || 'Error al actualizar oficina';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.officesSrv.create(this.form).subscribe({
        next: (resp: any) => {
          this.loading = false;

          alert(
            'Oficina creada correctamente\n\n' +
            'Administrador de la oficina\n' +
            'Usuario: ' + (resp?.admin_user || 'N/D') + '\n' +
            'Clave temporal: ' + (resp?.temp_password || 'N/D') + '\n\n' +
            'Guarde esta información. La clave se muestra solo una vez.'
          );

          this.router.navigate(['/master/offices']);
        },
        error: (err: any) => {
          console.error('CREATE OFFICE ERROR:', err);
          this.errorMsg = err?.error?.message || 'Error al crear oficina';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/master/offices']);
  }
}
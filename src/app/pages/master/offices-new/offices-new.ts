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
    status: 1,

    admin_name: '',
    admin_email: '',
    admin_password: ''
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

    if (id) {
      this.isEdit = true;
      this.officeId = id;
      this.loadOffice(id);
    }
  }

  loadOffice(id: number): void {
    this.loading = true;
    this.errorMsg = '';

    this.officesSrv.getById(id).subscribe({
      next: (resp: any) => {
        const office = resp?.data || resp;

        this.zone.run(() => {
          this.form.rut = String(office?.rut ?? '');
          this.form.name = String(office?.name ?? '');
          this.form.legal_name = String(office?.legal_name ?? '');
          this.form.email = String(office?.email ?? '');
          this.form.phone = String(office?.phone ?? '');
          this.form.status = Number(office?.status ?? 1);

          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => {
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
      const officePayload = {
        rut: this.form.rut,
        name: this.form.name,
        legal_name: this.form.legal_name,
        email: this.form.email,
        phone: this.form.phone,
        status: this.form.status
      };

      this.officesSrv.update(this.officeId, officePayload).subscribe({
        next: () => {
          this.loading = false;
          alert('Oficina actualizada correctamente');
          this.router.navigate(['/master/offices']);
        },
        error: (err: any) => {
          this.errorMsg = err?.error?.message || 'Error al actualizar oficina';
          this.loading = false;
          this.cdr.detectChanges();
        }
      });

      return;
    }

    if (!this.form.admin_name?.trim()) {
      alert('El nombre del administrador es obligatorio');
      this.loading = false;
      return;
    }

    if (!this.form.admin_email?.trim()) {
      alert('El correo del administrador es obligatorio');
      this.loading = false;
      return;
    }

    if (!this.form.admin_password?.trim()) {
      alert('La contraseña del administrador es obligatoria');
      this.loading = false;
      return;
    }

    if (this.form.admin_password.trim().length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      this.loading = false;
      return;
    }

    this.officesSrv.create(this.form).subscribe({
      next: () => {
        this.loading = false;
        alert('Oficina y administrador creados correctamente');
        this.router.navigate(['/master/offices']);
      },
      error: (err: any) => {
        console.error('CREATE OFFICE + ADMIN ERROR:', err);
        this.errorMsg = err?.error?.message || 'Error al crear oficina y administrador';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/master/offices']);
  }
}
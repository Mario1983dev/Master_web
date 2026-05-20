import { Component, OnInit, ChangeDetectorRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OfficesService } from '../../../services/offices.service';
import {
  ValidationErrors,
  formatRut,
  isValidRut,
  isValidEmail,
  normalizeEmail,
  normalizePhone,
  normalizeText
} from '../../../shared/utils/erp-validators';

@Component({
  selector: 'app-offices-new',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './offices-new.html',
  styleUrls: ['./offices-new.scss']
})
export class OfficesNew implements OnInit {
  loading = false;
  formErrors: ValidationErrors = {};
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

    admin_username: '',
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
          this.form.rut = formatRut(office?.rut ?? '');
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
    this.errorMsg = '';
    const payload = this.buildPayload();

    if (!this.validateOfficeForm(payload)) {
      this.errorMsg = 'Revise los campos marcados antes de guardar.';
      return;
    }

    this.loading = true;

    if (this.isEdit) {
      const officePayload = {
        rut: payload.rut,
        name: payload.name,
        legal_name: payload.legal_name,
        email: payload.email,
        phone: payload.phone,
        status: payload.status
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

    this.officesSrv.create(payload).subscribe({
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

  private buildPayload(): any {
    return {
      ...this.form,
      rut: formatRut(this.form.rut),
      name: normalizeText(this.form.name),
      legal_name: normalizeText(this.form.legal_name),
      email: normalizeEmail(this.form.email),
      phone: normalizePhone(this.form.phone),
      status: Number(this.form.status),
      admin_username: normalizeText(this.form.admin_username),
      admin_name: normalizeText(this.form.admin_name),
      admin_email: normalizeEmail(this.form.admin_email),
      admin_password: String(this.form.admin_password ?? '').trim()
    };
  }

  private validateOfficeForm(payload: any): boolean {
    const errors: ValidationErrors = {};

    if (!payload.rut) errors['rut'] = 'El RUT de la oficina es obligatorio.';
    else if (!isValidRut(payload.rut)) errors['rut'] = 'El RUT no es válido. Revise el dígito verificador.';

    if (!payload.name) errors['name'] = 'El nombre de la oficina es obligatorio.';
    if (!payload.legal_name) errors['legal_name'] = 'La razón social es obligatoria.';
    if (payload.email && !isValidEmail(payload.email)) errors['email'] = 'Ingrese un correo válido.';

    if (!this.isEdit) {
      if (!payload.admin_username) errors['admin_username'] = 'El usuario administrador es obligatorio.';
      if (!payload.admin_name) errors['admin_name'] = 'El nombre del administrador es obligatorio.';
      if (!payload.admin_email) errors['admin_email'] = 'El correo del administrador es obligatorio.';
      else if (!isValidEmail(payload.admin_email)) errors['admin_email'] = 'Ingrese un correo válido.';

      if (!payload.admin_password) errors['admin_password'] = 'La contraseña es obligatoria.';
      else if (payload.admin_password.length < 6) errors['admin_password'] = 'La contraseña debe tener al menos 6 caracteres.';
    }

    this.formErrors = errors;
    return Object.keys(errors).length === 0;
  }

  onRutBlur(): void {
    this.form.rut = formatRut(this.form.rut);
  }

  onPhoneInput(): void {
    this.form.phone = normalizePhone(this.form.phone);
  }

  cancel(): void {
    this.router.navigate(['/master/offices']);
  }
}
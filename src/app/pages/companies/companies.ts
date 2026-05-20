import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompaniesService } from '../../services/companies.service';
import { AuthMaster } from '../../services/auth-master';
import {
  ValidationErrors,
  formatRut,
  isValidRut,
  isValidEmail,
  normalizeEmail,
  normalizePhone,
  normalizeText,
  onlyDigits
} from '../../shared/utils/erp-validators';

export interface Company {
  id?: number;
  office_id?: number;
  rut?: string;
  name?: string;
  legal_name?: string;
  business_type?: string;
  email?: string;
  phone?: string;
  address?: string;
  commune?: string;
  city?: string;
  region_name?: string;
  status?: string;
  notes?: string;
  year_num?: number;
  created_at?: string;
  updated_at?: string;
  office_name?: string;
}

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './companies.html',
  styleUrl: './companies.scss'
})
export class CompaniesComponent implements OnInit {
  private companiesService = inject(CompaniesService);
  private auth = inject(AuthMaster);
  private cdr = inject(ChangeDetectorRef);

  companies: Company[] = [];
  formErrors: ValidationErrors = {};
  formMessage = '';
  saving = false;
  editingCompanyId: number | null = null;
  currentOfficeId: number | null = null;

  form: Company = {
    office_id: undefined,
    rut: '',
    name: '',
    legal_name: '',
    business_type: '',
    email: '',
    phone: '',
    address: '',
    commune: '',
    city: '',
    region_name: '',
    status: 'active',
    notes: '',
    year_num: new Date().getFullYear()
  };

  ngOnInit(): void {
    this.currentOfficeId = this.auth.getOfficeId();

    if (!this.currentOfficeId) {
      alert('No se pudo identificar la oficina del usuario');
      return;
    }

    this.form.office_id = this.currentOfficeId;
    this.loadCompanies();
  }

  loadCompanies(): void {
    this.companiesService.getCompanies().subscribe({
      next: (data) => {
        console.log('EMPRESAS API =>', data);

        this.companies = [...data].filter(
          company => company.office_id === this.currentOfficeId
        );

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('ERROR LOAD COMPANIES:', err);
        alert('Error al cargar empresas');
      }
    });
  }

  saveCompany(): void {
    this.formMessage = '';

    if (!this.currentOfficeId) {
      this.formMessage = 'No se pudo identificar la oficina activa.';
      return;
    }

    const payload: Company = this.buildPayload();

    if (!this.validateCompany(payload)) {
      this.formMessage = 'Revise los campos marcados antes de guardar.';
      return;
    }

    this.saving = true;

    if (this.editingCompanyId) {
      this.companiesService.updateCompany(this.editingCompanyId, payload).subscribe({
        next: () => {
          this.saving = false;
          this.formMessage = 'Empresa actualizada correctamente.';
          this.resetForm();
          this.loadCompanies();
        },
        error: (err) => {
          this.saving = false;
          console.error('ERROR UPDATE COMPANY:', err);
          this.formMessage = err?.error?.message || 'No se pudo actualizar la empresa.';
        }
      });
    } else {
      this.companiesService.createCompany(payload).subscribe({
        next: () => {
          this.saving = false;
          this.formMessage = 'Empresa creada correctamente.';
          this.resetForm();
          this.loadCompanies();
        },
        error: (err) => {
          this.saving = false;
          console.error('ERROR CREATE COMPANY:', err);
          this.formMessage = err?.error?.message || 'No se pudo crear la empresa.';
        }
      });
    }
  }

  private buildPayload(): Company {
    return {
      office_id: this.currentOfficeId ?? undefined,
      rut: formatRut(this.form.rut),
      name: normalizeText(this.form.name),
      legal_name: normalizeText(this.form.legal_name),
      business_type: normalizeText(this.form.business_type),
      email: normalizeEmail(this.form.email),
      phone: normalizePhone(this.form.phone),
      address: normalizeText(this.form.address),
      commune: normalizeText(this.form.commune),
      city: normalizeText(this.form.city),
      region_name: normalizeText(this.form.region_name),
      status: this.form.status || 'active',
      notes: normalizeText(this.form.notes),
      year_num: Number(this.form.year_num) || new Date().getFullYear()
    };
  }

  private validateCompany(payload: Company): boolean {
    const errors: ValidationErrors = {};

    if (!payload.rut) errors['rut'] = 'El RUT es obligatorio.';
    else if (!isValidRut(payload.rut)) errors['rut'] = 'El RUT no es válido. Revise el dígito verificador.';

    if (!payload.name) errors['name'] = 'El nombre de fantasía es obligatorio.';
    if (!payload.legal_name) errors['legal_name'] = 'La razón social es obligatoria.';
    if (!payload.business_type) errors['business_type'] = 'El giro es obligatorio.';

    if (payload.email && !isValidEmail(payload.email)) {
      errors['email'] = 'Ingrese un correo válido.';
    }

    const year = Number(payload.year_num);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      errors['year_num'] = 'Ingrese un año contable válido.';
    }

    const sameRut = this.companies.find(company =>
      formatRut(company.rut) === payload.rut && company.id !== this.editingCompanyId
    );

    if (sameRut) {
      errors['rut'] = 'Ya existe una empresa con este RUT en la oficina.';
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

  onYearInput(): void {
    const digits = onlyDigits(this.form.year_num);
    this.form.year_num = digits ? Number(digits.slice(0, 4)) : undefined;
  }

  editCompany(company: Company): void {
    this.editingCompanyId = company.id || null;

    this.form = {
      office_id: company.office_id ?? this.currentOfficeId ?? undefined,
      rut: formatRut(company.rut) ?? '',
      name: company.name ?? '',
      legal_name: company.legal_name ?? '',
      business_type: company.business_type ?? '',
      email: company.email ?? '',
      phone: company.phone ?? '',
      address: company.address ?? '',
      commune: company.commune ?? '',
      city: company.city ?? '',
      region_name: company.region_name ?? '',
      status: company.status ?? 'active',
      notes: company.notes ?? '',
      year_num: company.year_num || new Date().getFullYear()
    };
  }

  toggleCompanyStatus(company: Company): void {
    if (!company.id) return;
    if (!this.currentOfficeId) {
      alert('No se pudo identificar la oficina activa');
      return;
    }

    const newStatus = company.status === 'active' ? 'inactive' : 'active';
    const actionText = newStatus === 'active' ? 'activar' : 'desactivar';

    const ok = confirm(`¿Deseas ${actionText} la empresa ${company.name}?`);
    if (!ok) return;

    const payload: Company = {
      office_id: company.office_id ?? this.currentOfficeId,
      rut: formatRut(company.rut) ?? '',
      name: company.name ?? '',
      legal_name: company.legal_name ?? '',
      business_type: company.business_type ?? '',
      email: company.email ?? '',
      phone: company.phone ?? '',
      address: company.address ?? '',
      commune: company.commune ?? '',
      city: company.city ?? '',
      region_name: company.region_name ?? '',
      status: newStatus,
      notes: company.notes ?? '',
      year_num: company.year_num || new Date().getFullYear()
    };

    this.companiesService.updateCompany(company.id, payload).subscribe({
      next: () => {
        alert(`Empresa ${newStatus === 'active' ? 'activada' : 'desactivada'} correctamente`);
        this.resetForm();
        this.loadCompanies();
      },
      error: (err: any) => {
        console.error('ERROR TOGGLE COMPANY STATUS:', err);
        alert(err?.error?.message || `Error al ${actionText} empresa`);
      }
    });
  }

  resetForm(): void {
    this.editingCompanyId = null;
    this.formErrors = {};

    this.form = {
      office_id: this.currentOfficeId ?? undefined,
      rut: '',
      name: '',
      legal_name: '',
      business_type: '',
      email: '',
      phone: '',
      address: '',
      commune: '',
      city: '',
      region_name: '',
      status: 'active',
      notes: '',
      year_num: new Date().getFullYear()
    };
  }
}
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CompaniesService, Company } from '../../services/companies.service';

@Component({
  selector: 'app-companies',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './companies.html',
  styleUrl: './companies.scss'
})
export class Companies implements OnInit {
  private companiesService = inject(CompaniesService);
  private cdr = inject(ChangeDetectorRef);

  companies: Company[] = [];
  editingCompanyId: number | null = null;

  form: Company = {
    office_id: 1,
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
    this.loadCompanies();
  }

  loadCompanies(): void {
    this.companiesService.getAll().subscribe({
      next: (data) => {
        console.log('EMPRESAS API =>', data);
        this.companies = [...data];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('ERROR LOAD COMPANIES:', err);
        alert('Error al cargar empresas');
      }
    });
  }

  saveCompany(): void {
    const payload: Company = {
      office_id: this.form.office_id ?? 1,
      rut: this.form.rut?.trim() || '',
      name: this.form.name?.trim() || '',
      legal_name: this.form.legal_name?.trim() || '',
      business_type: this.form.business_type?.trim() || '',
      email: this.form.email?.trim() || '',
      phone: this.form.phone?.trim() || '',
      address: this.form.address?.trim() || '',
      commune: this.form.commune?.trim() || '',
      city: this.form.city?.trim() || '',
      region_name: this.form.region_name?.trim() || '',
      status: this.form.status || 'active',
      notes: this.form.notes?.trim() || '',
      year_num: this.form.year_num || new Date().getFullYear()
    };

    if (!payload.rut || !payload.name) {
      alert('RUT y Nombre son obligatorios');
      return;
    }

    if (this.editingCompanyId) {
      this.companiesService.update(this.editingCompanyId, payload).subscribe({
        next: () => {
          alert('Empresa actualizada correctamente');
          this.resetForm();
          this.loadCompanies();
        },
        error: (err) => {
          console.error('ERROR UPDATE COMPANY:', err);
          alert(err?.error?.message || 'Error al actualizar empresa');
        }
      });
    } else {
      if (!payload.office_id) {
        alert('Office ID es obligatorio');
        return;
      }

      this.companiesService.create(payload).subscribe({
        next: () => {
          alert('Empresa creada correctamente');
          this.resetForm();
          this.loadCompanies();
        },
        error: (err) => {
          console.error('ERROR CREATE COMPANY:', err);
          alert(err?.error?.message || 'Error al crear empresa');
        }
      });
    }
  }

  editCompany(company: Company): void {
    this.editingCompanyId = company.id || null;

    this.form = {
      office_id: company.office_id ?? 1,
      rut: company.rut ?? '',
      name: company.name ?? '',
      legal_name: company.legal_name || '',
      business_type: company.business_type || '',
      email: company.email || '',
      phone: company.phone || '',
      address: company.address || '',
      commune: company.commune || '',
      city: company.city || '',
      region_name: company.region_name || '',
      status: company.status || 'active',
      notes: company.notes || '',
      year_num: company.year_num || new Date().getFullYear()
    };
  }

  toggleCompanyStatus(company: Company): void {
    if (!company.id) return;

    const newStatus = company.status === 'active' ? 'inactive' : 'active';
    const actionText = newStatus === 'active' ? 'activar' : 'desactivar';

    const ok = confirm(`¿Deseas ${actionText} la empresa ${company.name}?`);
    if (!ok) return;

    const payload: Company = {
      office_id: company.office_id ?? 1,
      rut: company.rut ?? '',
      name: company.name ?? '',
      legal_name: company.legal_name || '',
      business_type: company.business_type || '',
      email: company.email || '',
      phone: company.phone || '',
      address: company.address || '',
      commune: company.commune || '',
      city: company.city || '',
      region_name: company.region_name || '',
      status: newStatus,
      notes: company.notes || '',
      year_num: company.year_num || new Date().getFullYear()
    };

    this.companiesService.update(company.id, payload).subscribe({
      next: () => {
        alert(`Empresa ${newStatus === 'active' ? 'activada' : 'desactivada'} correctamente`);
        this.resetForm();
        this.loadCompanies();
      },
      error: (err) => {
        console.error('ERROR TOGGLE COMPANY STATUS:', err);
        alert(err?.error?.message || `Error al ${actionText} empresa`);
      }
    });
  }

  resetForm(): void {
    this.editingCompanyId = null;

    this.form = {
      office_id: 1,
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
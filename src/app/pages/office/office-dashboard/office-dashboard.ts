import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CompaniesService } from '../../../services/companies.service';
import { AuthMaster } from '../../../services/auth-master';

interface Company {
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
  status?: string | number;
  notes?: string;
  year_num?: number;
  created_at?: string;
  updated_at?: string;
  office_name?: string;
  label?: string;
}

@Component({
  selector: 'app-office-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './office-dashboard.html',
  styleUrls: ['./office-dashboard.scss']
})
export class OfficeDashboard implements OnInit {
  private companiesService = inject(CompaniesService);
  private auth = inject(AuthMaster);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  companies: Company[] = [];
  selectedCompanyId: number | null = null;
  selectedCompany: Company | null = null;

  loadingCompanies = false;
  errorMsg = '';
  isOfficeAdmin = false;

  ngOnInit(): void {
    this.isOfficeAdmin = this.auth.isOfficeAdmin();

    console.log('USER LOGUEADO:', this.auth.getUser());
    console.log('ES OFFICE ADMIN:', this.isOfficeAdmin);
    console.log('ES OFFICE USER:', this.auth.isOfficeUser());
    console.log('ES MASTER:', this.auth.isMaster());

    const current = this.auth.getSelectedCompany();

    if (current?.id) {
      this.selectedCompanyId = Number(current.id);
    }

    this.loadCompanies();
  }

  loadCompanies(): void {
    const officeId = this.auth.getOfficeId();

    console.log('OFFICE ID USUARIO:', officeId);

    if (!officeId) {
      this.errorMsg = 'No se pudo identificar la oficina del usuario.';
      this.loadingCompanies = false;
      this.cdr.detectChanges();
      return;
    }

    this.loadingCompanies = true;
    this.errorMsg = '';
    this.cdr.detectChanges();

    this.companiesService.getCompanies().subscribe({
      next: (data: Company[]) => {
        console.log('COMPANIES API:', data);

        const filteredCompanies = (data || [])
          .filter(company => Number(company.office_id) === Number(officeId))
          .map(company => ({
            ...company,
            label: this.buildCompanyLabel(company)
          }));

        this.companies = filteredCompanies;

        console.log('EMPRESAS NORMALIZADAS:', this.companies);

        if (this.companies.length === 0) {
          this.selectedCompanyId = null;
          this.selectedCompany = null;
          this.auth.clearSelectedCompany();
          this.errorMsg = 'No hay empresas disponibles para esta oficina.';
          this.loadingCompanies = false;
          this.cdr.detectChanges();
          return;
        }

        if (
          this.selectedCompanyId &&
          !this.companies.some(c => Number(c.id) === Number(this.selectedCompanyId))
        ) {
          this.selectedCompanyId = null;
          this.selectedCompany = null;
          this.auth.clearSelectedCompany();
        }

        if (!this.selectedCompanyId && this.companies.length === 1) {
          this.selectedCompanyId = Number(this.companies[0].id);
        }

        if (this.selectedCompanyId) {
          const found =
            this.companies.find(c => Number(c.id) === Number(this.selectedCompanyId)) || null;

          this.selectedCompany = found;

          if (found) {
            this.auth.setSelectedCompany(found);
            console.log('EMPRESA ACTIVA:', found);
          } else {
            this.selectedCompany = null;
            this.auth.clearSelectedCompany();
          }
        } else {
          this.selectedCompany = null;
        }

        this.loadingCompanies = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('ERROR LOAD DASHBOARD COMPANIES:', err);
        this.errorMsg = 'No se pudieron cargar las empresas.';
        this.loadingCompanies = false;
        this.cdr.detectChanges();
      }
    });
  }

  private buildCompanyLabel(company: Company): string {
    const name =
      String(company.name || '').trim() ||
      String(company.legal_name || '').trim() ||
      `Empresa #${company.id ?? ''}`;

    const rut = String(company.rut || '').trim();

    return rut ? `${name} - ${rut}` : name;
  }

  onCompanyChange(): void {
    if (!this.selectedCompanyId) {
      this.selectedCompany = null;
      this.auth.clearSelectedCompany();
      this.errorMsg = '';
      this.cdr.detectChanges();
      return;
    }

    const company =
      this.companies.find(c => Number(c.id) === Number(this.selectedCompanyId)) || null;

    this.selectedCompany = company;

    if (company) {
      this.auth.setSelectedCompany(company);
      this.errorMsg = '';
      console.log('EMPRESA ACTIVADA:', company);
    } else {
      this.selectedCompany = null;
      this.auth.clearSelectedCompany();
      this.errorMsg = 'La empresa seleccionada no es válida.';
    }

    this.cdr.detectChanges();
  }

  clearCompany(): void {
    this.auth.clearSelectedCompany();
    this.selectedCompany = null;
    this.selectedCompanyId = null;
    this.errorMsg = '';
    this.cdr.detectChanges();
  }

  goTo(route: string, requiresCompany: boolean = false): void {
    if (requiresCompany && !this.selectedCompany) {
      this.errorMsg = 'Debes seleccionar una empresa primero.';
      this.cdr.detectChanges();
      return;
    }

    this.errorMsg = '';
    this.router.navigate([route]);
  }
}
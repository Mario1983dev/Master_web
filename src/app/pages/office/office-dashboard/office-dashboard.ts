import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CompaniesService } from '../../../services/companies.service';
import { AuthMaster } from '../../../services/auth-master';
import { ConfigurationService } from '../../../services/configuration.service';

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
  private configurationService = inject(ConfigurationService);
  private auth = inject(AuthMaster);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  companies: Company[] = [];
  selectedCompanyId: number | null = null;
  selectedCompany: Company | null = null;

  loadingCompanies = false;
  loadingConfiguration = false;
  errorMsg = '';
  configurationMsg = '';
  isOfficeAdmin = false;
  isConfigured = false;

  private requiredConfigKeys = [
    'CAJA',
    'BANCO',
    'CLIENTES',
    'PROVEEDORES',
    'IVA_CREDITO',
    'IVA_DEBITO',
    'VENTAS',
    'COMPRAS'
  ];

  ngOnInit(): void {
    this.isOfficeAdmin = this.auth.isOfficeAdmin();

    const current = this.auth.getSelectedCompany();

    if (current?.id) {
      this.selectedCompanyId = Number(current.id);
      localStorage.setItem('company_id', String(current.id));
    }

    this.loadCompanies();
  }

  loadCompanies(): void {
    const officeId = this.auth.getOfficeId();

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
        const filteredCompanies = (data || [])
          .filter(company => Number(company.office_id) === Number(officeId));

        const uniqueCompanies = filteredCompanies.filter(
          (company, index, self) =>
            index === self.findIndex(c => Number(c.id) === Number(company.id))
        );

        this.companies = uniqueCompanies.map(company => ({
          ...company,
          label: this.buildCompanyLabel(company)
        }));

        if (this.companies.length === 0) {
          this.selectedCompanyId = null;
          this.selectedCompany = null;
          this.isConfigured = false;
          this.auth.clearSelectedCompany();
          localStorage.removeItem('company_id');
          this.errorMsg = 'No hay empresas disponibles para esta oficina.';
          this.loadingCompanies = false;
          this.cdr.detectChanges();
          return;
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
            localStorage.setItem('company_id', String(found.id));
            this.checkCompanyConfiguration(Number(found.id));
          } else {
            this.selectedCompanyId = null;
            this.selectedCompany = null;
            this.isConfigured = false;
            this.auth.clearSelectedCompany();
            localStorage.removeItem('company_id');
          }
        }

        this.loadingCompanies = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.errorMsg = 'No se pudieron cargar las empresas.';
        this.loadingCompanies = false;
        this.cdr.detectChanges();
      }
    });
  }

  private checkCompanyConfiguration(companyId: number): void {
    this.loadingConfiguration = true;
    this.isConfigured = false;
    this.configurationMsg = 'Revisando configuración contable...';
    this.cdr.detectChanges();

    this.configurationService.getAccountMappings(companyId).subscribe({
      next: (mappings) => {
        const configuredKeys = (mappings || [])
          .filter(m => !!m.account_id)
          .map(m => String(m.mapping_key || '').trim().toUpperCase());

        const missingKeys = this.requiredConfigKeys.filter(
          key => !configuredKeys.includes(key)
        );

        this.isConfigured = missingKeys.length === 0;

        this.configurationMsg = this.isConfigured
          ? 'Configuración contable completa.'
          : `Falta configurar: ${missingKeys.join(', ')}`;

        this.loadingConfiguration = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isConfigured = false;
        this.configurationMsg = 'No se pudo validar la configuración contable.';
        this.loadingConfiguration = false;
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
      this.isConfigured = false;
      this.configurationMsg = '';
      this.auth.clearSelectedCompany();
      localStorage.removeItem('company_id');
      this.cdr.detectChanges();
      return;
    }

    const company =
      this.companies.find(c => Number(c.id) === Number(this.selectedCompanyId)) || null;

    this.selectedCompany = company;

    if (company) {
      this.auth.setSelectedCompany(company);
      localStorage.setItem('company_id', String(company.id));
      this.checkCompanyConfiguration(Number(company.id));
    }

    this.cdr.detectChanges();
  }

  clearCompany(): void {
    this.auth.clearSelectedCompany();
    localStorage.removeItem('company_id');
    this.selectedCompany = null;
    this.selectedCompanyId = null;
    this.isConfigured = false;
    this.configurationMsg = '';
    this.cdr.detectChanges();
  }

  goTo(route: string, requiresCompany: boolean = false, requiresConfiguration: boolean = false): void {
    if (requiresCompany && !this.selectedCompany) {
      this.errorMsg = 'Debes seleccionar una empresa primero.';
      this.cdr.detectChanges();
      return;
    }

    if (requiresConfiguration && !this.isConfigured) {
      this.errorMsg = 'Debes completar la configuración contable antes de usar este módulo.';
      this.cdr.detectChanges();
      return;
    }

    this.router.navigate([route]);
  }
}
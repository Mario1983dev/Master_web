import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthMaster } from '../../services/auth-master';
import { CompaniesService } from '../../services/companies.service';

@Component({
  selector: 'app-office',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: 'office.html',
  styleUrls: ['office.scss']
})
export class Office implements OnInit {
  companies: any[] = [];
  activeCompanyId: number | null = null;
  loadingCompanies = false;
  companiesError = '';

  constructor(
    public auth: AuthMaster,
    private companiesService: CompaniesService
  ) {}

  ngOnInit(): void {
    this.restoreActiveCompany();
    this.loadCompanies();
  }

  loadCompanies(): void {
    this.loadingCompanies = true;
    this.companiesError = '';

    this.companiesService.getCompanies().subscribe({
      next: (rows: any[]) => {
        this.companies = Array.isArray(rows) ? rows : [];
        this.loadingCompanies = false;

        const saved = this.getSavedActiveCompany();

        if (saved?.id) {
          const exists = this.companies.find(c => Number(c.id) === Number(saved.id));

          if (exists) {
            this.activeCompanyId = Number(exists.id);
            localStorage.setItem('active_company', JSON.stringify(exists));
            return;
          }

          localStorage.removeItem('active_company');
          this.activeCompanyId = null;
        }

        if (this.companies.length === 1) {
          const onlyCompany = this.companies[0];
          this.activeCompanyId = Number(onlyCompany.id);
          localStorage.setItem('active_company', JSON.stringify(onlyCompany));
        }
      },
      error: (err) => {
        console.error('ERROR CARGANDO EMPRESAS:', err);
        this.loadingCompanies = false;
        this.companiesError = 'No se pudieron cargar las empresas.';
      }
    });
  }

  onSelectCompany(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const id = Number(target.value);

    if (!id) {
      this.activeCompanyId = null;
      localStorage.removeItem('active_company');
      return;
    }

    const company = this.companies.find(c => Number(c.id) === id);

    if (!company) {
      this.activeCompanyId = null;
      localStorage.removeItem('active_company');
      return;
    }

    this.activeCompanyId = id;
    localStorage.setItem('active_company', JSON.stringify(company));
  }

  private restoreActiveCompany(): void {
    const saved = this.getSavedActiveCompany();
    this.activeCompanyId = saved?.id ? Number(saved.id) : null;
  }

  private getSavedActiveCompany(): any | null {
    const raw = localStorage.getItem('active_company');

    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      localStorage.removeItem('active_company');
      return null;
    }
  }
}
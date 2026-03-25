import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthMaster } from '../../services/auth-master';
import { CompaniesService } from '../../services/companies.service';

@Component({
  selector: 'app-office',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './office.html',
  styleUrls: ['./office.scss']
})
export class Office implements OnInit {
  companies: any[] = [];
  activeCompanyId: number | null = null;
  loadingCompanies = false;
  companiesError = '';

  constructor(
    public auth: AuthMaster,
    private companiesService: CompaniesService,
    private router: Router // 👈 agregado
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

        const saved = this.auth.getSelectedCompany();

        if (saved?.id) {
          const exists = this.companies.find(
            c => Number(c.id) === Number(saved.id)
          );

          if (exists) {
            this.activeCompanyId = Number(exists.id);
            this.auth.setSelectedCompany(exists);
            return;
          }

          this.auth.clearSelectedCompany();
          this.activeCompanyId = null;
        }

        if (this.companies.length === 1) {
          const onlyCompany = this.companies[0];
          this.activeCompanyId = Number(onlyCompany.id);
          this.auth.setSelectedCompany(onlyCompany);

          // 🚀 auto entrar si hay solo una
          this.router.navigate(['/office/accounts']);
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
      this.auth.clearSelectedCompany();
      return;
    }

    const company = this.companies.find(c => Number(c.id) === id);

    if (!company) {
      this.activeCompanyId = null;
      this.auth.clearSelectedCompany();
      return;
    }

    this.activeCompanyId = id;
    this.auth.setSelectedCompany(company);

    // 🚀 CLAVE: entrar al ERP
    this.router.navigate(['/office/accounts']);
  }

  hasActiveCompany(): boolean {
    return !!this.activeCompanyId;
  }

  private restoreActiveCompany(): void {
    const saved = this.auth.getSelectedCompany();
    this.activeCompanyId = saved?.id ? Number(saved.id) : null;
  }
}
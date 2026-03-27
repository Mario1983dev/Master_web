import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthMaster } from '../../services/auth-master';
import { CompaniesService } from '../../services/companies.service';

@Component({
  selector: 'app-office',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
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
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    console.log('🚀 OFFICE NGONINIT');
    this.restoreActiveCompany();
    this.loadCompanies();
  }

  loadCompanies(): void {
    console.log('📡 LOAD COMPANIES INICIANDO');

    this.loadingCompanies = true;
    this.companiesError = '';
    this.cdr.detectChanges();

    this.companiesService.getCompanies().subscribe({
      next: (rows: any[]) => {
        console.log('✅ EMPRESAS RECIBIDAS =>', rows);

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
            console.log('♻️ EMPRESA RESTAURADA Y VALIDADA =>', exists);
            this.cdr.detectChanges();
            return;
          }

          this.auth.clearSelectedCompany();
          this.activeCompanyId = null;
        }

        if (this.companies.length > 0) {
          const firstCompany = this.companies[0];
          this.activeCompanyId = Number(firstCompany.id);
          this.auth.setSelectedCompany(firstCompany);

          console.log('🏢 EMPRESA AUTOSELECCIONADA =>', firstCompany);
          this.cdr.detectChanges();
          return;
        }

        this.activeCompanyId = null;
        this.auth.clearSelectedCompany();
        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error('❌ ERROR CARGANDO EMPRESAS =>', err);

        if (err.status === 403) {
          this.companiesError = 'No tienes permisos para ver empresas';
        } else if (err.status === 401) {
          this.companiesError = 'Sesión expirada, vuelve a iniciar sesión';
        } else {
          this.companiesError = 'No se pudieron cargar las empresas';
        }

        this.loadingCompanies = false;
        this.activeCompanyId = null;
        this.auth.clearSelectedCompany();
        this.cdr.detectChanges();
      }
    });
  }

  onSelectCompany(): void {
    const company = this.companies.find(
      c => Number(c.id) === Number(this.activeCompanyId)
    );

    console.log('🏢 EMPRESA SELECCIONADA =>', this.activeCompanyId);

    if (!company) {
      this.activeCompanyId = null;
      this.auth.clearSelectedCompany();
      this.cdr.detectChanges();
      return;
    }

    this.activeCompanyId = Number(company.id);
    this.auth.setSelectedCompany(company);
    this.cdr.detectChanges();
  }

  goToAccounts(): void {
    if (!this.hasActiveCompany()) return;

    console.log('➡️ IR A PLAN DE CUENTAS');
    this.router.navigate(['/office/accounts']);
  }

  goToJournalEntries(): void {
    if (!this.hasActiveCompany()) return;

    console.log('➡️ IR A ASIENTOS');
    this.router.navigate(['/office/journal-entries']);
  }

  hasActiveCompany(): boolean {
    return this.activeCompanyId !== null && this.activeCompanyId > 0;
  }

  private restoreActiveCompany(): void {
    const saved = this.auth.getSelectedCompany();
    this.activeCompanyId = saved?.id ? Number(saved.id) : null;

    console.log('♻️ EMPRESA RESTAURADA =>', saved);
    this.cdr.detectChanges();
  }
  isOfficeAdmin(): boolean {
  return this.auth.isOfficeAdmin();
}

isOfficeUser(): boolean {
  return this.auth.isOfficeUser();
}
}
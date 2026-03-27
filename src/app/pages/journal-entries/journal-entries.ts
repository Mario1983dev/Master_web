import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthMaster } from '../../services/auth-master';
import { JournalEntriesService } from '../../services/journal-entries.service';

@Component({
  selector: 'app-journal-entries',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './journal-entries.html',
  styleUrls: ['./journal-entries.scss']
})
export class JournalEntries implements OnInit {
  entries: any[] = [];
  loading = false;
  error = '';

  constructor(
    private auth: AuthMaster,
    private journalEntriesService: JournalEntriesService
  ) {}

  ngOnInit(): void {
    console.log('🚀 JOURNAL ENTRIES NGONINIT');

    const company = this.auth.getSelectedCompany();

    if (!company || !company.id) {
      console.error('❌ No hay empresa seleccionada');
      this.error = 'Debes seleccionar una empresa primero';
      return;
    }

    console.log('🏢 EMPRESA ACTIVA EN ASIENTOS =>', company);

    this.loadJournalEntries(Number(company.id));
  }

  loadJournalEntries(companyId: number): void {
    console.log('📡 CARGANDO ASIENTOS PARA EMPRESA =>', companyId);

    this.loading = true;
    this.error = '';

    this.journalEntriesService.getJournalEntries(companyId).subscribe({
      next: (rows: any[]) => {
        console.log('✅ ASIENTOS RECIBIDOS =>', rows);
        this.entries = Array.isArray(rows) ? rows : [];
        this.loading = false;
      },
      error: (err: any) => { // ✅ FIX TS7006
        console.error('❌ ERROR CARGANDO ASIENTOS =>', err);
        this.loading = false;
        this.error = 'No se pudieron cargar los asientos';
      }
    });
  }
}
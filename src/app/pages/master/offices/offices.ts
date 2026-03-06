import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs';
import { OfficesService } from '../../../services/offices.service';

@Component({
  selector: 'app-offices',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './offices.html',
  styleUrls: ['./offices.scss']
})
export class Offices implements OnInit {
  loading = false;
  errorMsg = '';
  offices: any[] = [];

  constructor(private officesSrv: OfficesService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    console.log('LOAD OFFICES -> inicio');

    this.loading = true;
    this.errorMsg = '';

    this.officesSrv.list()
      .pipe(
        finalize(() => {
          this.loading = false;
          console.log('LOAD OFFICES -> finalize, loading=false');
        })
      )
.subscribe({
  next: (res: any) => {
    console.log('LOAD OFFICES -> respuesta:', res);
    this.offices = Array.isArray(res) ? res : [];
    console.log('LOAD OFFICES -> offices asignadas:', this.offices);
  },
  error: (err: any) => {
    console.error('LOAD OFFICES -> error:', err);
    this.errorMsg = err?.error?.message || 'No se pudieron cargar las oficinas';
  }
});
  }
}
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { OfficesService } from '../../../services/offices.service';

@Component({
  selector: 'app-offices-new',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './offices-new.html',
  styleUrls: ['./offices-new.scss']
})
export class OfficesNew implements OnInit {
  loading = false;
  errorMsg = '';
  isEdit = false;
  officeId = 0;

  form: any = {
    rut: '',
    name: '',
    legal_name: '',
    email: '',
    phone: '',
    status: 1
  };

  constructor(
    private officesSrv: OfficesService,
    private router: Router,
    private route: ActivatedRoute
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
        this.form = {
          rut: resp?.rut || '',
          name: resp?.name || '',
          legal_name: resp?.legal_name || '',
          email: resp?.email || '',
          phone: resp?.phone || '',
          status: resp?.status ?? 1
        };
        this.loading = false;
      },
      error: (err: any) => {
        console.error('GET OFFICE ERROR:', err);
        this.errorMsg = err?.error?.message || 'Error al cargar oficina';
        this.loading = false;
      }
    });
  }

  save(): void {
    this.loading = true;
    this.errorMsg = '';

    if (this.isEdit) {
      this.officesSrv.update(this.officeId, this.form).subscribe({
        next: () => {
          alert('Oficina actualizada correctamente');
          this.router.navigate(['/master/offices']);
        },
        error: (err: any) => {
          console.error('UPDATE OFFICE ERROR:', err);
          this.errorMsg = err?.error?.message || 'Error al actualizar oficina';
          this.loading = false;
        }
      });
    } else {
      this.officesSrv.create(this.form).subscribe({
        next: () => {
          alert('Oficina creada correctamente');
          this.router.navigate(['/master/offices']);
        },
        error: (err: any) => {
          console.error('CREATE OFFICE ERROR:', err);
          this.errorMsg = err?.error?.message || 'Error al crear oficina';
          this.loading = false;
        }
      });
    }
  }

  cancel(): void {
    this.router.navigate(['/master/offices']);
  }
}
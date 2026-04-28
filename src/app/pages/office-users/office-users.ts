import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OfficeUsersService, OfficeUser } from '../../services/office-users.service';

@Component({
  selector: 'app-office-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './office-users.html',
  styleUrl: './office-users.scss'
})
export class OfficeUsers implements OnInit {
  private officeUsersService = inject(OfficeUsersService);
  private cdr = inject(ChangeDetectorRef);

  users: OfficeUser[] = [];
  officeId: number | null = null;
  editingUserId: number | null = null;

  form = {
    name: '',
    email: '',
    password: '',
    role: 'user' as 'admin' | 'user'
  };

  ngOnInit(): void {
    this.loadOfficeId();
    this.loadUsers();
  }

  private loadOfficeId(): void {
    try {
      const rawUser = localStorage.getItem('user');

      if (!rawUser) {
        this.officeId = null;
        return;
      }

      const user = JSON.parse(rawUser);
      this.officeId = Number(user.office_id);

      if (!this.officeId) {
        this.officeId = null;
      }
    } catch {
      this.officeId = null;
    }
  }

  private normalizeRoleToForm(role: string): 'admin' | 'user' {
    const value = String(role || '').trim().toUpperCase();

    if (value === 'OFFICE_ADMIN' || value === 'ADMIN') {
      return 'admin';
    }

    return 'user';
  }

  loadUsers(): void {
    if (!this.officeId) {
      this.users = [];
      this.cdr.detectChanges();
      return;
    }

    this.officeUsersService.getByOffice(this.officeId).subscribe({
      next: (data: OfficeUser[]) => {
        this.users = Array.isArray(data) ? [...data] : [];
        this.cdr.detectChanges();
      },
      error: () => {
        this.users = [];
        this.cdr.detectChanges();
      }
    });
  }

  save(): void {
    if (!this.officeId) {
      alert('No hay oficina válida para guardar usuario');
      return;
    }

    if (!this.form.name.trim() || !this.form.email.trim()) {
      alert('Nombre y correo son obligatorios');
      return;
    }

    if (!this.editingUserId && !this.form.password.trim()) {
      alert('La contraseña es obligatoria');
      return;
    }

    if (!this.editingUserId && this.form.password.trim().length < 6) {
      alert('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (this.editingUserId !== null) {
      const payload = {
        name: this.form.name.trim(),
        email: this.form.email.trim().toLowerCase(),
        role: this.form.role,
        status: 1
      };

      this.officeUsersService.update(this.editingUserId, payload).subscribe({
        next: () => {
          this.cancelEdit();
          this.loadUsers();
        },
        error: (err) => {
          console.error('ERROR UPDATE USER:', err);
          alert(err?.error?.message || 'Error al actualizar usuario');
        }
      });

      return;
    }

    const payload = {
      office_id: this.officeId,
      name: this.form.name.trim(),
      email: this.form.email.trim().toLowerCase(),
      password: this.form.password.trim(),
      role: this.form.role,
      status: 1
    };

    this.officeUsersService.create(payload).subscribe({
      next: () => {
        this.cancelEdit();
        this.loadUsers();
      },
      error: (err) => {
        console.error('ERROR CREATE USER:', err);
        alert(err?.error?.message || 'Error al crear usuario');
      }
    });
  }

  edit(user: OfficeUser): void {
    this.editingUserId = user.id;
    this.form = {
      name: user.name,
      email: user.email,
      password: '',
      role: this.normalizeRoleToForm(user.role)
    };
  }

  cancelEdit(): void {
    this.editingUserId = null;
    this.form = {
      name: '',
      email: '',
      password: '',
      role: 'user'
    };
  }

  toggleStatus(user: OfficeUser): void {
    const newStatus = user.status === 1 ? 0 : 1;

    this.officeUsersService.changeStatus(user.id, newStatus).subscribe({
      next: () => this.loadUsers(),
      error: (err) => {
        console.error('ERROR CHANGE STATUS:', err);
        alert(err?.error?.message || 'Error al cambiar estado');
      }
    });
  }
}
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

  form: {
    name: string;
    email: string;
    password: string;
    role: 'admin' | 'user';
  } = {
    name: '',
    email: '',
    password: '',
    role: 'user'
  };

  editingUserId: number | null = null;

  ngOnInit(): void {
    this.loadOfficeId();
    this.loadUsers();
  }

  private loadOfficeId(): void {
    try {
      const rawUser = localStorage.getItem('user');

      if (!rawUser) {
        console.error('No se encontró el usuario en localStorage');
        this.officeId = null;
        return;
      }

      const user = JSON.parse(rawUser);
      this.officeId = Number(user.office_id);

      console.log('OFFICE ID ACTUAL =>', this.officeId);

      if (!this.officeId) {
        console.error('office_id inválido en localStorage:', user);
        this.officeId = null;
      }
    } catch (error) {
      console.error('Error leyendo usuario desde localStorage:', error);
      this.officeId = null;
    }
  }

  loadUsers(): void {
    if (!this.officeId) {
      console.error('No hay officeId válido para cargar usuarios');
      this.users = [];
      this.cdr.detectChanges();
      return;
    }

    this.officeUsersService.getByOffice(this.officeId).subscribe({
      next: (data: OfficeUser[]) => {
        console.log('USUARIOS API:', data);
        this.users = Array.isArray(data) ? [...data] : [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('ERROR LOAD USERS:', err);
        this.users = [];
        this.cdr.detectChanges();
      }
    });
  }

  save(): void {
    if (!this.officeId) {
      console.error('No hay officeId válido para guardar usuario');
      return;
    }

    if (
      !this.form.name.trim() ||
      !this.form.email.trim() ||
      (!this.editingUserId && !this.form.password.trim())
    ) {
      console.error('Nombre, correo y contraseña son obligatorios');
      return;
    }

    if (this.editingUserId !== null) {
      const payload = {
        name: this.form.name.trim(),
        email: this.form.email.trim().toLowerCase(),
        password: this.form.password,
        role: this.form.role
      };

      console.log('PAYLOAD UPDATE USER =>', payload);

      this.officeUsersService.update(this.editingUserId, payload).subscribe({
        next: () => {
          this.cancelEdit();
          this.loadUsers();
        },
        error: (err) => console.error('ERROR UPDATE USER:', err)
      });
    } else {
      const payload = {
        office_id: this.officeId,
        name: this.form.name.trim(),
        username: this.form.email.trim().toLowerCase().split('@')[0],
        email: this.form.email.trim().toLowerCase(),
        password: this.form.password,
        role: this.form.role
      };

      console.log('PAYLOAD CREATE USER =>', payload);

      this.officeUsersService.create(payload).subscribe({
        next: () => {
          this.cancelEdit();
          this.loadUsers();
        },
        error: (err) => console.error('ERROR CREATE USER:', err)
      });
    }
  }

  edit(user: OfficeUser): void {
    this.editingUserId = user.id;
    this.form = {
      name: user.name,
      email: user.email,
      password: '',
      role: user.role
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
      next: () => {
        this.loadUsers();
      },
      error: (err) => console.error('ERROR CHANGE STATUS:', err)
    });
  }
}
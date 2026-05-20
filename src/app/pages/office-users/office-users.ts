import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OfficeUsersService, OfficeUser } from '../../services/office-users.service';
import { ValidationErrors, isValidEmail, normalizeEmail, normalizeText } from '../../shared/utils/erp-validators';

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
  formErrors: ValidationErrors = {};
  formMessage = '';
  saving = false;
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
    this.formMessage = '';

    if (!this.officeId) {
      this.formMessage = 'No hay oficina válida para guardar usuario.';
      return;
    }

    if (!this.validateUserForm()) {
      this.formMessage = 'Revise los campos marcados antes de guardar.';
      return;
    }

    this.saving = true;

    if (this.editingUserId !== null) {
      const payload = {
        name: normalizeText(this.form.name),
        email: normalizeEmail(this.form.email),
        role: this.form.role,
        status: 1
      };

      this.officeUsersService.update(this.editingUserId, payload).subscribe({
        next: () => {
          this.saving = false;
          this.formMessage = 'Usuario actualizado correctamente.';
          this.cancelEdit(false);
          this.loadUsers();
        },
        error: (err) => {
          this.saving = false;
          console.error('ERROR UPDATE USER:', err);
          this.formMessage = err?.error?.message || 'No se pudo actualizar el usuario.';
        }
      });

      return;
    }

    const payload = {
      office_id: this.officeId,
      name: normalizeText(this.form.name),
      email: normalizeEmail(this.form.email),
      password: this.form.password.trim(),
      role: this.form.role,
      status: 1
    };

    this.officeUsersService.create(payload).subscribe({
      next: () => {
        this.saving = false;
        this.formMessage = 'Usuario creado correctamente.';
        this.cancelEdit(false);
        this.loadUsers();
      },
      error: (err) => {
        this.saving = false;
        console.error('ERROR CREATE USER:', err);
        this.formMessage = err?.error?.message || 'No se pudo crear el usuario.';
      }
    });
  }

  private validateUserForm(): boolean {
    const errors: ValidationErrors = {};
    const name = normalizeText(this.form.name);
    const email = normalizeEmail(this.form.email);

    if (!name) errors['name'] = 'El nombre es obligatorio.';
    if (!email) errors['email'] = 'El correo es obligatorio.';
    else if (!isValidEmail(email)) errors['email'] = 'Ingrese un correo válido.';

    if (!this.editingUserId) {
      if (!this.form.password.trim()) errors['password'] = 'La contraseña es obligatoria.';
      else if (this.form.password.trim().length < 6) errors['password'] = 'La contraseña debe tener al menos 6 caracteres.';
    }

    if (this.form.role !== 'admin' && this.form.role !== 'user') {
      errors['role'] = 'Seleccione un rol válido.';
    }

    const sameEmail = this.users.find(user =>
      normalizeEmail(user.email) === email && user.id !== this.editingUserId
    );

    if (sameEmail) errors['email'] = 'Ya existe un usuario con este correo.';

    this.formErrors = errors;
    return Object.keys(errors).length === 0;
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

  cancelEdit(clearMessage = true): void {
    this.editingUserId = null;
    this.formErrors = {};
    if (clearMessage) this.formMessage = '';
    this.form = {
      name: '',
      email: '',
      password: '',
      role: 'user'
    };
  }

  toggleStatus(user: OfficeUser): void {
    const action = user.status === 1 ? 'desactivar' : 'activar';
    if (!confirm(`¿Deseas ${action} al usuario ${user.name}?`)) return;

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
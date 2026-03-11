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
  officeId = 1;

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
    this.loadUsers();
  }

  loadUsers(): void {
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
    if (this.editingUserId !== null) {
      this.officeUsersService.update(this.editingUserId, this.form).subscribe({
        next: () => {
          this.cancelEdit();
          this.loadUsers();
        },
        error: (err) => console.error('ERROR UPDATE USER:', err)
      });
    } else {
      this.officeUsersService.create({
        office_id: this.officeId,
        ...this.form
      }).subscribe({
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
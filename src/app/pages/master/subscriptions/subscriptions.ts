import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SubscriptionsService } from '../../../services/subscriptions.service';

@Component({
  selector: 'app-subscriptions',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './subscriptions.html',
  styleUrls: ['./subscriptions.scss']
})
export class Subscriptions implements OnInit {

  subscriptions: any[] = [];
  errorMessage = '';

  constructor(
    private subscriptionsService: SubscriptionsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSubscriptions();
  }

  loadSubscriptions(): void {
    this.errorMessage = '';

    this.subscriptionsService.getSubscriptions().subscribe({
      next: (data: any[]) => {
        this.subscriptions = Array.isArray(data) ? [...data] : [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('ERROR SUBSCRIPTIONS:', err);

        this.errorMessage =
          err?.error?.message ||
          'Error al cargar suscripciones';

        this.subscriptions = [];
        this.cdr.detectChanges();
      }
    });
  }

  editSubscription(item: any): void {
    alert('Editar suscripción de ' + item.name);
  }

toggleSuspension(item: any): void {
  const newValue = item.is_suspended == 1 ? 0 : 1;

  const payload = {
    plan_id: item.plan_id,
    subscription_status: item.subscription_status || 'ACTIVE',
    subscription_start: item.subscription_start,
    subscription_end: item.subscription_end,
    is_suspended: newValue
  };

  this.subscriptionsService.updateSubscription(item.id, payload).subscribe({
    next: () => {
      this.loadSubscriptions();
    },
    error: (err) => {
      console.error('ERROR UPDATE SUBSCRIPTION:', err);
      alert('No se pudo actualizar la suscripción');
    }
  });
}

  viewHistory(item: any): void {
    alert('Historial de ' + item.name);
  }

  formatMoney(value: any): string {
    return Number(value || 0).toLocaleString('es-CL');
  }

  formatDate(value: any): string {
    if (!value) {
      return '-';
    }

    const date = new Date(value);

    if (isNaN(date.getTime())) {
      return '-';
    }

    return date.toLocaleDateString('es-CL');
  }
}
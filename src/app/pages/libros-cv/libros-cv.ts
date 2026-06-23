import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LibrosCvService } from '../../services/libros-cv-service';
import {
  JournalEntriesService,
  JournalEntryPayload
} from '../../services/journal-entries.service';
import { ConfigurationService } from '../../services/configuration.service';
import { Router } from '@angular/router';
@Component({
  selector: 'app-libros-cv',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './libros-cv.html',
  styleUrl: './libros-cv.scss'
})
export class LibrosCv implements OnInit {

  records: any[] = [];
  selectedBook: any = null;
details: any[] = [];
showDetail = false;
loadingDetailId: number | null = null;
generatingId: number | null = null;
successMsg = '';
  comprasCount = 0;
  ventasCount = 0;
  totalIva = 0;

  loading = false;
  errorMsg = '';

constructor(
  private librosCvService: LibrosCvService,
  private journalEntriesService: JournalEntriesService,
  private configurationService: ConfigurationService,
  private cdr: ChangeDetectorRef,
  private router: Router
) {}

  ngOnInit(): void {
    const selectedCompany = JSON.parse(
      localStorage.getItem('selected_company') || 'null'
    );

    const companyId = Number(
      selectedCompany?.id ||
      localStorage.getItem('company_id') ||
      localStorage.getItem('selected_company_id')
    );

    if (!companyId) {
      this.errorMsg = 'Debe seleccionar una empresa.';
      return;
    }

    this.loadRecords(companyId);
  }

  loadRecords(companyId: number): void {
    this.loading = true;
    this.errorMsg = '';

    this.librosCvService.getRecords(companyId).subscribe({
      next: (resp: any) => {
        const data = Array.isArray(resp) ? resp : (resp.data || []);

        this.records = [...data];

        this.comprasCount = this.records.filter(
          x => String(x.tipo_libro || '').toUpperCase() === 'COMPRA'
        ).length;

        this.ventasCount = this.records.filter(
          x => String(x.tipo_libro || '').toUpperCase() === 'VENTA'
        ).length;

        this.totalIva = 0;
        this.loading = false;

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('LIBROS CV error:', err);
        this.errorMsg = 'No se pudieron cargar los libros de compras y ventas.';
        this.loading = false;

        this.cdr.detectChanges();
      }
    });
  }
  

verDetalle(item: any): void {
  if (this.loadingDetailId === item.id) {
    return;
  }

  this.loadingDetailId = item.id;



  this.librosCvService.getDetail(item.id).subscribe({
    next: (resp: any) => {
      this.selectedBook = resp.libro;
      this.details = resp.detalle || [];
      this.showDetail = true;
      this.loadingDetailId = null;
    },
    error: (err) => {
      console.error('Error detalle libro:', err);
      this.errorMsg = 'No se pudo cargar el detalle del libro.';
      this.loadingDetailId = null;
    }
  });
}


 generarAsientos(item: any): void {
  if (this.generatingId === item.id) return;

  this.errorMsg = '';
  this.successMsg = '';
  this.generatingId = item.id;

  this.configurationService.getAccountMappings(item.company_id).subscribe({
    next: (mappings) => {
      this.librosCvService.getDetail(item.id).subscribe({
        next: (resp: any) => {
          const detalle = resp.detalle || [];
          const tipo = String(item.tipo_libro || '').toUpperCase();

          const getAccountId = (key: string): number | null => {
            const found = mappings.find(m => m.mapping_key === key);
            return found ? Number(found.account_id) : null;
          };

          const toNum = (value: any): number => {
            return Number(value || 0);
          };

          const totalNeto = detalle.reduce((s: number, d: any) => s + toNum(d.monto_neto), 0);
          const totalExento = detalle.reduce((s: number, d: any) => s + toNum(d.monto_exento), 0);
          const totalIva = detalle.reduce((s: number, d: any) => s + toNum(d.monto_iva), 0);
          const totalLibro = detalle.reduce((s: number, d: any) => s + toNum(d.monto_total), 0);

          let payload: JournalEntryPayload | null = null;

          if (tipo === 'VENTA') {
            const clientes = getAccountId('CLIENTES');
            const ventas = getAccountId('VENTAS');
            const ivaDebito = getAccountId('IVA_DEBITO');

            if (!clientes || !ventas || !ivaDebito) {
              this.errorMsg = 'Falta configuración contable para ventas.';
              this.generatingId = null;
              return;
            }

            payload = {
              company_id: item.company_id,
              entry_date: `${item.periodo}-01`,
              entry_type: 'MANUAL',
              description: `Asiento automático libro VENTAS ${item.periodo}`,
              lines: [
               {
  account_id: clientes,
  description: 'Clientes por ventas',
  debit: totalNeto + totalExento + totalIva,
  credit: 0
},
                {
                  account_id: ventas,
                  description: 'Ventas netas y exentas',
                  debit: 0,
                  credit: totalNeto + totalExento
                },
                {
                  account_id: ivaDebito,
                  description: 'IVA débito fiscal',
                  debit: 0,
                  credit: totalIva
                }
              ].filter(l => l.debit > 0 || l.credit > 0)
            };
          }

          if (tipo === 'COMPRA') {
            const proveedores = getAccountId('PROVEEDORES');
            const compras = getAccountId('COMPRAS');
            const ivaCredito = getAccountId('IVA_CREDITO');

            if (!proveedores || !compras || !ivaCredito) {
              this.errorMsg = 'Falta configuración contable para compras.';
              this.generatingId = null;
              return;
            }

            payload = {
              company_id: item.company_id,
              entry_date: `${item.periodo}-01`,
              entry_type: 'MANUAL',
              description: `Asiento automático libro COMPRAS ${item.periodo}`,
              lines: [
                {
                  account_id: compras,
                  description: 'Compras netas y exentas',
                  debit: totalNeto + totalExento,
                  credit: 0
                },
                {
                  account_id: ivaCredito,
                  description: 'IVA crédito fiscal',
                  debit: totalIva,
                  credit: 0
                },
               {
  account_id: proveedores,
  description: 'Proveedores por compras',
  debit: 0,
  credit: totalNeto + totalExento + totalIva
}
              ].filter(l => l.debit > 0 || l.credit > 0)
            };
          }

          if (!payload) {
            this.errorMsg = 'Tipo de libro no reconocido.';
            this.generatingId = null;
            return;
          }
          

const asientoExistenteDescripcion = payload.description;

this.journalEntriesService.getEntries(item.company_id).subscribe({
  next: (entries) => {
    const existe = (entries || []).some(e =>
      String(e.description || '').trim().toUpperCase() ===
      asientoExistenteDescripcion.trim().toUpperCase()
    );

    if (existe) {
      this.errorMsg = 'Ya existe un asiento generado para este libro.';
      this.generatingId = null;
      this.cdr.detectChanges();
      return;
    }

    this.journalEntriesService.createEntry(payload).subscribe({
      next: () => {
        this.successMsg = 'Asiento generado correctamente.';
        this.generatingId = null;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error creando asiento:', err);
        this.errorMsg = err?.error?.message || 'No se pudo generar el asiento.';
        this.generatingId = null;
        this.cdr.detectChanges();
      }
    });
  },
  error: (err) => {
    console.error('Error validando duplicado:', err);
    this.errorMsg = 'No se pudo validar si el asiento ya existe.';
    this.generatingId = null;
    this.cdr.detectChanges();
  }
});
        },
        error: (err) => {
          console.error('Error detalle libro:', err);
          this.errorMsg = 'No se pudo cargar el detalle del libro.';
          this.generatingId = null;
        }
      });
    },
    error: (err) => {
      console.error('Error configuración contable:', err);
      this.errorMsg = 'No se pudo cargar la configuración contable.';
      this.generatingId = null;
    }
  });  
}
goBack(): void {
  this.router.navigate(['/office']);
}
}
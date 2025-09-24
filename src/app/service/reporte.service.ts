import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReporteService {
  private readonly REPORTS_URL = environment.reportsUrl || 'http://localhost:3100/api';

  // Estado para manejar loading y errores
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  public readonly loading$ = this.loadingSubject.asObservable();
  public readonly error$ = this.errorSubject.asObservable();

  constructor(private http: HttpClient) {}

  // ===== REPORTES =====

  /**
   * Generar reporte PDF de cotización
   */
  generarReporteCotizacion(id: string | number): Observable<Blob> {
    this.setLoading(true);

    const headers = new HttpHeaders({
      'Accept': 'application/pdf'
    });

    return this.http.get(`${this.REPORTS_URL}/generate-pdf/${id}`, {
      responseType: 'blob',
      headers
    })
      .pipe(
        map(response => {
          this.setLoading(false);
          this.clearError();
          return response;
        }),
        catchError(error => {
          this.setLoading(false);
          this.setError('Error al generar el reporte PDF');
          throw error;
        })
      );
  }

  /**
   * Generar reporte Excel de cotización
   */
  generarReporteExcelCotizacion(id: string | number): Observable<Blob> {
    this.setLoading(true);

    const headers = new HttpHeaders({
      'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    return this.http.get(`${this.REPORTS_URL}/cotizacion/${id}/excel`, {
      responseType: 'blob',
      headers
    })
      .pipe(
        map(response => {
          this.setLoading(false);
          this.clearError();
          return response;
        }),
        catchError(error => {
          this.setLoading(false);
          this.setError('Error al generar el reporte Excel');
          throw error;
        })
      );
  }

  /**
   * Generar reporte consolidado de cotizaciones (por rango de fechas)
   */
  generarReporteConsolidado(fechaInicio: string, fechaFin: string, formato: 'pdf' | 'excel' = 'pdf'): Observable<Blob> {
    this.setLoading(true);

    const headers = new HttpHeaders({
      'Accept': formato === 'pdf' ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    return this.http.get(`${this.REPORTS_URL}/cotizaciones/consolidado`, {
      responseType: 'blob',
      headers,
      params: {
        fechaInicio,
        fechaFin,
        formato
      }
    })
      .pipe(
        map(response => {
          this.setLoading(false);
          this.clearError();
          return response;
        }),
        catchError(error => {
          this.setLoading(false);
          this.setError('Error al generar el reporte consolidado');
          throw error;
        })
      );
  }

  /**
   * Previsualizar reporte antes de generar
   */
  previsualizarReporte(id: string | number): Observable<any> {
    return this.http.get(`${this.REPORTS_URL}/cotizacion/${id}/preview`)
      .pipe(
        catchError(error => {
          this.setError('Error al previsualizar el reporte');
          throw error;
        })
      );
  }

  // ===== UTILIDADES =====

  /**
   * Descargar archivo blob
   */
  descargarArchivo(blob: Blob, nombreArchivo: string, extension: 'pdf' | 'xlsx' = 'pdf'): void {
    if (blob.size === 0) {
      this.setError('El archivo está vacío');
      return;
    }

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${nombreArchivo}.${extension}`;

    // Agregar al DOM temporalmente para hacer clic
    document.body.appendChild(link);
    link.click();

    // Limpiar
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  /**
   * Generar y descargar reporte PDF automáticamente
   */
  generarYDescargarPDF(id: string | number, nombreBase?: string): Observable<boolean> {
    return new Observable(observer => {
      this.generarReporteCotizacion(id).subscribe({
        next: (blob: Blob) => {
          try {
            const nombre = nombreBase || `cotizacion-${id}`;
            this.descargarArchivo(blob, nombre, 'pdf');
            observer.next(true);
            observer.complete();
          } catch (error) {
            this.setError('Error al descargar el archivo');
            observer.error(error);
          }
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  /**
   * Generar y descargar reporte Excel automáticamente
   */
  generarYDescargarExcel(id: string | number, nombreBase?: string): Observable<boolean> {
    return new Observable(observer => {
      this.generarReporteExcelCotizacion(id).subscribe({
        next: (blob: Blob) => {
          try {
            const nombre = nombreBase || `cotizacion-${id}`;
            this.descargarArchivo(blob, nombre, 'xlsx');
            observer.next(true);
            observer.complete();
          } catch (error) {
            this.setError('Error al descargar el archivo');
            observer.error(error);
          }
        },
        error: (error) => {
          observer.error(error);
        }
      });
    });
  }

  // ===== GESTIÓN DE ESTADO =====

  private setLoading(loading: boolean): void {
    this.loadingSubject.next(loading);
  }

  private setError(error: string | null): void {
    this.errorSubject.next(error);
  }

  private clearError(): void {
    this.errorSubject.next(null);
  }

  // Método público para limpiar errores
  clearErrors(): void {
    this.clearError();
  }
}

import { ReportData } from '@/types/common';
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

export class ReportingService {
  /**
   * Generate Excel export for any report data
   */
  static exportToExcel(
    data: any[], 
    fileName: string, 
    worksheetName: string = 'Report',
    additionalSheets: { name: string; data: any[] }[] = []
  ): void {
    try {
      const wb = XLSX.utils.book_new();

      // Main worksheet
      const ws = XLSX.utils.json_to_sheet(data);
      
      // Set column widths dynamically based on content
      const colWidths = this.calculateColumnWidths(data);
      ws['!cols'] = colWidths;

      XLSX.utils.book_append_sheet(wb, ws, worksheetName);

      // Additional worksheets
      additionalSheets.forEach(sheet => {
        const additionalWs = XLSX.utils.json_to_sheet(sheet.data);
        const additionalColWidths = this.calculateColumnWidths(sheet.data);
        additionalWs['!cols'] = additionalColWidths;
        XLSX.utils.book_append_sheet(wb, additionalWs, sheet.name);
      });

      // Generate file
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([excelBuffer], { 
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
      });

      // Download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${fileName}_${dayjs().format('YYYY-MM-DD')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw new Error('Failed to export to Excel');
    }
  }

  /**
   * Calculate column widths for Excel export
   */
  private static calculateColumnWidths(data: any[]): any[] {
    if (!data.length) return [];

    const headers = Object.keys(data[0]);
    return headers.map(header => {
      const maxLength = Math.max(
        header.length,
        ...data.map(row => String(row[header] || '').length)
      );
      return { wch: Math.min(maxLength + 2, 50) }; // Cap at 50 characters
    });
  }

  /**
   * Export CSV for any data
   */
  static exportToCSV(data: any[], fileName: string): void {
    try {
      if (!data.length) throw new Error('No data to export');

      const headers = Object.keys(data[0]);
      const csvContent = [
        headers.join(','),
        ...data.map(row => 
          headers.map(header => {
            const value = row[header];
            // Escape quotes and wrap in quotes if contains comma
            const stringValue = String(value || '');
            return stringValue.includes(',') ? `"${stringValue.replace(/"/g, '""')}"` : stringValue;
          }).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `${fileName}_${dayjs().format('YYYY-MM-DD')}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      throw new Error('Failed to export to CSV');
    }
  }

  /**
   * Calculate summary statistics for inventory report
   */
  static calculateInventorySummary(items: ReportData[]): ReportData {
    const validItems = items.filter(item => !item.isSummary);
    
    return {
      name: 'SUMMARY',
      sku: '',
      category: '',
      currentQuantity: 0,
      buyingPrice: 0,
      minimumSellPrice: 0,
      currentStockValue: validItems.reduce((sum, item) => sum + item.currentStockValue, 0),
      totalQuantitySold: validItems.reduce((sum, item) => sum + item.totalQuantitySold, 0),
      totalSales: validItems.reduce((sum, item) => sum + item.totalSales, 0),
      totalProfit: validItems.reduce((sum, item) => sum + item.totalProfit, 0),
      profitMargin: '0',
      branch: '',
      minimumStockLevel: 0,
      stockStatus: '',
      isSummary: true,
      totalItems: validItems.length,
      totalStockValue: validItems.reduce((sum, item) => sum + item.currentStockValue, 0),
      outOfStock: validItems.filter(item => item.currentQuantity === 0).length,
      lowStock: validItems.filter(item => 
        item.currentQuantity > 0 && item.currentQuantity < item.minimumStockLevel
      ).length,
      averageProfitMargin: validItems.length > 0 
        ? validItems.reduce((sum, item) => sum + parseFloat(item.profitMargin), 0) / validItems.length
        : 0
    };
  }

  /**
   * Format currency values for display
   */
  static formatCurrency(amount: number, currency: string = 'KES'): string {
    return `${currency} ${amount.toLocaleString()}`;
  }

  /**
   * Filter data by date range
   */
  static filterByDateRange<T extends { saleDate?: string; dateCreated?: string | Date }>(
    data: T[], 
    startDate: dayjs.Dayjs, 
    endDate: dayjs.Dayjs
  ): T[] {
    return data.filter(item => {
      const itemDate = dayjs(item.saleDate || item.dateCreated);
      return itemDate.isAfter(startDate, 'day') && itemDate.isBefore(endDate, 'day');
    });
  }

  /**
   * Group data by field
   */
  static groupBy<T>(data: T[], keyFn: (item: T) => string): Record<string, T[]> {
    return data.reduce((groups, item) => {
      const key = keyFn(item);
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
      return groups;
    }, {} as Record<string, T[]>);
  }

  /**
   * Calculate profit margin percentage
   */
  static calculateProfitMargin(profit: number, revenue: number): string {
    if (revenue === 0) return '0';
    return ((profit / revenue) * 100).toFixed(2);
  }
}

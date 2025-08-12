import { ReportingService } from '@/services/reportingService';
import { ReportData } from '@/types/common';
import dayjs from 'dayjs';
import { useSnackbar } from 'notistack';
import { useState } from 'react';

export const useReporting = () => {
  const { enqueueSnackbar } = useSnackbar();
  const [reportData, setReportData] = useState<ReportData[]>([]);
  const [salesReportData, setSalesReportData] = useState<any[]>([]);
  const [isReportModalVisible, setIsReportModalVisible] = useState(false);
  const [reportDateRange, setReportDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [reportBranch, setReportBranch] = useState<string | null>(null);

  const generateInventoryReport = (items: any[], sales: any[]) => {
    if (!items || !sales) return;

    // Filter sales by date range
    let filteredSales = sales;
    if (reportDateRange) {
      const [startDate, endDate] = reportDateRange;
      filteredSales = ReportingService.filterByDateRange(sales, startDate, endDate);
    }

    // Filter items by branch
    let filteredItems = items;
    if (reportBranch) {
      filteredItems = items.filter(item => item.branchId === reportBranch);
    }

    // Create detailed sales report
    const salesReport = filteredSales.map(sale => {
      const item = items.find(i => i.id === sale.itemId);
      return {
        saleId: sale.id,
        saleDate: sale.saleDate,
        itemId: sale.itemId,
        itemName: sale.itemName || (item ? item.name : 'Unknown'),
        itemCategory: sale.itemCategory || (item ? item.category : 'Unknown'),
        quantitySold: sale.quantitySold,
        sellPrice: sale.sellPrice,
        totalAmount: sale.totalAmount || (sale.sellPrice * sale.quantitySold),
        profit: sale.profit || sale.totalProfit || 0,
        customerName: sale.customerName || 'Walk-in Customer',
        branchName: sale.branchName || (item && item.branch ? item.branch.name : 'Unknown')
      };
    });

    setSalesReportData(salesReport);

    // Calculate total profit from all sales
    const totalSalesProfit = filteredSales.reduce((sum, sale) => 
      sum + (sale.totalProfit || sale.profit || 0), 0
    );

    // Generate item-based report
    const report = filteredItems.map(item => {
      const itemSales = filteredSales.filter(sale => sale.itemId === item.id);
      const totalSales = itemSales.reduce((sum, sale) => 
        sum + (sale.sellPrice * sale.quantitySold), 0
      );
      const totalQuantitySold = itemSales.reduce((sum, sale) => 
        sum + sale.quantitySold, 0
      );
      const totalProfit = itemSales.reduce((sum, sale) => 
        sum + (sale.profit || 0), 0
      );
      const currentStockValue = item.quantity * item.price;

      return {
        name: item.name,
        sku: item.sku,
        category: item.category,
        currentQuantity: item.quantity,
        buyingPrice: item.price,
        minimumSellPrice: item.minimumSellPrice,
        currentStockValue,
        totalQuantitySold,
        totalSales,
        totalProfit,
        profitMargin: ReportingService.calculateProfitMargin(totalProfit, totalSales),
        branch: item.branch?.name,
        minimumStockLevel: item.minimumStockLevel,
        stockStatus: item.quantity === 0
          ? 'Out of Stock'
          : item.quantity < item.minimumStockLevel
            ? 'Low Stock'
            : 'Normal'
      };
    });

    // Add summary
    const summary = ReportingService.calculateInventorySummary(report);
    summary.totalSalesProfit = totalSalesProfit;

    setReportData([...report, summary]);
  };

  const exportInventoryReport = (title: string = 'inventory_report') => {
    try {
      if (!reportData.length) {
        enqueueSnackbar('No data to export', { variant: 'warning' });
        return;
      }

      // Prepare main report data
      const mainReportData = reportData.map(item => {
        if (item.isSummary) {
          return {
            'Name': 'SUMMARY',
            'Total Items': item.totalItems,
            'Out of Stock': item.outOfStock,
            'Low Stock': item.lowStock,
            'Total Stock Value': ReportingService.formatCurrency(item.totalStockValue || 0),
            'Total Sales': ReportingService.formatCurrency(item.totalSales),
            'Total Profit': ReportingService.formatCurrency(item.totalProfit),
            'Average Profit Margin': `${item.averageProfitMargin?.toFixed(2) || 0}%`
          };
        }
        return {
          'Name': item.name,
          'SKU': item.sku,
          'Category': item.category,
          'Branch': item.branch,
          'Current Stock': item.currentQuantity,
          'Buying Price': ReportingService.formatCurrency(item.buyingPrice),
          'Min. Sell Price': ReportingService.formatCurrency(item.minimumSellPrice),
          'Current Stock Value': ReportingService.formatCurrency(item.currentStockValue),
          'Total Quantity Sold': item.totalQuantitySold,
          'Total Sales': ReportingService.formatCurrency(item.totalSales),
          'Total Profit': ReportingService.formatCurrency(item.totalProfit),
          'Profit Margin': `${item.profitMargin}%`,
          'Stock Status': item.stockStatus
        };
      });

      // Prepare sales data
      const salesData = salesReportData.map(sale => ({
        'Date': dayjs(sale.saleDate).format('YYYY-MM-DD HH:mm'),
        'Receipt #': sale.saleId,
        'Customer': sale.customerName,
        'Item': sale.itemName,
        'Category': sale.itemCategory,
        'Quantity': sale.quantitySold,
        'Unit Price': ReportingService.formatCurrency(sale.sellPrice),
        'Total Amount': ReportingService.formatCurrency(sale.totalAmount),
        'Profit': ReportingService.formatCurrency(sale.profit),
        'Branch': sale.branchName
      }));

      // Export with multiple sheets
      const additionalSheets = salesData.length > 0 
        ? [{ name: 'Individual Sales', data: salesData }] 
        : [];

      ReportingService.exportToExcel(
        mainReportData,
        title,
        'Items Summary',
        additionalSheets
      );

      enqueueSnackbar('Report exported successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error exporting report:', error);
      enqueueSnackbar('Failed to export report', { variant: 'error' });
    }
  };

  const exportSalesReport = (salesData: any[], title: string = 'sales_report') => {
    try {
      if (!salesData.length) {
        enqueueSnackbar('No sales data to export', { variant: 'warning' });
        return;
      }

      const exportData = salesData.map(sale => ({
        'Date': dayjs(sale.saleDate).format('YYYY-MM-DD HH:mm'),
        'User': sale.userName,
        'Item': sale.itemName,
        'Branch': sale.branchName,
        'Quantity': sale.quantitySold,
        'Price': ReportingService.formatCurrency(sale.sellPrice),
        'Total': ReportingService.formatCurrency(sale.sellPrice * sale.quantitySold),
        'Profit': ReportingService.formatCurrency(sale.profit || 0)
      }));

      ReportingService.exportToCSV(exportData, title);
      enqueueSnackbar('Sales report exported successfully', { variant: 'success' });
    } catch (error) {
      console.error('Error exporting sales report:', error);
      enqueueSnackbar('Failed to export sales report', { variant: 'error' });
    }
  };

  const openReportModal = () => setIsReportModalVisible(true);
  const closeReportModal = () => {
    setIsReportModalVisible(false);
    setReportDateRange(null);
    setReportBranch(null);
  };

  return {
    reportData,
    salesReportData,
    isReportModalVisible,
    reportDateRange,
    reportBranch,
    setReportDateRange,
    setReportBranch,
    generateInventoryReport,
    exportInventoryReport,
    exportSalesReport,
    openReportModal,
    closeReportModal
  };
};

import { Customer, Sale } from '@/types/common';
import { notification } from 'antd';
import dayjs from 'dayjs';
import jsPDF from 'jspdf';

interface ReceiptOptions {
  format?: 'detailed' | 'simple';
  printInNewTab?: boolean;
}

export const generatePDFReceipt = async (
  sale: Sale, 
  customer?: Customer | null, 
  options: ReceiptOptions = {}
): Promise<void> => {
  // Don't block - process asynchronously
  setTimeout(async () => {
    try {
      const { format = 'detailed', printInNewTab = true } = options;
      const isMultiItem = sale.saleItems && sale.saleItems.length > 1;

      // Show quick loading indicator (non-blocking)
      const loadingKey = `receipt-${Date.now()}`;
      notification.open({
        key: loadingKey,
        message: 'Generating Receipt...',
        description: 'Preparing your receipt for printing.',
        placement: 'bottomRight',
        duration: 2, // Auto-close quickly
      });

      // Create new PDF document (80mm width for thermal printers)
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 200] // Height adjusted for detailed item listing
      });

    // Set font
    pdf.setFont('helvetica');

    let yPosition = 10;
    const pageWidth = 80;
    const margin = 5;
    const contentWidth = pageWidth - (margin * 2);

    // Helper function to add centered text
    const addCenteredText = (text: string, fontSize: number, isBold = false) => {
      pdf.setFontSize(fontSize);
      if (isBold) pdf.setFont('helvetica', 'bold');
      else pdf.setFont('helvetica', 'normal');
      
      const textWidth = pdf.getTextWidth(text);
      const x = (pageWidth - textWidth) / 2;
      pdf.text(text, x, yPosition);
      yPosition += fontSize * 0.5 + 2;
    };

    // Helper function to add left-right text
    const addLeftRightText = (leftText: string, rightText: string, fontSize = 8) => {
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', 'normal');
      
      pdf.text(leftText, margin, yPosition);
      const rightTextWidth = pdf.getTextWidth(rightText);
      pdf.text(rightText, pageWidth - margin - rightTextWidth, yPosition);
      yPosition += fontSize * 0.5 + 1;
    };

    // Helper function to add line
    const addLine = () => {
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 3;
    };

    // Header
    addCenteredText('SALON QUIP', 14, true);
    addCenteredText('Sales Receipt', 10);
    yPosition += 2;
    addLine();

    // Receipt details
    addLeftRightText('Date:', dayjs(sale.saleDate).format('YYYY-MM-DD HH:mm'));
    addLeftRightText('Receipt #:', sale.id.substring(0, 12));
    addLeftRightText('Branch:', sale.branchName || 'N/A');
    addLeftRightText('Served By:', sale.userName || 'N/A');
    
    yPosition += 2;
    addLine();

    // Customer info
    addLeftRightText('Customer:', customer?.name || sale.customerName || 'Walk-in');
    if (customer?.phoneNumber || sale.customerPhone) {
      addLeftRightText('Phone:', customer?.phoneNumber || sale.customerPhone || '');
    }
    
    yPosition += 2;
    addLine();

    // Items section
    addCenteredText('ITEMS', 9, true);
    yPosition += 1;
    
    // List each item with details
    if (sale.saleItems && sale.saleItems.length > 0) {
      sale.saleItems.forEach((item, index) => {
        // Item name
        addLeftRightText(
          `${index + 1}. ${item.itemName}`, 
          `KES ${(item.sellPrice || 0).toLocaleString()}`,
          8
        );
        
        // Quantity and subtotal
        const itemSubtotal = (item.sellPrice || 0) * item.quantitySold;
        addLeftRightText(
          `   Qty: ${item.quantitySold}`, 
          `KES ${itemSubtotal.toLocaleString()}`,
          7
        );
        
        if (index < sale.saleItems.length - 1) {
          yPosition += 1; // Small gap between items
        }
      });
    } else {
      addLeftRightText('No items found', '', 8);
    }

    yPosition += 2;
    addLine();

    // Totals
    addLeftRightText('Subtotal:', `KES ${(sale.totalAmount || 0).toLocaleString()}`);
    
    if ((sale.loyaltyPointsRedeemed || 0) > 0) {
      addLeftRightText('Points Redeemed:', `- KES ${(sale.loyaltyPointsRedeemed || 0).toLocaleString()}`);
    }
    
    pdf.setFont('helvetica', 'bold');
    addLeftRightText('Total Amount:', `KES ${((sale.totalAmount || 0) - (sale.loyaltyPointsRedeemed || 0)).toLocaleString()}`, 9);
    pdf.setFont('helvetica', 'normal');
    
    const paymentMethod = (sale.paymentMethod || 'cash').charAt(0).toUpperCase() + 
                         (sale.paymentMethod || 'cash').slice(1);
    addLeftRightText('Payment:', paymentMethod);

    if ((sale.loyaltyPointsEarned || 0) > 0) {
      addLeftRightText('Points Earned:', `KES ${(sale.loyaltyPointsEarned || 0).toLocaleString()}`);
    }

    yPosition += 3;
    addLine();
    addCenteredText('Thank you for your business!', 8);

    // Close loading notification
    notification.destroy(loadingKey);

    // Generate and handle the PDF (non-blocking)
    if (printInNewTab) {
      const pdfBlob = pdf.output('blob');
      const url = URL.createObjectURL(pdfBlob);
      const newWindow = window.open(url, '_blank');
      
      if (newWindow) {
        newWindow.onload = () => {
          setTimeout(() => newWindow.print(), 100);
        };
        // Clean up after 5 seconds
        setTimeout(() => URL.revokeObjectURL(url), 5000);
      } else {
        notification.error({
          message: 'Print Failed',
          description: 'Check popup blocker settings.',
          placement: 'bottomRight',
          duration: 3
        });
      }
    } else {
      const fileName = `receipt_${sale.id}_${dayjs(sale.saleDate).format('YYYY-MM-DD')}.pdf`;
      pdf.save(fileName);
    }

    } catch (error) {
      console.error('PDF generation failed:', error);
      notification.error({
        message: 'Receipt Generation Failed',
        description: 'Unable to generate receipt. Please try again.',
        placement: 'bottomRight',
        duration: 3
      });
    }
  }, 0); // Execute immediately but asynchronously
};

export const downloadPDFReceipt = (sale: Sale, customer?: Customer | null) => {
  // Non-blocking call
  setTimeout(() => {
    generatePDFReceipt(sale, customer, { printInNewTab: false });
  }, 0);
};

export const printPDFReceipt = (sale: Sale, customer?: Customer | null) => {
  // Non-blocking call
  setTimeout(() => {
    generatePDFReceipt(sale, customer, { printInNewTab: true });
  }, 0);
};

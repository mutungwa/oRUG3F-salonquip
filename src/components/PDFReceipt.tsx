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
      // Start with initial height, will be adjusted based on content
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: [80, 297] // Start with A4 height, will adjust later
      });

    // Set font
    pdf.setFont('helvetica');

    let yPosition = 10;
    const pageWidth = 80;
    const margin = 5;
    const contentWidth = pageWidth - (margin * 2);

    // Remove page break functionality - we'll use dynamic height instead
    // Track maximum Y position for final height calculation
    let maxYPosition = 10;

    // Helper function to add centered text
    const addCenteredText = (text: string, fontSize: number, isBold = false) => {
      const spacing = fontSize <= 9 ? fontSize * 0.4 + 1.5 : fontSize * 0.6 + 2.5;
      
      pdf.setFontSize(fontSize);
      if (isBold) pdf.setFont('helvetica', 'bold');
      else pdf.setFont('helvetica', 'normal');
      
      const textWidth = pdf.getTextWidth(text);
      const x = (pageWidth - textWidth) / 2;
      pdf.text(text, x, yPosition);
      yPosition += spacing;
      maxYPosition = Math.max(maxYPosition, yPosition);
    };

    // Helper function to add left-right text
    const addLeftRightText = (leftText: string, rightText: string, fontSize = 11) => {
      const spacing = fontSize * 0.6 + 1.5;
      
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', 'normal');
      
      pdf.text(leftText, margin, yPosition);
      const rightTextWidth = pdf.getTextWidth(rightText);
      pdf.text(rightText, pageWidth - margin - rightTextWidth, yPosition);
      yPosition += spacing;
      maxYPosition = Math.max(maxYPosition, yPosition);
    };

    // Helper function to add line
    const addLine = () => {
      yPosition += 2; // Add space before line
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 4; // Add space after line
      maxYPosition = Math.max(maxYPosition, yPosition);
    };

    // Header
    addCenteredText('SALON QUIP', 18, true);
    addCenteredText('P.O.Box 6855-00200 Nairobi', 8);
    addCenteredText('Tom Mboya St, Kenha House 1st Floor Rm 4', 8);
    addCenteredText('Next to Afya Center', 8);
    addCenteredText('Tel: 0722707188/0715135405', 8);
    yPosition += 1; // Reduced space before Sales Receipt
    addCenteredText('Sales Receipt', 13);
    addLine();

    // Receipt details
    addLeftRightText('Date:', dayjs(sale.saleDate).format('YYYY-MM-DD HH:mm'));
    addLeftRightText('Receipt #:', sale.id.substring(0, 12));
    addLeftRightText('Branch:', sale.branchName || 'N/A');
    addLeftRightText('Served By:', sale.userName || 'N/A');
    
    addLine();

    // Customer info
    addLeftRightText('Customer:', customer?.name || sale.customerName || 'Walk-in');
    if (customer?.phoneNumber || sale.customerPhone) {
      addLeftRightText('Phone:', customer?.phoneNumber || sale.customerPhone || '');
    }
    if (customer?.loyaltyPoints !== undefined) {
      addLeftRightText('Current Points:', customer.loyaltyPoints.toLocaleString());
    }
    if ((sale.loyaltyPointsEarned || 0) > 0) {
      addLeftRightText('Points Earned:', `+${(sale.loyaltyPointsEarned || 0).toLocaleString()}`);
    }
    
    addLine();

    // Items section
    addCenteredText('ITEMS', 12, true);
    yPosition += 2; // Add space after ITEMS header
    
    // List each item with details
    if (sale.saleItems && sale.saleItems.length > 0) {
      sale.saleItems.forEach((item, index) => {
        // Item name
        addLeftRightText(
          `${index + 1}. ${item.itemName}`, 
          `KES ${(item.sellPrice || 0).toLocaleString()}`,
          10
        );
        
        // Quantity and subtotal
        const itemSubtotal = (item.sellPrice || 0) * item.quantitySold;
        addLeftRightText(
          `   Qty: ${item.quantitySold}`, 
          `KES ${itemSubtotal.toLocaleString()}`,
          9
        );
        
        if (index < sale.saleItems.length - 1) {
          yPosition += 2; // Space between items
          maxYPosition = Math.max(maxYPosition, yPosition);
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
    addLeftRightText('Total Amount:', `KES ${((sale.totalAmount || 0) - (sale.loyaltyPointsRedeemed || 0)).toLocaleString()}`, 11);
    pdf.setFont('helvetica', 'normal');
    
    const paymentMethod = (sale.paymentMethod || 'cash').charAt(0).toUpperCase() + 
                         (sale.paymentMethod || 'cash').slice(1);
    addLeftRightText('Payment:', paymentMethod);

    addLine();
    addCenteredText('Thank you for choosing us to serve you', 10);
    yPosition += 2; // Space before delivery info
    addCenteredText('We do deliveries countrywide', 9);
    addCenteredText('Powered by SalonQuip App', 9);

    // Adjust PDF height to fit content seamlessly (add 10mm bottom margin)
    const finalHeight = maxYPosition + 10;
    
    // Update the PDF page size to match content
    pdf.internal.pageSize.height = finalHeight;

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

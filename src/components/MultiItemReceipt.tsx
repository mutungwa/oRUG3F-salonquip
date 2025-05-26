import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  PDFViewer 
} from '@react-pdf/renderer';
import dayjs from 'dayjs';

// Define styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    textAlign: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 10,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    borderBottomStyle: 'solid',
    marginVertical: 10,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  text: {
    fontSize: 12,
  },
  bold: {
    fontWeight: 'bold',
  },
  itemsTable: {
    marginVertical: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#000000',
    paddingBottom: 5,
    marginBottom: 5,
  },
  tableRow: {
    flexDirection: 'row',
    marginVertical: 3,
  },
  col1: {
    width: '40%',
  },
  col2: {
    width: '15%',
    textAlign: 'center',
  },
  col3: {
    width: '20%',
    textAlign: 'right',
  },
  col4: {
    width: '25%',
    textAlign: 'right',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#000000',
    paddingTop: 5,
  },
  footer: {
    marginTop: 30,
    textAlign: 'center',
  },
  footerText: {
    fontSize: 10,
  },
});

// Define types
interface SaleItem {
  id: string;
  itemName: string;
  itemCategory: string;
  sellPrice: number;
  quantitySold: number;
}

interface Sale {
  id: string;
  saleDate: string;
  branchName: string;
  userName: string;
  customerName?: string;
  customerPhone?: string;
  totalAmount: number;
  loyaltyPointsEarned: number;
  loyaltyPointsRedeemed: number;
  paymentMethod: string;
  paymentReference?: string;
  saleItems: SaleItem[];
}

interface Customer {
  id: string;
  name: string;
  phoneNumber: string;
  loyaltyPoints: number;
}

interface MultiItemReceiptProps {
  sale: Sale;
  customer: Customer | null;
}

// PDF Receipt Component
const PDFReceipt: React.FC<MultiItemReceiptProps> = ({ sale, customer }) => {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>SALON QUIP</Text>
          <Text style={styles.subtitle}>Sales Receipt</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.row}>
          <Text style={styles.text}>Date:</Text>
          <Text style={styles.text}>{dayjs(sale.saleDate).format('YYYY-MM-DD HH:mm')}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.text}>Receipt #:</Text>
          <Text style={styles.text}>{sale.id}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.text}>Branch:</Text>
          <Text style={styles.text}>{sale.branchName}</Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.text}>Served By:</Text>
          <Text style={styles.text}>{sale.userName}</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.row}>
          <Text style={styles.text}>Customer:</Text>
          <Text style={styles.text}>{customer?.name || sale.customerName || 'Walk-in Customer'}</Text>
        </View>
        
        {(customer?.phoneNumber || sale.customerPhone) && (
          <View style={styles.row}>
            <Text style={styles.text}>Phone:</Text>
            <Text style={styles.text}>{customer?.phoneNumber || sale.customerPhone}</Text>
          </View>
        )}
        
        <View style={styles.divider} />
        
        {/* Items Table */}
        <View style={styles.itemsTable}>
          <View style={styles.tableHeader}>
            <Text style={[styles.text, styles.bold, styles.col1]}>Item</Text>
            <Text style={[styles.text, styles.bold, styles.col2]}>Qty</Text>
            <Text style={[styles.text, styles.bold, styles.col3]}>Price</Text>
            <Text style={[styles.text, styles.bold, styles.col4]}>Total</Text>
          </View>
          
          {sale.saleItems.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <Text style={[styles.text, styles.col1]}>{item.itemName}</Text>
              <Text style={[styles.text, styles.col2]}>{item.quantitySold}</Text>
              <Text style={[styles.text, styles.col3]}>KES {item.sellPrice.toLocaleString()}</Text>
              <Text style={[styles.text, styles.col4]}>KES {(item.sellPrice * item.quantitySold).toLocaleString()}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.divider} />
        
        {/* Totals */}
        <View style={styles.row}>
          <Text style={styles.text}>Subtotal:</Text>
          <Text style={styles.text}>KES {sale.totalAmount.toLocaleString()}</Text>
        </View>
        
        {sale.loyaltyPointsRedeemed > 0 && (
          <View style={styles.row}>
            <Text style={styles.text}>Points Redeemed:</Text>
            <Text style={styles.text}>- KES {sale.loyaltyPointsRedeemed.toLocaleString()}</Text>
          </View>
        )}
        
        <View style={styles.row}>
          <Text style={[styles.text, styles.bold]}>Total Amount:</Text>
          <Text style={[styles.text, styles.bold]}>
            KES {(sale.totalAmount - sale.loyaltyPointsRedeemed).toLocaleString()}
          </Text>
        </View>
        
        <View style={styles.row}>
          <Text style={styles.text}>Payment Method:</Text>
          <Text style={styles.text}>
            {sale.paymentMethod.charAt(0).toUpperCase() + sale.paymentMethod.slice(1)}
            {sale.paymentReference ? ` (Ref: ${sale.paymentReference})` : ''}
          </Text>
        </View>
        
        {sale.loyaltyPointsEarned > 0 && (
          <View style={styles.row}>
            <Text style={styles.text}>Loyalty Points Earned:</Text>
            <Text style={styles.text}>KES {sale.loyaltyPointsEarned.toLocaleString()}</Text>
          </View>
        )}
        
        {customer && (
          <View style={styles.row}>
            <Text style={styles.text}>Current Loyalty Balance:</Text>
            <Text style={styles.text}>
              KES {(customer.loyaltyPoints).toLocaleString()}
            </Text>
          </View>
        )}
        
        <View style={styles.footer}>
          <Text style={styles.footerText}>Thank you for your business!</Text>
          <Text style={styles.footerText}>Visit us again soon.</Text>
        </View>
      </Page>
    </Document>
  );
};

// Viewer Component for use in the application
const MultiItemReceipt: React.FC<MultiItemReceiptProps> = (props) => {
  return (
    <PDFViewer width="100%" height="500px">
      <PDFReceipt {...props} />
    </PDFViewer>
  );
};

// Export both components
export { PDFReceipt, MultiItemReceipt };
export default MultiItemReceipt;

import * as XLSX from 'xlsx';
import { Parser } from 'json2csv';

export class ExportService {
  static async exportToExcel(data: any[], filename: string): Promise<Buffer> {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Sheet1');

    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
    return buffer;
  }

  static async exportToCSV(data: any[], fields: string[]): Promise<string> {
    const parser = new Parser({ fields });
    return parser.parse(data);
  }

  static formatLeadData(leads: any[]): any[] {
    return leads.map((lead) => ({
      'Lead ID': lead.leadId,
      'Lead Number': lead.leadNumber,
      Date: new Date(lead.date).toLocaleDateString(),
      'Customer Name': lead.customerName,
      'Description': lead.description || '',
      'Phone Number': lead.phoneNumber,
      Email: lead.customerEmail,
      Status: lead.status,
      'Product Name': lead.productName || '',
      'Sales Price': lead.salesPrice || 0,
      'Assigned Agent': lead.assignedAgent?.name || '',
      'Created Date': new Date(lead.createdAt).toLocaleDateString(),
    }));
  }

  static formatVendorOrderData(orders: any[]): any[] {
    return orders.map((order) => ({
      'Order Number': order.orderNo,
      Date: new Date(order.date).toLocaleDateString(),
      'Shop/Vendor Name': order.shopName,
      'Vendor Address': order.vendorAddress,
      'Customer Name': order.customerName || '',
      'Order Status': order.orderStatus,
      'Grand Total': order.grandTotal || 0,
      'Product Name': order.productName || '',
      'Tracking ID': order.trackingId || '',
      'Created Date': new Date(order.createdAt).toLocaleDateString(),
    }));
  }

  static formatPaymentData(payments: any[]): any[] {
    return payments.map((payment) => ({
      'Payment ID': payment.paymentId,
      'Customer Name': payment.customerName,
      'Payment Date': new Date(payment.paymentDate).toLocaleDateString(),
      'Sales Price': payment.salesPrice,
      'Mode of Payment': payment.modeOfPayment,
      'Payment Status': payment.paymentStatus,
      'Total Margin': payment.totalMargin || 0,
      Refunded: payment.refunded || 0,
      'Created Date': new Date(payment.createdAt).toLocaleDateString(),
    }));
  }

  static formatSalesData(sales: any[]): any[] {
    return sales.map((sale) => ({
      'Sale ID': sale.saleId,
      'Customer Name': sale.customerName,
      'Customer Email': sale.customerEmail,
      'Phone Number': sale.phoneNumber,
      'Product Name': sale.productName || '',
      'Sales Price': sale.salesPrice || 0,
      Status: sale.status,
      'Order Confirmation Sent': sale.orderConfirmationSent ? 'Yes' : 'No',
      'Delivery Confirmation Sent': sale.deliveryConfirmationSent
        ? 'Yes'
        : 'No',
      'Assigned Agent': sale.assignedAgent?.name || '',
      'Created Date': new Date(sale.createdAt).toLocaleDateString(),
    }));
  }
}

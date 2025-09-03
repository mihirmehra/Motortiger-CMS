'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { generateProductId } from '@/utils/idGenerator';
import NotesSection from '@/components/ui/notes-section';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

interface Product {
  productId: string;
  productName: string;
  productAmount: string;
  quantity: string;
  vin: string;
  mileageQuote: string;
  yearOfMfg: string;
  make: string;
  model: string;
  specification: string;
  attention: string;
  warranty: string;
  miles: string;
  vendorInfo?: {
    vendorName?: string;
    vendorLocation?: string;
    recycler?: string;
    modeOfPaymentToRecycler?: string;
    dateOfBooking?: string;
    dateOfDelivery?: string;
    trackingNumber?: string;
    shippingCompany?: string;
    fedexTracking?: string;
  };
}

interface Lead {
  _id: string;
  leadId: string;
  leadNumber: string;
  customerName: string;
  customerEmail: string;
  phoneNumber: string;
  alternateNumber?: string;
  status: string;
  assignedAgent: {
    _id: string;
    name: string;
    email: string;
  };
  billingAddress?: string;
  shippingAddress?: string;
  mechanicName?: string;
  contactPhone?: string;
  state?: string;
  zone?: string;
  callType?: string;
  products: Product[];
  // Payment fields
  modeOfPayment?: string;
  paymentPortal?: string;
  cardNumber?: string;
  expiry?: string;
  paymentDate?: string;
  salesPrice?: number;
  pendingBalance?: number;
  costPrice?: number;
  refunded?: number;
  disputeCategory?: string;
  disputeReason?: string;
  disputeDate?: string;
  disputeResult?: string;
  refundDate?: string;
  refundTAT?: string;
  arn?: string;
  refundCredited?: number;
  chargebackAmount?: number;
  notes: any[];
}

export default function EditLeadPage() {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [lead, setLead] = useState<Lead | null>(null);
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    phoneNumber: '',
    alternateNumber: '',
    assignedAgent: '',
    status: 'New',
    billingAddress: '',
    shippingAddress: '',
    mechanicName: '',
    contactPhone: '',
    state: '',
    zone: '',
    callType: ''
  });
  const [paymentData, setPaymentData] = useState({
    modeOfPayment: '',
    paymentPortal: '',
    cardNumber: '',
    expiry: '',
    paymentDate: '',
    salesPrice: '',
    pendingBalance: '',
    costPrice: '',
    refunded: '',
    disputeCategory: '',
    disputeReason: '',
    disputeDate: '',
    disputeResult: '',
    refundDate: '',
    refundTAT: '',
    arn: '',
    refundCredited: '',
    chargebackAmount: ''
  });
  const [products, setProducts] = useState<Product[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const router = useRouter();
  const params = useParams();

  const statusOptions = [
    'New', 'Connected', 'Nurturing', 'Waiting for respond', 'Follow up', 'Desision Follow up', 'Payment Follow up',
    'Customer Waiting for respond', 'Payment Under Process',
    'Customer making payment', 'Sale Payment Done', 'Sale Closed'
  ];

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      const user = JSON.parse(userData);
      setCurrentUser(user);
      loadAvailableUsers(user);
    }
    
    if (params.id) {
      loadLead();
    }
  }, [params.id]);

  const loadAvailableUsers = async (user: User) => {
    try {
      const token = localStorage.getItem('token');
      
      let url = '/api/users';
      if (user.role === 'manager') {
        url = `/api/users/assignment-options?managerId=${user._id}`;
      } else if (user.role === 'admin') {
        url = '/api/users?role=manager,agent';
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAvailableUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to load available users:', error);
    }
  };

  const loadLead = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/leads/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const leadData = data.lead;
        setLead(leadData);
        
        // Set form data
        setFormData({
          customerName: leadData.customerName || '',
          customerEmail: leadData.customerEmail || '',
          phoneNumber: leadData.phoneNumber || '',
          alternateNumber: leadData.alternateNumber || '',
          assignedAgent: leadData.assignedAgent?._id || '',
          status: leadData.status || 'New',
          billingAddress: leadData.billingAddress || '',
          shippingAddress: leadData.shippingAddress || '',
          mechanicName: leadData.mechanicName || '',
          contactPhone: leadData.contactPhone || '',
          state: leadData.state || '',
          zone: leadData.zone || '',
          callType: leadData.callType || ''
        });

        // Set payment data
        setPaymentData({
          modeOfPayment: leadData.modeOfPayment || '',
          paymentPortal: leadData.paymentPortal || '',
          cardNumber: leadData.cardNumber || '',
          expiry: leadData.expiry || '',
          paymentDate: leadData.paymentDate ? new Date(leadData.paymentDate).toISOString().split('T')[0] : '',
          salesPrice: leadData.salesPrice?.toString() || '',
          pendingBalance: leadData.pendingBalance?.toString() || '',
          costPrice: leadData.costPrice?.toString() || '',
          refunded: leadData.refunded?.toString() || '',
          disputeCategory: leadData.disputeCategory || '',
          disputeReason: leadData.disputeReason || '',
          disputeDate: leadData.disputeDate ? new Date(leadData.disputeDate).toISOString().split('T')[0] : '',
          disputeResult: leadData.disputeResult || '',
          refundDate: leadData.refundDate ? new Date(leadData.refundDate).toISOString().split('T')[0] : '',
          refundTAT: leadData.refundTAT || '',
          arn: leadData.arn || '',
          refundCredited: leadData.refundCredited?.toString() || '',
          chargebackAmount: leadData.chargebackAmount?.toString() || ''
        });

        // Set products
        const processedProducts = (leadData.products || []).map((product: any) => ({
          productId: product.productId || generateProductId(),
          productName: product.productName || '',
          productAmount: product.productAmount?.toString() || '',
          quantity: product.quantity?.toString() || '1',
          vin: product.vin || '',
          mileageQuote: product.mileageQuote || '',
          yearOfMfg: product.yearOfMfg || '',
          make: product.make || '',
          model: product.model || '',
          specification: product.specification || '',
          attention: product.attention || '',
          warranty: product.warranty || '',
          miles: product.miles || '',
          vendorInfo: {
            vendorName: product.vendorInfo?.vendorName || '',
            vendorLocation: product.vendorInfo?.vendorLocation || '',
            recycler: product.vendorInfo?.recycler || '',
            modeOfPaymentToRecycler: product.vendorInfo?.modeOfPaymentToRecycler || '',
            dateOfBooking: product.vendorInfo?.dateOfBooking ? new Date(product.vendorInfo.dateOfBooking).toISOString().split('T')[0] : '',
            dateOfDelivery: product.vendorInfo?.dateOfDelivery ? new Date(product.vendorInfo.dateOfDelivery).toISOString().split('T')[0] : '',
            trackingNumber: product.vendorInfo?.trackingNumber || '',
            shippingCompany: product.vendorInfo?.shippingCompany || '',
            fedexTracking: product.vendorInfo?.fedexTracking || ''
          }
        }));
        
        // Ensure at least one product exists
        if (processedProducts.length === 0) {
          processedProducts.push({
            productId: generateProductId(),
            productName: '',
            productAmount: '',
            quantity: '1',
            vin: '',
            mileageQuote: '',
            mileage: '',
            yearOfMfg: '',
            make: '',
            model: '',
            specification: '',
            attention: '',
            warranty: '',
            miles: '',
            vendorInfo: {
              vendorName: '',
              vendorLocation: '',
              recycler: '',
              modeOfPaymentToRecycler: '',
              dateOfBooking: '',
              dateOfDelivery: '',
              trackingNumber: '',
              shippingCompany: '',
              fedexTracking: ''
            }
          });
        }
        
        setProducts(processedProducts);
        setNotes(leadData.notes || []);

      } else {
        console.error('Failed to load lead');
        router.push('/dashboard/leads');
      }
    } catch (error) {
      console.error('Error loading lead:', error);
      router.push('/dashboard/leads');
    } finally {
      setLoadingData(false);
    }
  };

  const addProduct = () => {
    setProducts([...products, {
      productId: generateProductId(),
      productName: '',
      productAmount: '',
      quantity: '1',
      vin: '',
      mileageQuote: '',
      yearOfMfg: '',
      make: '',
      model: '',
      specification: '',
      attention: '',
      warranty: '',
      miles: '',
      vendorInfo: {
        vendorName: '',
        vendorLocation: '',
        recycler: '',
        modeOfPaymentToRecycler: '',
        dateOfBooking: '',
        dateOfDelivery: '',
        trackingNumber: '',
        shippingCompany: '',
        fedexTracking: ''
      }
    }]);
  };

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const updateProduct = (index: number, field: string, value: string) => {
    const updatedProducts = [...products];
    if (field.startsWith('vendorInfo.')) {
      const vendorField = field.replace('vendorInfo.', '');
      updatedProducts[index] = {
        ...updatedProducts[index],
        vendorInfo: {
          ...updatedProducts[index].vendorInfo,
          [vendorField]: value
        }
      };
    } else {
      updatedProducts[index] = { ...updatedProducts[index], [field]: value };
    }
    setProducts(updatedProducts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Prepare products data
      const productsData = products.filter(product => product.productName.trim()).map(product => ({
        productId: product.productId,
        productName: product.productName || undefined,
        productAmount: product.productAmount ? parseFloat(product.productAmount) : undefined,
        quantity: product.quantity ? parseInt(product.quantity) : 1,
        vin: product.vin || undefined,
        mileageQuote: product.mileageQuote || undefined,
        yearOfMfg: product.yearOfMfg || undefined,
        make: product.make || undefined,
        model: product.model || undefined,
        specification: product.specification || undefined,
        attention: product.attention || undefined,
        warranty: product.warranty || undefined,
        miles: product.miles || undefined,
        vendorInfo: (product.vendorInfo?.vendorName || product.vendorInfo?.vendorLocation) ? {
          vendorName: product.vendorInfo?.vendorName || undefined,
          vendorLocation: product.vendorInfo?.vendorLocation || undefined,
          recycler: product.vendorInfo?.recycler || undefined,
          modeOfPaymentToRecycler: product.vendorInfo?.modeOfPaymentToRecycler || undefined,
          dateOfBooking: product.vendorInfo?.dateOfBooking || undefined,
          dateOfDelivery: product.vendorInfo?.dateOfDelivery || undefined,
          trackingNumber: product.vendorInfo?.trackingNumber || undefined,
          shippingCompany: product.vendorInfo?.shippingCompany || undefined,
          fedexTracking: product.vendorInfo?.fedexTracking || undefined,
        } : undefined
      }));

      // Prepare payment data
      const paymentFields = Object.values(paymentData).some(value => value !== '');
      const paymentDataToSend = paymentFields ? {
        modeOfPayment: paymentData.modeOfPayment || undefined,
        paymentPortal: paymentData.paymentPortal || undefined,
        cardNumber: paymentData.cardNumber || undefined,
        expiry: paymentData.expiry || undefined,
        paymentDate: paymentData.paymentDate || undefined,
        disputeCategory: paymentData.disputeCategory || undefined,
        disputeReason: paymentData.disputeReason || undefined,
        disputeDate: paymentData.disputeDate || undefined,
        disputeResult: paymentData.disputeResult || undefined,
        refundDate: paymentData.refundDate || undefined,
        refundTAT: paymentData.refundTAT || undefined,
        arn: paymentData.arn || undefined,
        salesPrice: paymentData.salesPrice ? parseFloat(paymentData.salesPrice) : undefined,
        pendingBalance: paymentData.pendingBalance ? parseFloat(paymentData.pendingBalance) : undefined,
        costPrice: paymentData.costPrice ? parseFloat(paymentData.costPrice) : undefined,
        refunded: paymentData.refunded ? parseFloat(paymentData.refunded) : undefined,
        refundCredited: paymentData.refundCredited ? parseFloat(paymentData.refundCredited) : undefined,
        chargebackAmount: paymentData.chargebackAmount ? parseFloat(paymentData.chargebackAmount) : undefined,
      } : {};
      
      const submitData = {
        ...formData,
        ...paymentDataToSend,
        products: productsData,
      };

      const response = await fetch(`/api/leads/${params.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        router.push(`/dashboard/leads/${params.id}`);
      } else {
        const data = await response.json();
        console.error('Validation errors:', data.details);
        if (data.details && Array.isArray(data.details)) {
          alert(`Validation failed:\n${data.details.join('\n')}`);
        } else {
          alert(data.error || 'Failed to update lead. Please check all required fields.');
        }
      }
    } catch (error) {
      console.error('Error updating lead:', error);
      alert('Failed to update lead');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handlePaymentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setPaymentData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (loadingData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lead data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push(`/dashboard/leads/${params.id}`)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Lead
            </Button>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900">Edit Lead</h1>
          <p className="text-gray-600">Update lead information and details</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleChange}
                    required
                    className="mt-1"
                    placeholder="Enter customer's full name"
                  />
                </div>

                <div>
                  <Label htmlFor="customerEmail">Customer Email *</Label>
                  <Input
                    id="customerEmail"
                    name="customerEmail"
                    type="email"
                    value={formData.customerEmail}
                    onChange={handleChange}
                    className="mt-1"
                    placeholder="customer@example.com"
                  />
                </div>

                <div>
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    required
                    className="mt-1"
                    placeholder="+1234567890"
                  />
                </div>

                <div>
                  <Label htmlFor="alternateNumber">Alternate Number</Label>
                  <Input
                    id="alternateNumber"
                    name="alternateNumber"
                    value={formData.alternateNumber}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {statusOptions.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="assignedAgent">Assigned Agent</Label>
                  <select
                    id="assignedAgent"
                    name="assignedAgent"
                    value={formData.assignedAgent}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Keep current assignment</option>
                    {availableUsers.map(user => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.email}) - {user.role}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes Section */}
          <NotesSection
            leadId={params.id as string}
            notes={notes}
            onNoteAdded={(note) => setNotes(prev => [...prev, note])}
          />

          {/* Address Information */}
          <Card>
            <CardHeader>
              <CardTitle>Address & Contact Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="billingAddress">Billing Address</Label>
                  <Input
                    id="billingAddress"
                    name="billingAddress"
                    value={formData.billingAddress}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="shippingAddress">Shipping Address</Label>
                  <Input
                    id="shippingAddress"
                    name="shippingAddress"
                    value={formData.shippingAddress}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="mechanicName">Mechanic Name</Label>
                  <Input
                    id="mechanicName"
                    name="mechanicName"
                    value={formData.mechanicName}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    name="contactPhone"
                    value={formData.contactPhone}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="zone">Zone</Label>
                  <Input
                    id="zone"
                    name="zone"
                    value={formData.zone}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="callType">Call Type</Label>
                  <Input
                    id="callType"
                    name="callType"
                    value={formData.callType}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Products Section */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Products</CardTitle>
                <Button
                  type="button"
                  onClick={addProduct}
                  className="flex items-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add Product
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                {products.map((product, index) => (
                  <div key={product.productId} className="border rounded-lg p-6 relative">
                    {products.length > 1 && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeProduct(index)}
                        className="absolute top-4 right-4 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <h4 className="text-lg font-semibold mb-4">Product {index + 1}</h4>
                    
                    {/* Product Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                      <div>
                        <Label>Product Name</Label>
                        <Input
                          value={product.productName}
                          onChange={(e) => updateProduct(index, 'productName', e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Product Amount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={product.productAmount}
                          onChange={(e) => updateProduct(index, 'productAmount', e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          value={product.quantity}
                          onChange={(e) => updateProduct(index, 'quantity', e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>VIN</Label>
                        <Input
                          value={product.vin}
                          onChange={(e) => updateProduct(index, 'vin', e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Year of Manufacturing</Label>
                        <Input
                          value={product.yearOfMfg}
                          onChange={(e) => updateProduct(index, 'yearOfMfg', e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Make</Label>
                        <Input
                          value={product.make}
                          onChange={(e) => updateProduct(index, 'make', e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Model</Label>
                        <Input
                          value={product.model}
                          onChange={(e) => updateProduct(index, 'model', e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Specification</Label>
                        <Input
                          value={product.specification}
                          onChange={(e) => updateProduct(index, 'specification', e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Mileage Quote</Label>
                        <Input
                          value={product.mileageQuote}
                          onChange={(e) => updateProduct(index, 'mileageQuote', e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Attention</Label>
                        <Input
                          value={product.attention}
                          onChange={(e) => updateProduct(index, 'attention', e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Warranty</Label>
                        <Input
                          value={product.warranty}
                          onChange={(e) => updateProduct(index, 'warranty', e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Miles</Label>
                        <Input
                          value={product.miles}
                          onChange={(e) => updateProduct(index, 'miles', e.target.value)}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    {/* Vendor Information for this Product */}
                    <div className="border-t pt-4">
                      <h5 className="font-medium mb-3 text-gray-700">Vendor Information for this Product</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Vendor Name</Label>
                          <Input
                            value={product.vendorInfo?.vendorName || ''}
                            onChange={(e) => updateProduct(index, 'vendorInfo.vendorName', e.target.value)}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label>Vendor Location</Label>
                          <Input
                            value={product.vendorInfo?.vendorLocation || ''}
                            onChange={(e) => updateProduct(index, 'vendorInfo.vendorLocation', e.target.value)}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label>Recycler</Label>
                          <Input
                            value={product.vendorInfo?.recycler || ''}
                            onChange={(e) => updateProduct(index, 'vendorInfo.recycler', e.target.value)}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label>Mode of Payment to Recycler</Label>
                          <Input
                            value={product.vendorInfo?.modeOfPaymentToRecycler || ''}
                            onChange={(e) => updateProduct(index, 'vendorInfo.modeOfPaymentToRecycler', e.target.value)}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label>Date of Booking</Label>
                          <Input
                            type="date"
                            value={product.vendorInfo?.dateOfBooking || ''}
                            onChange={(e) => updateProduct(index, 'vendorInfo.dateOfBooking', e.target.value)}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label>Date of Delivery</Label>
                          <Input
                            type="date"
                            value={product.vendorInfo?.dateOfDelivery || ''}
                            onChange={(e) => updateProduct(index, 'vendorInfo.dateOfDelivery', e.target.value)}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label>Tracking Number</Label>
                          <Input
                            value={product.vendorInfo?.trackingNumber || ''}
                            onChange={(e) => updateProduct(index, 'vendorInfo.trackingNumber', e.target.value)}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label>Shipping Company</Label>
                          <Input
                            value={product.vendorInfo?.shippingCompany || ''}
                            onChange={(e) => updateProduct(index, 'vendorInfo.shippingCompany', e.target.value)}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label>FedEx Tracking</Label>
                          <Input
                            value={product.vendorInfo?.fedexTracking || ''}
                            onChange={(e) => updateProduct(index, 'vendorInfo.fedexTracking', e.target.value)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Customer Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Customer Payment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="modeOfPayment">Mode of Payment</Label>
                  <Input
                    id="modeOfPayment"
                    name="modeOfPayment"
                    value={paymentData.modeOfPayment}
                    onChange={handlePaymentChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="paymentPortal">Payment Portal</Label>
                  <select
                    id="paymentPortal"
                    name="paymentPortal"
                    value={paymentData.paymentPortal}
                    onChange={handlePaymentChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Portal</option>
                    <option value="EasyPayDirect">EasyPayDirect</option>
                    <option value="Authorize.net">Authorize.net</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="cardNumber">Card Number</Label>
                  <Input
                    id="cardNumber"
                    name="cardNumber"
                    value={paymentData.cardNumber}
                    onChange={handlePaymentChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="expiry">Expiry</Label>
                  <Input
                    id="expiry"
                    name="expiry"
                    value={paymentData.expiry}
                    onChange={handlePaymentChange}
                    placeholder="MM/YY"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="paymentDate">Payment Date</Label>
                  <Input
                    id="paymentDate"
                    name="paymentDate"
                    type="date"
                    value={paymentData.paymentDate}
                    onChange={handlePaymentChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="salesPrice">Sales Price</Label>
                  <Input
                    id="salesPrice"
                    name="salesPrice"
                    type="number"
                    step="0.01"
                    value={paymentData.salesPrice}
                    onChange={handlePaymentChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="costPrice">Cost Price</Label>
                  <Input
                    id="costPrice"
                    name="costPrice"
                    type="number"
                    step="0.01"
                    value={paymentData.costPrice}
                    onChange={handlePaymentChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="pendingBalance">Pending Balance</Label>
                  <Input
                    id="pendingBalance"
                    name="pendingBalance"
                    type="number"
                    step="0.01"
                    value={paymentData.pendingBalance}
                    onChange={handlePaymentChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="refunded">Refunded</Label>
                  <Input
                    id="refunded"
                    name="refunded"
                    type="number"
                    step="0.01"
                    value={paymentData.refunded}
                    onChange={handlePaymentChange}
                    className="mt-1"
                  />
                </div>
              </div>

              {/* Dispute Information */}
              <div className="mt-6">
                <h4 className="text-lg font-medium mb-4">Dispute Information (Optional)</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Label htmlFor="disputeCategory">Dispute Category</Label>
                    <Input
                      id="disputeCategory"
                      name="disputeCategory"
                      value={paymentData.disputeCategory}
                      onChange={handlePaymentChange}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="disputeReason">Dispute Reason</Label>
                    <Input
                      id="disputeReason"
                      name="disputeReason"
                      value={paymentData.disputeReason}
                      onChange={handlePaymentChange}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="disputeDate">Dispute Date</Label>
                    <Input
                      id="disputeDate"
                      name="disputeDate"
                      type="date"
                      value={paymentData.disputeDate}
                      onChange={handlePaymentChange}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="disputeResult">Dispute Result</Label>
                    <Input
                      id="disputeResult"
                      name="disputeResult"
                      value={paymentData.disputeResult}
                      onChange={handlePaymentChange}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="refundDate">Refund Date</Label>
                    <Input
                      id="refundDate"
                      name="refundDate"
                      type="date"
                      value={paymentData.refundDate}
                      onChange={handlePaymentChange}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="arn">ARN</Label>
                    <Input
                      id="arn"
                      name="arn"
                      value={paymentData.arn}
                      onChange={handlePaymentChange}
                      className="mt-1"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/dashboard/leads/${params.id}`)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Updating...' : 'Update Lead'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
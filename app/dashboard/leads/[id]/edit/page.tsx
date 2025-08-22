'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';

interface Lead {
  _id: string;
  customerName: string;
  customerEmail: string;
  phoneNumber: string;
  alternateNumber?: string;
  status: string;
  assignedAgent: string;
  productName?: string;
  productAmount?: number;
  quantity?: number;
  billingAddress?: string;
  shippingAddress?: string;
  mechanicName?: string;
  contactPhone?: string;
  state?: string;
  zone?: string;
  callType?: string;
  vin?: string;
  mileageQuote?: string;
  yearOfMfg?: string;
  make?: string;
  model?: string;
  specification?: string;
  attention?: string;
  warranty?: string;
  miles?: string;
  recycler?: string;
  modeOfPaymentToRecycler?: string;
  dateOfBooking?: string;
  dateOfDelivery?: string;
  trackingNumber?: string;
  shippingCompany?: string;
  modeOfPayment?: string;
  fedexTracking?: string;
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
}

interface User {
  _id: string;
  name: string;
  email: string;
}

export default function EditLeadPage() {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [agents, setAgents] = useState<User[]>([]);
  const [formData, setFormData] = useState<Partial<Lead>>({});
  const router = useRouter();
  const params = useParams();

  const statusOptions = [
    'New', 'Connected', 'Nurturing', 'Waiting for respond',
    'Customer Waiting for respond', 'Payment Under Process',
    'Customer making payment', 'Sale Payment Done', 'Sale Closed'
  ];

  const paymentPortalOptions = ['EasyPayDirect', 'Authorize.net'];

  useEffect(() => {
    if (params.id) {
      loadLead();
      loadAgents();
    }
  }, [params.id]);

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
        setFormData({
          ...data.lead,
          assignedAgent: data.lead.assignedAgent._id,
          dateOfBooking: data.lead.dateOfBooking ? new Date(data.lead.dateOfBooking).toISOString().split('T')[0] : '',
          dateOfDelivery: data.lead.dateOfDelivery ? new Date(data.lead.dateOfDelivery).toISOString().split('T')[0] : '',
          paymentDate: data.lead.paymentDate ? new Date(data.lead.paymentDate).toISOString().split('T')[0] : '',
          disputeDate: data.lead.disputeDate ? new Date(data.lead.disputeDate).toISOString().split('T')[0] : '',
          refundDate: data.lead.refundDate ? new Date(data.lead.refundDate).toISOString().split('T')[0] : ''
        });
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

  const loadAgents = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users?role=agent', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAgents(data.users);
      }
    } catch (error) {
      console.error('Failed to load agents:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/leads/${params.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        router.push(`/dashboard/leads/${params.id}`);
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to update lead');
      }
    } catch (error) {
      console.error('Error updating lead:', error);
      alert('Failed to update lead');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? undefined : value
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
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="customerName">Customer Name *</Label>
                  <Input
                    id="customerName"
                    name="customerName"
                    value={formData.customerName || ''}
                    onChange={handleChange}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="customerEmail">Customer Email *</Label>
                  <Input
                    id="customerEmail"
                    name="customerEmail"
                    type="email"
                    value={formData.customerEmail || ''}
                    onChange={handleChange}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="phoneNumber">Phone Number *</Label>
                  <Input
                    id="phoneNumber"
                    name="phoneNumber"
                    value={formData.phoneNumber || ''}
                    onChange={handleChange}
                    required
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="alternateNumber">Alternate Number</Label>
                  <Input
                    id="alternateNumber"
                    name="alternateNumber"
                    value={formData.alternateNumber || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <select
                    id="status"
                    name="status"
                    value={formData.status || ''}
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
                    value={formData.assignedAgent || ''}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Agent</option>
                    {agents.map(agent => (
                      <option key={agent._id} value={agent._id}>
                        {agent.name} ({agent.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Information */}
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="productName">Product Name</Label>
                  <Input
                    id="productName"
                    name="productName"
                    value={formData.productName || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="productAmount">Product Amount</Label>
                  <Input
                    id="productAmount"
                    name="productAmount"
                    type="number"
                    step="0.01"
                    value={formData.productAmount || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="quantity">Quantity</Label>
                  <Input
                    id="quantity"
                    name="quantity"
                    type="number"
                    value={formData.quantity || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="vin">VIN</Label>
                  <Input
                    id="vin"
                    name="vin"
                    value={formData.vin || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="yearOfMfg">Year of Manufacturing</Label>
                  <Input
                    id="yearOfMfg"
                    name="yearOfMfg"
                    value={formData.yearOfMfg || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="make">Make</Label>
                  <Input
                    id="make"
                    name="make"
                    value={formData.make || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="model">Model</Label>
                  <Input
                    id="model"
                    name="model"
                    value={formData.model || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="specification">Specification</Label>
                  <Input
                    id="specification"
                    name="specification"
                    value={formData.specification || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="mileageQuote">Mileage Quote</Label>
                  <Input
                    id="mileageQuote"
                    name="mileageQuote"
                    value={formData.mileageQuote || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Information */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <Label htmlFor="salesPrice">Sales Price</Label>
                  <Input
                    id="salesPrice"
                    name="salesPrice"
                    type="number"
                    step="0.01"
                    value={formData.salesPrice || ''}
                    onChange={handleChange}
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
                    value={formData.costPrice || ''}
                    onChange={handleChange}
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
                    value={formData.pendingBalance || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="modeOfPayment">Mode of Payment</Label>
                  <Input
                    id="modeOfPayment"
                    name="modeOfPayment"
                    value={formData.modeOfPayment || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="paymentPortal">Payment Portal</Label>
                  <select
                    id="paymentPortal"
                    name="paymentPortal"
                    value={formData.paymentPortal || ''}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Portal</option>
                    {paymentPortalOptions.map(portal => (
                      <option key={portal} value={portal}>{portal}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="paymentDate">Payment Date</Label>
                  <Input
                    id="paymentDate"
                    name="paymentDate"
                    type="date"
                    value={formData.paymentDate || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

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
                    value={formData.billingAddress || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="shippingAddress">Shipping Address</Label>
                  <Input
                    id="shippingAddress"
                    name="shippingAddress"
                    value={formData.shippingAddress || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="mechanicName">Mechanic Name</Label>
                  <Input
                    id="mechanicName"
                    name="mechanicName"
                    value={formData.mechanicName || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="contactPhone">Contact Phone</Label>
                  <Input
                    id="contactPhone"
                    name="contactPhone"
                    value={formData.contactPhone || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    name="state"
                    value={formData.state || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="zone">Zone</Label>
                  <Input
                    id="zone"
                    name="zone"
                    value={formData.zone || ''}
                    onChange={handleChange}
                    className="mt-1"
                  />
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
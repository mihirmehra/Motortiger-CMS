'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { generateProductId } from '@/utils/idGenerator';
import FollowupModal, { FollowupData } from '@/components/ui/followup-modal';

interface Lead {
  _id: string;
  leadNumber?: string;
  customerName: string;
  customerEmail: string;
  phoneNumber: string;
  alternateNumber?: string;
  status: string;
  assignedAgent: string;
  billingAddress?: string;
  shippingAddress?: string;
  mechanicName?: string;
  contactPhone?: string;
  state?: string;
  zone?: string;
  callType?: string;
  products: Array<{
    productId: string;
    productName: string;
    productAmount?: number;
    quantity?: number;
    vin?: string;
    mileageQuote?: string;
    yearOfMfg?: string;
    make?: string;
    model?: string;
    specification?: string;
    vendorInfo?: {
      vendorName?: string;
      vendorLocation?: string;
      recycler?: string;
      shippingCompany?: string;
      trackingNumber?: string;
    };
  }>;
}

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export default function EditLeadPage() {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentAssignedUser, setCurrentAssignedUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<Partial<Lead>>({});
  const [showFollowupModal, setShowFollowupModal] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<string>('');
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
      setCurrentUser(JSON.parse(userData));
    }
  }, []);

  useEffect(() => {
    if (params.id) {
      loadLead();
    }
  }, [params.id, currentUser]);

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
        setCurrentAssignedUser(data.lead.assignedAgent);
        setFormData({
          ...data.lead,
          assignedAgent: data.lead.assignedAgent._id,
          products: data.lead.products || [{
            productId: generateProductId(),
            productName: '',
            productAmount: 0,
            quantity: 1,
            vin: '',
            mileageQuote: '',
            yearOfMfg: '',
            make: '',
            model: '',
            specification: '',
            vendorInfo: {
              vendorName: '',
              vendorLocation: '',
              recycler: '',
              shippingCompany: '',
              trackingNumber: ''
            }
          }]
        });
        
        if (currentUser) {
          loadAvailableUsers(currentUser);
        }
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

  const addProduct = () => {
    setFormData(prev => ({
      ...prev,
      products: [...(prev.products || []), {
        productId: generateProductId(),
        productName: '',
        productAmount: 0,
        quantity: 1,
        vin: '',
        mileageQuote: '',
        yearOfMfg: '',
        make: '',
        model: '',
        specification: '',
        vendorInfo: {
          vendorName: '',
          vendorLocation: '',
          recycler: '',
          shippingCompany: '',
          trackingNumber: ''
        }
      }]
    }));
  };

  const removeProduct = (index: number) => {
    if ((formData.products?.length || 0) > 1) {
      setFormData(prev => ({
        ...prev,
        products: prev.products?.filter((_, i) => i !== index)
      }));
    }
  };

  const updateProduct = (index: number, field: string, value: any) => {
    setFormData(prev => {
      const updatedProducts = [...(prev.products || [])];
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
      return { ...prev, products: updatedProducts };
    });
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
    
    if (name === 'status') {
      const followupStatuses = ['Follow up', 'Desision Follow up', 'Payment Follow up'];
      if (followupStatuses.includes(value)) {
        setPendingStatusChange(value);
        setShowFollowupModal(true);
        return;
      }
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? undefined : value
    }));
  };

  const handleFollowupSchedule = async (followupData: FollowupData) => {
    try {
      // Update status first
      setFormData(prev => ({
        ...prev,
        status: pendingStatusChange
      }));

      // Schedule follow-up
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/leads/${params.id}/schedule-followup`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          followupType: pendingStatusChange,
          followupDate: followupData.followupDate,
          followupTime: followupData.followupTime,
          notes: followupData.notes
        })
      });
    } catch (error) {
      console.error('Error scheduling follow-up:', error);
      alert('Failed to schedule follow-up');
    }
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
          <p className="text-gray-600">Update lead information and product details</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
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
                  {currentAssignedUser && (
                    <div className="mb-2 p-2 bg-blue-50 rounded text-sm">
                      <span className="font-medium">Currently assigned to: </span>
                      {currentAssignedUser.name} ({currentAssignedUser.email}) - {currentAssignedUser.role}
                    </div>
                  )}
                  <select
                    id="assignedAgent"
                    name="assignedAgent"
                    value={formData.assignedAgent || ''}
                    onChange={handleChange}
                    className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={currentUser?.role === 'agent'}
                  >
                    {currentUser?.role !== 'agent' && <option value="">Keep current assignment</option>}
                    {availableUsers.map(user => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.email}) - {user.role}
                      </option>
                    ))}
                  </select>
                  {currentUser?.role === 'agent' && (
                    <p className="text-xs text-gray-500 mt-1">
                      As an agent, you cannot reassign leads to other users
                    </p>
                  )}
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

                <div>
                  <Label htmlFor="callType">Call Type</Label>
                  <Input
                    id="callType"
                    name="callType"
                    value={formData.callType || ''}
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
                {formData.products?.map((product, index) => (
                  <div key={product.productId} className="border rounded-lg p-6 relative">
                    {(formData.products?.length || 0) > 1 && (
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
                        <Label>Product Name *</Label>
                        <Input
                          value={product.productName || ''}
                          onChange={(e) => updateProduct(index, 'productName', e.target.value)}
                          required
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Product Amount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={product.productAmount || ''}
                          onChange={(e) => updateProduct(index, 'productAmount', parseFloat(e.target.value) || 0)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Quantity</Label>
                        <Input
                          type="number"
                          value={product.quantity || ''}
                          onChange={(e) => updateProduct(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>VIN</Label>
                        <Input
                          value={product.vin || ''}
                          onChange={(e) => updateProduct(index, 'vin', e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Year of Manufacturing</Label>
                        <Input
                          value={product.yearOfMfg || ''}
                          onChange={(e) => updateProduct(index, 'yearOfMfg', e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Make</Label>
                        <Input
                          value={product.make || ''}
                          onChange={(e) => updateProduct(index, 'make', e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Model</Label>
                        <Input
                          value={product.model || ''}
                          onChange={(e) => updateProduct(index, 'model', e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Specification</Label>
                        <Input
                          value={product.specification || ''}
                          onChange={(e) => updateProduct(index, 'specification', e.target.value)}
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label>Mileage Quote</Label>
                        <Input
                          value={product.mileageQuote || ''}
                          onChange={(e) => updateProduct(index, 'mileageQuote', e.target.value)}
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
                          <Label>Shipping Company</Label>
                          <Input
                            value={product.vendorInfo?.shippingCompany || ''}
                            onChange={(e) => updateProduct(index, 'vendorInfo.shippingCompany', e.target.value)}
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
                      </div>
                    </div>
                  </div>
                ))}
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

        <FollowupModal
          isOpen={showFollowupModal}
          onClose={() => {
            setShowFollowupModal(false);
            setPendingStatusChange('');
          }}
          onSchedule={handleFollowupSchedule}
          leadData={{
            customerName: formData.customerName || '',
            leadNumber: formData.leadNumber || ''
          }}
          followupType={pendingStatusChange}
        />
      </div>
    </div>
  );
}
  
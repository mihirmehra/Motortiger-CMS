'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import { generateProductId } from '@/utils/idGenerator';

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
  vendorName: string;
  vendorLocation: string;
  recycler: string;
  shippingCompany: string;
  trackingNumber: string;
}

export default function NewLeadPage() {
  const [loading, setLoading] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
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
  const [products, setProducts] = useState<Product[]>([{
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
    vendorName: '',
    vendorLocation: '',
    recycler: '',
    shippingCompany: '',
    trackingNumber: ''
  }]);
  const router = useRouter();

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
  }, []);

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
      vendorName: '',
      vendorLocation: '',
      recycler: '',
      shippingCompany: '',
      trackingNumber: ''
    }]);
  };

  const removeProduct = (index: number) => {
    if (products.length > 1) {
      setProducts(products.filter((_, i) => i !== index));
    }
  };

  const updateProduct = (index: number, field: string, value: string) => {
    const updatedProducts = [...products];
    updatedProducts[index] = { ...updatedProducts[index], [field]: value };
    setProducts(updatedProducts);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      
      // Prepare products data
      const productsData = products.map(product => ({
        productId: product.productId,
        productName: product.productName,
        productAmount: product.productAmount ? parseFloat(product.productAmount) : undefined,
        quantity: product.quantity ? parseInt(product.quantity) : 1,
        vin: product.vin || undefined,
        mileageQuote: product.mileageQuote || undefined,
        yearOfMfg: product.yearOfMfg || undefined,
        make: product.make || undefined,
        model: product.model || undefined,
        specification: product.specification || undefined,
        vendorInfo: {
          vendorName: product.vendorName || undefined,
          vendorLocation: product.vendorLocation || undefined,
          recycler: product.recycler || undefined,
          shippingCompany: product.shippingCompany || undefined,
          trackingNumber: product.trackingNumber || undefined,
        }
      }));
      
      const submitData = {
        ...formData,
        products: productsData,
        assignedAgent: formData.assignedAgent || undefined
      };
      
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(submitData)
      });

      if (response.ok) {
        router.push('/dashboard/leads');
      } else {
        const data = await response.json();
        console.error('Validation errors:', data.details);
        alert(data.error || 'Failed to create lead. Please check all required fields.');
      }
    } catch (error) {
      console.error('Error creating lead:', error);
      alert('Failed to create lead');
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

  return (
    <div className="p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/dashboard/leads')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Leads
            </Button>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-900">Create New Lead</h1>
          <p className="text-gray-600">Add a new lead with multiple products to the system</p>
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
                    required
                    className="mt-1"
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
                    <option value="">Assign to me</option>
                    {availableUsers.map(user => (
                      <option key={user._id} value={user._id}>
                        {user.name} ({user.email}) - {user.role}
                      </option>
                    ))}
                  </select>
                  {currentUser?.role === 'agent' && (
                    <p className="text-xs text-gray-500 mt-1">
                      As an agent, leads will be assigned to you automatically
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
                        <Label>Product Name *</Label>
                        <Input
                          value={product.productName}
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
                    </div>

                    {/* Vendor Information for this Product */}
                    <div className="border-t pt-4">
                      <h5 className="font-medium mb-3 text-gray-700">Vendor Information for this Product</h5>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Vendor Name</Label>
                          <Input
                            value={product.vendorName}
                            onChange={(e) => updateProduct(index, 'vendorName', e.target.value)}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label>Vendor Location</Label>
                          <Input
                            value={product.vendorLocation}
                            onChange={(e) => updateProduct(index, 'vendorLocation', e.target.value)}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label>Recycler</Label>
                          <Input
                            value={product.recycler}
                            onChange={(e) => updateProduct(index, 'recycler', e.target.value)}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label>Shipping Company</Label>
                          <Input
                            value={product.shippingCompany}
                            onChange={(e) => updateProduct(index, 'shippingCompany', e.target.value)}
                            className="mt-1"
                          />
                        </div>

                        <div>
                          <Label>Tracking Number</Label>
                          <Input
                            value={product.trackingNumber}
                            onChange={(e) => updateProduct(index, 'trackingNumber', e.target.value)}
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
              onClick={() => router.push('/dashboard/leads')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {loading ? 'Creating...' : 'Create Lead'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
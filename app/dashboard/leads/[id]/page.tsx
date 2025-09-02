'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, History, Package } from 'lucide-react';
import NotesSection from '@/components/ui/notes-section';

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
    name: string;
    email: string;
  };
  products: Array<{
    productId: string;
    productName: string;
    productAmount?: number;
    quantity?: number;
    vin?: string;
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
  billingAddress?: string;
  shippingAddress?: string;
  mechanicName?: string;
  contactPhone?: string;
  state?: string;
  zone?: string;
  salesPrice?: number;
  createdAt: string;
  history: Array<{
    action: string;
    performedBy: {
      name: string;
    };
    timestamp: string;
    notes?: string;
  }>;
  notes: Array<{
    _id: string;
    content: string;
    createdBy: {
      name: string;
      email: string;
    };
    createdAt: string;
  }>;
}

export default function LeadDetailPage() {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'New': 'bg-blue-100 text-blue-800',
      'Connected': 'bg-green-100 text-green-800',
      'Nurturing': 'bg-yellow-100 text-yellow-800',
      'Waiting for respond': 'bg-orange-100 text-orange-800',
      'Customer Waiting for respond': 'bg-purple-100 text-purple-800',
      'Follow up': 'bg-blue-100 text-blue-800',
      'Desision Follow up': 'bg-orange-100 text-orange-800',
      'Payment Follow up': 'bg-purple-100 text-purple-800',
      'Payment Under Process': 'bg-indigo-100 text-indigo-800',
      'Customer making payment': 'bg-pink-100 text-pink-800',
      'Sale Payment Done': 'bg-emerald-100 text-emerald-800',
      'Sale Closed': 'bg-gray-100 text-gray-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  useEffect(() => {
    if (params.id) {
      loadLead();
    }
  }, [params.id]);

  const loadLead = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      const response = await fetch(`/api/leads/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLead(data.lead);
      } else {
        console.error('Failed to load lead');
        router.push('/dashboard/leads');
      }
    } catch (error) {
      console.error('Error loading lead:', error);
      router.push('/dashboard/leads');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading lead details...</p>
        </div>
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Lead not found</p>
          <Button onClick={() => router.push('/dashboard/leads')} className="mt-4">
            Back to Leads
          </Button>
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
              onClick={() => router.push('/dashboard/leads')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Leads
            </Button>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Lead Details</h1>
              <p className="text-gray-600">Lead #{lead.leadNumber}</p>
            </div>
            
            <Button
              onClick={() => router.push(`/dashboard/leads/${lead._id}/edit`)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit Lead
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Customer Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Customer Name</label>
                    <p className="text-lg font-semibold">{lead.customerName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Email</label>
                    <p className="text-lg">{lead.customerEmail}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Phone Number</label>
                    <p className="text-lg">{lead.phoneNumber}</p>
                  </div>
                  {lead.alternateNumber && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Alternate Number</label>
                      <p className="text-lg">{lead.alternateNumber}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lead Status & Assignment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(lead.status)}>
                        {lead.status}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Assigned Agent</label>
                    <p className="text-lg">{lead.assignedAgent?.name}</p>
                    <p className="text-sm text-gray-500">{lead.assignedAgent?.email}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {(lead.billingAddress || lead.shippingAddress || lead.mechanicName) && (
              <Card>
                <CardHeader>
                  <CardTitle>Address & Contact Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {lead.billingAddress && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Billing Address</label>
                        <p className="text-lg">{lead.billingAddress}</p>
                      </div>
                    )}
                    {lead.shippingAddress && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Shipping Address</label>
                        <p className="text-lg">{lead.shippingAddress}</p>
                      </div>
                    )}
                    {lead.mechanicName && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Mechanic Name</label>
                        <p className="text-lg">{lead.mechanicName}</p>
                      </div>
                    )}
                    {lead.contactPhone && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Contact Phone</label>
                        <p className="text-lg">{lead.contactPhone}</p>
                      </div>
                    )}
                    {lead.state && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">State</label>
                        <p className="text-lg">{lead.state}</p>
                      </div>
                    )}
                    {lead.zone && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Zone</label>
                        <p className="text-lg">{lead.zone}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Products Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Products ({lead.products?.length || 0})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lead.products && lead.products.length > 0 ? (
                  <div className="space-y-6">
                    {lead.products.map((product, index) => (
                      <div key={product.productId} className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-3">Product {index + 1}</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <label className="text-sm font-medium text-gray-500">Product Name</label>
                            <p className="text-lg font-semibold">{product.productName}</p>
                          </div>
                          {product.productAmount && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Amount</label>
                              <p className="text-lg">${product.productAmount.toLocaleString()}</p>
                            </div>
                          )}
                          {product.quantity && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Quantity</label>
                              <p className="text-lg">{product.quantity}</p>
                            </div>
                          )}
                          {product.vin && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">VIN</label>
                              <p className="text-lg font-mono">{product.vin}</p>
                            </div>
                          )}
                          {product.yearOfMfg && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Year</label>
                              <p className="text-lg">{product.yearOfMfg}</p>
                            </div>
                          )}
                          {product.make && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Make</label>
                              <p className="text-lg">{product.make}</p>
                            </div>
                          )}
                          {product.model && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Model</label>
                              <p className="text-lg">{product.model}</p>
                            </div>
                          )}
                        </div>

                        {/* Vendor Information for this Product */}
                        {product.vendorInfo && (
                          <div className="border-t pt-4">
                            <h5 className="font-medium mb-3 text-gray-700">Vendor Information</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {product.vendorInfo.vendorName && (
                                <div>
                                  <label className="text-sm font-medium text-gray-500">Vendor Name</label>
                                  <p className="text-sm">{product.vendorInfo.vendorName}</p>
                                </div>
                              )}
                              {product.vendorInfo.vendorLocation && (
                                <div>
                                  <label className="text-sm font-medium text-gray-500">Vendor Location</label>
                                  <p className="text-sm">{product.vendorInfo.vendorLocation}</p>
                                </div>
                              )}
                              {product.vendorInfo.recycler && (
                                <div>
                                  <label className="text-sm font-medium text-gray-500">Recycler</label>
                                  <p className="text-sm">{product.vendorInfo.recycler}</p>
                                </div>
                              )}
                              {product.vendorInfo.shippingCompany && (
                                <div>
                                  <label className="text-sm font-medium text-gray-500">Shipping Company</label>
                                  <p className="text-sm">{product.vendorInfo.shippingCompany}</p>
                                </div>
                              )}
                              {product.vendorInfo.trackingNumber && (
                                <div>
                                  <label className="text-sm font-medium text-gray-500">Tracking Number</label>
                                  <p className="text-sm font-mono">{product.vendorInfo.trackingNumber}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No products added to this lead</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Notes Section */}
          <NotesSection 
            leadId={lead._id}
            notes={lead.notes || []}
            onNotesUpdate={loadLead}
          />
        </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lead Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Lead ID</label>
                  <p className="text-sm font-mono">{lead.leadId}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Lead Number</label>
                  <p className="text-sm font-mono">{lead.leadNumber}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created Date</label>
                  <p className="text-sm">{new Date(lead.createdAt).toLocaleDateString()}</p>
                </div>
                {lead.salesPrice && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Total Sales Price</label>
                    <p className="text-lg font-bold text-green-600">${lead.salesPrice.toLocaleString()}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Activity History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {lead.history?.slice(0, 5).map((item, index) => (
                    <div key={index} className="border-l-2 border-gray-200 pl-4 pb-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-medium capitalize">{item.action}</p>
                          <p className="text-xs text-gray-500">
                            by {item.performedBy?.name}
                          </p>
                          {item.notes && (
                            <p className="text-xs text-gray-600 mt-1">{item.notes}</p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  ))}
                  
                  {(!lead.history || lead.history.length === 0) && (
                    <p className="text-sm text-gray-500">No activity history available</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
    </div>
  );
}
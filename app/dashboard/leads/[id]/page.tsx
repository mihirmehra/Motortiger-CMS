'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, User, Calendar, Package, CreditCard } from 'lucide-react';
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
    attention?: string;
    warranty?: string;
    miles?: string;
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
  }>;
  // Payment fields
  modeOfPayment?: string;
  paymentPortal?: string;
  cardNumber?: string;
  expiry?: string;
  paymentDate?: string;
  salesPrice?: number;
  pendingBalance?: number;
  costPrice?: number;
  totalMargin?: number;
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
  createdAt: string;
  createdBy: {
    name: string;
    email: string;
  };
}

export default function LeadDetailPage() {
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<any[]>([]);
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
        setNotes(data.lead.notes || []);
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
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Customer Information
                </CardTitle>
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

                {/* Address Information */}
                {(lead.billingAddress || lead.shippingAddress || lead.mechanicName || lead.contactPhone || lead.state || lead.zone || lead.callType) && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="text-lg font-medium mb-4">Additional Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {lead.billingAddress && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Billing Address</label>
                          <p className="text-sm">{lead.billingAddress}</p>
                        </div>
                      )}
                      {lead.shippingAddress && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Shipping Address</label>
                          <p className="text-sm">{lead.shippingAddress}</p>
                        </div>
                      )}
                      {lead.mechanicName && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Mechanic Name</label>
                          <p className="text-sm">{lead.mechanicName}</p>
                        </div>
                      )}
                      {lead.contactPhone && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Contact Phone</label>
                          <p className="text-sm">{lead.contactPhone}</p>
                        </div>
                      )}
                      {lead.state && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">State</label>
                          <p className="text-sm">{lead.state}</p>
                        </div>
                      )}
                      {lead.zone && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Zone</label>
                          <p className="text-sm">{lead.zone}</p>
                        </div>
                      )}
                      {lead.callType && (
                        <div>
                          <label className="text-sm font-medium text-gray-500">Call Type</label>
                          <p className="text-sm">{lead.callType}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Notes Section */}
            <NotesSection
              leadId={lead._id}
              notes={notes}
              onNoteAdded={(note) => setNotes(prev => [...prev, note])}
            />

            {/* Products Information */}
            {lead.products && lead.products.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Products ({lead.products.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {lead.products.map((product, index) => (
                    <div key={product.productId} className="border rounded-lg p-4">
                      <h4 className="font-semibold mb-3">
                        Product {index + 1}{product.productName ? `: ${product.productName}` : ''}
                      </h4>
                      <div key={product.productId} className="border rounded-lg p-4">
                        <h4 className="font-semibold mb-3">Product {index + 1}: {product.productName}</h4>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          {product.productAmount && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Amount</label>
                              <p className="text-sm">${product.productAmount.toLocaleString()}</p>
                            </div>
                          )}
                          {product.quantity && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Quantity</label>
                              <p className="text-sm">{product.quantity}</p>
                            </div>
                          )}
                          {product.vin && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">VIN</label>
                              <p className="text-sm font-mono">{product.vin}</p>
                            </div>
                          )}
                          {product.yearOfMfg && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Year</label>
                              <p className="text-sm">{product.yearOfMfg}</p>
                            </div>
                          )}
                          {product.make && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Make</label>
                              <p className="text-sm">{product.make}</p>
                            </div>
                          )}
                          {product.model && (
                            <div>
                              <label className="text-sm font-medium text-gray-500">Model</label>
                              <p className="text-sm">{product.model}</p>
                            </div>
                          )}
                        </div>

                        {/* Vendor Information */}
                        {product.vendorInfo && (product.vendorInfo.vendorName || product.vendorInfo.vendorLocation) && (
                          <div className="mt-4 pt-4 border-t">
                            <h5 className="font-medium mb-2 text-gray-700">Vendor Information</h5>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {product.vendorInfo.vendorName && (
                                <div>
                                  <label className="text-xs font-medium text-gray-500">Vendor Name</label>
                                  <p className="text-sm">{product.vendorInfo.vendorName}</p>
                                </div>
                              )}
                              {product.vendorInfo.vendorLocation && (
                                <div>
                                  <label className="text-xs font-medium text-gray-500">Vendor Location</label>
                                  <p className="text-sm">{product.vendorInfo.vendorLocation}</p>
                                </div>
                              )}
                              {product.vendorInfo.recycler && (
                                <div>
                                  <label className="text-xs font-medium text-gray-500">Recycler</label>
                                  <p className="text-sm">{product.vendorInfo.recycler}</p>
                                </div>
                              )}
                              {product.vendorInfo.shippingCompany && (
                                <div>
                                  <label className="text-xs font-medium text-gray-500">Shipping Company</label>
                                  <p className="text-sm">{product.vendorInfo.shippingCompany}</p>
                                </div>
                              )}
                              {product.vendorInfo.trackingNumber && (
                                <div>
                                  <label className="text-xs font-medium text-gray-500">Tracking Number</label>
                                  <p className="text-sm font-mono">{product.vendorInfo.trackingNumber}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    ))}
                </CardContent>
              </Card>
            )}

            {/* Payment Information */}
            {(lead.modeOfPayment || lead.salesPrice || lead.costPrice) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Payment Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {lead.salesPrice && (
                      <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-2xl font-bold text-green-600">
                          ${lead.salesPrice.toLocaleString()}
                        </div>
                        <div className="text-sm text-green-600">Sales Price</div>
                      </div>
                    )}
                    {lead.costPrice && (
                      <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600">
                          ${lead.costPrice.toLocaleString()}
                        </div>
                        <div className="text-sm text-blue-600">Cost Price</div>
                      </div>
                    )}
                    {lead.totalMargin && (
                      <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600">
                          ${lead.totalMargin.toLocaleString()}
                        </div>
                        <div className="text-sm text-purple-600">Total Margin</div>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {lead.modeOfPayment && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Mode of Payment</label>
                        <p className="text-sm">{lead.modeOfPayment}</p>
                      </div>
                    )}
                    {lead.paymentPortal && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Payment Portal</label>
                        <p className="text-sm">{lead.paymentPortal}</p>
                      </div>
                    )}
                    {lead.paymentDate && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Payment Date</label>
                        <p className="text-sm">{new Date(lead.paymentDate).toLocaleDateString()}</p>
                      </div>
                    )}
                    {lead.pendingBalance && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Pending Balance</label>
                        <p className="text-sm text-orange-600">${lead.pendingBalance.toLocaleString()}</p>
                      </div>
                    )}
                    {lead.refunded && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Refunded</label>
                        <p className="text-sm text-red-600">${lead.refunded.toLocaleString()}</p>
                      </div>
                    )}
                  </div>

                  {/* Dispute Information */}
                  {(lead.disputeCategory || lead.disputeReason) && (
                    <div className="mt-6 pt-6 border-t">
                      <h4 className="text-lg font-medium mb-4">Dispute Information</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {lead.disputeCategory && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Dispute Category</label>
                            <p className="text-sm">{lead.disputeCategory}</p>
                          </div>
                        )}
                        {lead.disputeReason && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Dispute Reason</label>
                            <p className="text-sm">{lead.disputeReason}</p>
                          </div>
                        )}
                        {lead.disputeDate && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Dispute Date</label>
                            <p className="text-sm">{new Date(lead.disputeDate).toLocaleDateString()}</p>
                          </div>
                        )}
                        {lead.disputeResult && (
                          <div>
                            <label className="text-sm font-medium text-gray-500">Dispute Result</label>
                            <p className="text-sm">{lead.disputeResult}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
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
                <div>
                  <label className="text-sm font-medium text-gray-500">Created By</label>
                  <p className="text-sm">{lead.createdBy?.name}</p>
                  <p className="text-xs text-gray-500">{lead.createdBy?.email}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
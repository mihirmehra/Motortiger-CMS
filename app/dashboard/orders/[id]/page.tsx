'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit } from 'lucide-react';

interface VendorOrder {
  _id: string;
  orderNo: string;
  vendorName: string;
  vendorLocation: string;
  customerName?: string;
  orderStatus: string;
  itemSubtotal?: number;
  shippingHandling?: number;
  taxCollected?: number;
  grandTotal?: number;
  courierCompany?: string;
  trackingId?: string;
  productName?: string;
  productAmount?: number;
  shippingAddress?: string;
  quantity?: number;
  createdAt: string;
  createdBy: {
    name: string;
    email: string;
  };
}

export default function VendorOrderDetailPage() {
  const [order, setOrder] = useState<VendorOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const params = useParams();

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      'stage1 (engine pull)': 'bg-red-100 text-red-800',
      'stage2 (washing)': 'bg-orange-100 text-orange-800',
      'stage3 (testing)': 'bg-yellow-100 text-yellow-800',
      'stage4 (pack & ready)': 'bg-blue-100 text-blue-800',
      'stage5 (shipping)': 'bg-purple-100 text-purple-800',
      'stage6 (delivered)': 'bg-green-100 text-green-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  useEffect(() => {
    if (params.id) {
      loadOrder();
    }
  }, [params.id]);

  const loadOrder = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        router.push('/');
        return;
      }

      const response = await fetch(`/api/vendor-orders/${params.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setOrder(data.order);
      } else {
        console.error('Failed to load order');
        router.push('/dashboard/orders');
      }
    } catch (error) {
      console.error('Error loading order:', error);
      router.push('/dashboard/orders');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Order not found</p>
          <Button onClick={() => router.push('/dashboard/orders')} className="mt-4">
            Back to Orders
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
              onClick={() => router.push('/dashboard/orders')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Orders
            </Button>
          </div>
          
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Order Details</h1>
              <p className="text-gray-600">Order #{order.orderNo}</p>
            </div>
            
            <Button
              onClick={() => router.push(`/dashboard/orders/${order._id}/edit`)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Edit Order
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Information */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Vendor Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Vendor Name</label>
                    <p className="text-lg font-semibold">{order.vendorName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Vendor Location</label>
                    <p className="text-lg">{order.vendorLocation}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Order Status</label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(order.orderStatus)}>
                        {order.orderStatus}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {order.customerName && (
              <Card>
                <CardHeader>
                  <CardTitle>Customer Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">Customer Name</label>
                      <p className="text-lg">{order.customerName}</p>
                    </div>
                    {order.shippingAddress && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Shipping Address</label>
                        <p className="text-lg">{order.shippingAddress}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {(order.productName || order.productAmount || order.quantity) && (
              <Card>
                <CardHeader>
                  <CardTitle>Product Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {order.productName && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Product Name</label>
                        <p className="text-lg">{order.productName}</p>
                      </div>
                    )}
                    {order.productAmount && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Product Amount</label>
                        <p className="text-lg font-semibold">${order.productAmount.toLocaleString()}</p>
                      </div>
                    )}
                    {order.quantity && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Quantity</label>
                        <p className="text-lg">{order.quantity}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {(order.itemSubtotal || order.shippingHandling || order.taxCollected || order.grandTotal) && (
              <Card>
                <CardHeader>
                  <CardTitle>Financial Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {order.itemSubtotal && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Item Subtotal</label>
                        <p className="text-lg">${order.itemSubtotal.toLocaleString()}</p>
                      </div>
                    )}
                    {order.shippingHandling && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Shipping & Handling</label>
                        <p className="text-lg">${order.shippingHandling.toLocaleString()}</p>
                      </div>
                    )}
                    {order.taxCollected && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Tax Collected</label>
                        <p className="text-lg">${order.taxCollected.toLocaleString()}</p>
                      </div>
                    )}
                    {order.grandTotal && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Grand Total</label>
                        <p className="text-lg font-bold text-green-600">${order.grandTotal.toLocaleString()}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {(order.courierCompany || order.trackingId) && (
              <Card>
                <CardHeader>
                  <CardTitle>Shipping Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {order.courierCompany && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Courier Company</label>
                        <p className="text-lg">{order.courierCompany}</p>
                      </div>
                    )}
                    {order.trackingId && (
                      <div>
                        <label className="text-sm font-medium text-gray-500">Tracking ID</label>
                        <p className="text-lg font-mono">{order.trackingId}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Order Number</label>
                  <p className="text-sm font-mono">{order.orderNo}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created Date</label>
                  <p className="text-sm">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">Created By</label>
                  <p className="text-sm">{order.createdBy?.name}</p>
                  <p className="text-xs text-gray-500">{order.createdBy?.email}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
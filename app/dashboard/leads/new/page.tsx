'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Save } from 'lucide-react';

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
}

export default function NewLeadPage() {
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<User[]>([]);
  const [formData, setFormData] = useState({
    customerName: '',
    customerEmail: '',
    phoneNumber: '',
    alternateNumber: '',
    assignedAgent: '',
    status: 'New'
  });
  const router = useRouter();

  const statusOptions = [
    'New', 'Connected', 'Nurturing', 'Waiting for respond',
    'Customer Waiting for respond', 'Payment Under Process',
    'Customer making payment', 'Sale Payment Done', 'Sale Closed'
  ];

  useEffect(() => {
    loadAgents();
  }, []);

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
      const response = await fetch('/api/leads', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        router.push('/dashboard/leads');
      } else {
        const data = await response.json();
        alert(data.error || 'Failed to create lead');
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
      <div className="max-w-4xl mx-auto">
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
          <p className="text-gray-600">Add a new lead to the system</p>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
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
                    <option value="">Select Agent</option>
                    {agents.map(agent => (
                      <option key={agent._id} value={agent._id}>
                        {agent.name} ({agent.email})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

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
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
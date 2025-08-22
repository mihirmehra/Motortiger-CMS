import { AuthUser } from './auth';

export class PermissionManager {
  private user: AuthUser;

  constructor(user: AuthUser) {
    this.user = user;
  }

  canCreate(module: string): boolean {
    switch (this.user.role) {
      case 'admin':
        return true;
      case 'manager':
        return ['leads', 'vendor_orders', 'targets', 'sales', 'payment_records', 'users'].includes(module);
      case 'agent':
        return ['leads', 'vendor_orders', 'payment_records'].includes(module);
      default:
        return false;
    }
  }

  canRead(module: string): boolean {
    switch (this.user.role) {
      case 'admin':
        return true;
      case 'manager':
        return ['leads', 'vendor_orders', 'targets', 'sales', 'payment_records', 'users'].includes(module);
      case 'agent':
        return ['leads', 'vendor_orders', 'payment_records'].includes(module);
      default:
        return false;
    }
  }

  canUpdate(module: string): boolean {
    switch (this.user.role) {
      case 'admin':
        return true;
      case 'manager':
        return ['leads', 'vendor_orders', 'targets', 'sales', 'payment_records', 'users'].includes(module);
      case 'agent':
        return ['leads', 'vendor_orders', 'payment_records'].includes(module);
      default:
        return false;
    }
  }

  canDelete(module: string): boolean {
    return this.user.role === 'admin';
  }

  canExport(module: string): boolean {
    return this.user.role !== 'agent';
  }

  canImport(module: string): boolean {
    return this.user.role !== 'agent';
  }

  canAccessActivityHistory(): boolean {
    return this.user.role === 'admin';
  }

  getDataFilter(): object {
    switch (this.user.role) {
      case 'admin':
        return {}; // Admin sees all data
      case 'manager':
        return {
          $or: [
            { createdBy: this.user.id },
            { assignedAgent: this.user.id },
            { assignedAgent: { $in: this.user.assignedAgents || [] } },
            { updatedBy: this.user.id },
            { updatedBy: { $in: this.user.assignedAgents || [] } }
          ]
        };
      case 'agent':
        return {
          $or: [
            { createdBy: this.user.id },
            { assignedAgent: this.user.id },
            { updatedBy: this.user.id }
          ]
        };
      default:
        return { _id: null }; // No access
    }
  }
}
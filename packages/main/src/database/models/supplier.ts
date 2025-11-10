export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  taxId?: string | null;
  paymentTerms?: string | null;
  businessId: string;
  isActive: boolean;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

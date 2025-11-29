/**
 * Business/Organization Domain Types
 * 
 * @module types/domain/business
 */

export interface Business {
  id: string;
  firstName: string;
  lastName: string;
  businessName: string;
  ownerId: string;

  // Contact
  email?: string;
  phone?: string;
  website?: string;

  // Location
  address?: string;
  country?: string;
  city?: string;
  postalCode?: string;

  // Business info
  vatNumber?: string;
  businessType?: 'retail' | 'restaurant' | 'service' | 'wholesale' | 'other';
  currency?: string;
  timezone?: string;

  // Status
  isActive?: boolean;
  avatar?: string;

  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

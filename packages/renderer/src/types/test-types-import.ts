/**
 * Type Import Test
 * 
 * This file tests that all new types can be imported correctly.
 * Run: npx tsc --noEmit test-types-import.ts
 */

// Test barrel imports
import {
  // Domain types
  User,
  UserForLogin,
  Business,
  Product,
  Category,
  Shift,
  Schedule,
  PaymentMethod,
  Transaction,
  Role,
  Permission,
  
  // Enum types
  AgeRestrictionLevel,
  VerificationMethod,
  BatchStatus,
  CartSessionStatus,
  
  // Helper functions
  getUserRoleName,
  getUserDisplayName,
  getMinimumAge,
  getAgeRestrictionLabel,
} from './index';

// Test direct imports
import { User as UserDirect } from './domain/user';
import { AgeRestrictionLevel as AgeRestrictionDirect } from './enums/age-restriction';

// Test that types work correctly
const testUser: User = {
  id: '1',
  username: 'test',
  firstName: 'Test',
  lastName: 'User',
  businessName: 'Test Business',
  businessId: '1',
  isActive: true,
  createdAt: new Date().toISOString(),
};

const testProduct: Product = {
  id: '1',
  name: 'Test Product',
  sku: 'TEST-001',
  basePrice: 10.99,
  categoryId: '1',
  businessId: '1',
  productType: 'STANDARD',
  salesUnit: 'PIECE',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const testLevel: AgeRestrictionLevel = 'AGE_18';
const testMethod: VerificationMethod = 'MANUAL';

// Test helper functions
const userName = getUserRoleName(testUser);
const displayName = getUserDisplayName(testUser);
const minAge = getMinimumAge(testLevel);
const label = getAgeRestrictionLabel(testLevel);

console.log('✅ All type imports successful!');
console.log('User:', displayName);
console.log('Product:', testProduct.name);
console.log('Age restriction:', label, 'requires', minAge, 'years');

export {};

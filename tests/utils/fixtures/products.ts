/**
 * Product test fixtures
 */

export const testProducts = {
  regular: {
    id: 'product-1',
    name: 'Regular Product',
    price: 10.99,
    stock: 100,
    businessId: 'business-1',
    categoryId: 'category-1',
    type: 'regular' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  weighted: {
    id: 'product-2',
    name: 'Weighted Product',
    price: 5.99,
    stock: 0, // Weighted products don't use stock
    businessId: 'business-1',
    categoryId: 'category-1',
    type: 'weighted' as const,
    weightUnit: 'lb' as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  ageRestricted: {
    id: 'product-3',
    name: 'Age Restricted Product',
    price: 15.99,
    stock: 50,
    businessId: 'business-1',
    categoryId: 'category-1',
    type: 'regular' as const,
    ageRestriction: 21,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
};


/**
 * Payment API Types
 * 
 * Types for payment processing and card reader operations.
 * 
 * @module types/api/payment
 */

export interface PaymentAPI {
  initializeReader: (config: any) => Promise<{ success: boolean; error?: string }>;
  discoverReaders: () => Promise<{ success: boolean; readers: any[] }>;
  getReaderStatus: () => Promise<any>;
  testReader: () => Promise<{ success: boolean; error?: string }>;
  disconnectReader: () => Promise<{ success: boolean }>;
  createPaymentIntent: (data: any) => Promise<any>;
  processCardPayment: (paymentIntentId: string) => Promise<any>;
  cancelPayment: () => Promise<{ success: boolean; error?: string }>;
  getConnectionToken: () => Promise<any>;
}


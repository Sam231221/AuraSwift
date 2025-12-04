/**
 * Payment Domain Types
 *
 * Consolidated payment types from multiple sources
 *
 * @module types/domain/payment
 */

export type PaymentMethodType =
  | "cash"
  | "card"
  | "mobile"
  | "voucher"
  | "split"
  | "viva_wallet";

/**
 * Payment method with amount
 */
export interface PaymentMethod {
  type: PaymentMethodType;
  amount: number;
  reference?: string;
  last4?: string;
  cardType?: string;
  // Viva Wallet specific
  terminalId?: string;
  terminalName?: string;
  provider?: "bbpos" | "viva_wallet" | "simulated";
}

/**
 * Simplified payment method (for transaction creation)
 */
export interface PaymentMethodSimple {
  type: PaymentMethodType;
  amount?: number;
}

import type { VatCategory } from "../schema.js";
import type { DrizzleDB } from "../drizzle.js";
import { eq, and } from "drizzle-orm";
import * as schema from "../schema.js";

export interface VatCategoryResponse {
  success: boolean;
  message: string;
  vatCategory?: VatCategory;
  vatCategories?: VatCategory[];
  errors?: string[];
}

export interface CreateVatCategoryData {
  name: string;
  code: string;
  ratePercent: number;
  description?: string;
  businessId: string;
  isDefault?: boolean;
  isActive?: boolean;
}

/**
 * VAT Category Manager
 * Handles VAT category operations including creation, retrieval, and management
 * for the Booker import process
 */
export class VatCategoryManager {
  private db: DrizzleDB;
  private uuid: any;

  constructor(drizzle: DrizzleDB, uuid: any) {
    this.db = drizzle;
    this.uuid = uuid;
  }

  /**
   * Parse VAT rate from Booker format
   * Examples:
   * - "standard rate 20%" -> { code: "STD", rate: 20, name: "Standard Rate" }
   * - "reduced rate 5%" -> { code: "RED", rate: 5, name: "Reduced Rate" }
   * - "zero rate" -> { code: "ZERO", rate: 0, name: "Zero Rate" }
   */
  parseBookerVatRate(vatRateString: string): {
    code: string;
    rate: number;
    name: string;
  } | null {
    if (!vatRateString) return null;

    const normalized = vatRateString.toLowerCase().trim();

    // Extract percentage using regex
    const percentMatch = normalized.match(/(\d+(?:\.\d+)?)\s*%/);
    const rate = percentMatch ? parseFloat(percentMatch[1]) : 0;

    // Determine code and name based on the rate string
    if (normalized.includes("standard")) {
      return {
        code: "STD",
        rate,
        name: "Standard Rate",
      };
    } else if (normalized.includes("reduced")) {
      return {
        code: "RED",
        rate,
        name: "Reduced Rate",
      };
    } else if (normalized.includes("zero")) {
      return {
        code: "ZERO",
        rate: 0,
        name: "Zero Rate",
      };
    } else if (normalized.includes("exempt")) {
      return {
        code: "EXEMPT",
        rate: 0,
        name: "Exempt",
      };
    }

    // Default fallback
    return {
      code: "CUSTOM",
      rate,
      name: `VAT ${rate}%`,
    };
  }

  /**
   * Create a new VAT category
   */
  async createVatCategory(data: CreateVatCategoryData): Promise<VatCategory> {
    const vatCategoryId = this.uuid.v4();
    const now = new Date();

    // Validate required fields
    if (!data.name || data.name.trim() === "") {
      throw new Error("VAT category name is required");
    }
    if (!data.code || data.code.trim() === "") {
      throw new Error("VAT category code is required");
    }
    if (data.ratePercent < 0 || data.ratePercent > 100) {
      throw new Error("VAT rate must be between 0 and 100");
    }
    if (!data.businessId) {
      throw new Error("Business ID is required");
    }

    // Check for duplicate code within business
    const existingByCode = await this.getVatCategoryByCode(
      data.code,
      data.businessId
    );
    if (existingByCode) {
      throw new Error(
        `VAT category with code "${data.code}" already exists for this business`
      );
    }

    await this.db.insert(schema.vatCategories).values({
      id: vatCategoryId,
      name: data.name,
      code: data.code,
      ratePercent: data.ratePercent,
      description: data.description ?? null,
      businessId: data.businessId,
      isDefault: data.isDefault ?? false,
      isActive: data.isActive ?? true,
      createdAt: now,
      updatedAt: now,
    });

    return this.getVatCategoryById(vatCategoryId);
  }

  /**
   * Get VAT category by ID
   */
  async getVatCategoryById(id: string): Promise<VatCategory> {
    const [vatCategory] = await this.db
      .select()
      .from(schema.vatCategories)
      .where(eq(schema.vatCategories.id, id))
      .limit(1);

    if (!vatCategory) {
      throw new Error("VAT category not found");
    }

    return vatCategory as VatCategory;
  }

  /**
   * Get VAT category by code and business
   */
  async getVatCategoryByCode(
    code: string,
    businessId: string
  ): Promise<VatCategory | null> {
    const [vatCategory] = await this.db
      .select()
      .from(schema.vatCategories)
      .where(
        and(
          eq(schema.vatCategories.code, code),
          eq(schema.vatCategories.businessId, businessId)
        )
      )
      .limit(1);

    return (vatCategory as VatCategory) || null;
  }

  /**
   * Get VAT category by rate and business
   */
  async getVatCategoryByRate(
    ratePercent: number,
    businessId: string
  ): Promise<VatCategory | null> {
    const [vatCategory] = await this.db
      .select()
      .from(schema.vatCategories)
      .where(
        and(
          eq(schema.vatCategories.ratePercent, ratePercent),
          eq(schema.vatCategories.businessId, businessId),
          eq(schema.vatCategories.isActive, true)
        )
      )
      .limit(1);

    return (vatCategory as VatCategory) || null;
  }

  /**
   * Get all VAT categories for a business
   */
  async getVatCategoriesByBusiness(
    businessId: string,
    includeInactive: boolean = false
  ): Promise<VatCategory[]> {
    const conditions = [eq(schema.vatCategories.businessId, businessId)];

    if (!includeInactive) {
      conditions.push(eq(schema.vatCategories.isActive, true));
    }

    const vatCategories = await this.db
      .select()
      .from(schema.vatCategories)
      .where(and(...conditions))
      .orderBy(schema.vatCategories.ratePercent);

    return vatCategories as VatCategory[];
  }

  /**
   * Get default VAT category for a business
   */
  async getDefaultVatCategory(businessId: string): Promise<VatCategory | null> {
    const [vatCategory] = await this.db
      .select()
      .from(schema.vatCategories)
      .where(
        and(
          eq(schema.vatCategories.businessId, businessId),
          eq(schema.vatCategories.isDefault, true),
          eq(schema.vatCategories.isActive, true)
        )
      )
      .limit(1);

    return (vatCategory as VatCategory) || null;
  }

  /**
   * Get or create VAT category - Main method for import process
   * This is the key method used during Booker import
   */
  async getOrCreateVatCategory(
    vatRateString: string,
    businessId: string
  ): Promise<VatCategory> {
    // Parse the Booker VAT rate string
    const parsed = this.parseBookerVatRate(vatRateString);
    if (!parsed) {
      throw new Error(`Unable to parse VAT rate: ${vatRateString}`);
    }

    // Try to find existing VAT category by code first
    let existingVat = await this.getVatCategoryByCode(parsed.code, businessId);

    // If not found by code, try by rate (in case code differs but rate matches)
    if (!existingVat) {
      existingVat = await this.getVatCategoryByRate(parsed.rate, businessId);
    }

    if (existingVat) {
      return existingVat;
    }

    // Create new VAT category
    return this.createVatCategory({
      name: parsed.name,
      code: parsed.code,
      ratePercent: parsed.rate,
      description: `Auto-created from Booker import: ${vatRateString}`,
      businessId,
      isActive: true,
    });
  }

  /**
   * Update VAT category
   */
  async updateVatCategory(
    id: string,
    updates: Partial<
      Omit<VatCategory, "id" | "businessId" | "createdAt" | "updatedAt">
    >
  ): Promise<VatCategory> {
    if (Object.keys(updates).length === 0) {
      return this.getVatCategoryById(id);
    }

    // Check if VAT category exists
    try {
      await this.getVatCategoryById(id);
    } catch (error) {
      throw new Error("VAT category not found");
    }

    const now = new Date();

    await this.db
      .update(schema.vatCategories)
      .set({
        ...updates,
        updatedAt: now,
      })
      .where(eq(schema.vatCategories.id, id))
      .run();

    return this.getVatCategoryById(id);
  }

  /**
   * Delete VAT category (soft delete by setting isActive to false)
   */
  async deleteVatCategory(id: string): Promise<boolean> {
    const now = new Date();

    const result = await this.db
      .update(schema.vatCategories)
      .set({
        isActive: false,
        updatedAt: now,
      })
      .where(
        and(
          eq(schema.vatCategories.id, id),
          eq(schema.vatCategories.isActive, true)
        )
      )
      .run();

    return result.changes > 0;
  }

  /**
   * Set default VAT category
   * Ensures only one default per business
   */
  async setDefaultVatCategory(
    id: string,
    businessId: string
  ): Promise<VatCategory> {
    const now = new Date();

    // First, unset any existing default for this business
    await this.db
      .update(schema.vatCategories)
      .set({
        isDefault: false,
        updatedAt: now,
      })
      .where(
        and(
          eq(schema.vatCategories.businessId, businessId),
          eq(schema.vatCategories.isDefault, true)
        )
      )
      .run();

    // Then set the new default
    await this.db
      .update(schema.vatCategories)
      .set({
        isDefault: true,
        updatedAt: now,
      })
      .where(eq(schema.vatCategories.id, id))
      .run();

    return this.getVatCategoryById(id);
  }
}


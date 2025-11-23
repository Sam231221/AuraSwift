/**
 * Category Form Drawer Component
 * 
 * Form drawer for creating and editing categories using React Hook Form.
 */

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
  DrawerFooter,
} from "@/components/ui/drawer";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useCategoryForm } from "../hooks/use-category-form";
import type { Category } from "../hooks/use-product-data";
import type { VatCategory } from "../hooks/use-product-data";
import { buildCategoryTree } from "../utils";

interface CategoryFormDrawerProps {
  isOpen: boolean;
  category?: Category | null;
  categories: Category[];
  vatCategories: VatCategory[];
  businessId: string;
  onClose: () => void;
  onSave: (data: {
    name: string;
    description?: string;
    parentId?: string | null;
    vatCategoryId?: string | null;
    vatOverridePercent?: number | null;
    color?: string | null;
    image?: string | null;
    isActive: boolean;
    sortOrder?: number;
  }) => Promise<void>;
  onUpdate: (
    id: string,
    data: {
      name: string;
      description?: string;
      parentId?: string | null;
      vatCategoryId?: string | null;
      vatOverridePercent?: number | null;
      color?: string | null;
      image?: string | null;
      isActive: boolean;
    }
  ) => Promise<void>;
}

export function CategoryFormDrawer({
  isOpen,
  category,
  categories,
  vatCategories,
  businessId,
  onClose,
  onSave,
  onUpdate,
}: CategoryFormDrawerProps) {
  const { form, handleSubmit, isSubmitting, isEditMode } = useCategoryForm({
    category,
    businessId,
    onSubmit: async (data) => {
      // Transform form data to API format
      const apiData = {
        name: data.name,
        description: data.description || undefined,
        parentId: data.parentId || null,
        vatCategoryId: data.vatCategoryId && data.vatCategoryId !== "" 
          ? data.vatCategoryId 
          : null,
        vatOverridePercent:
          data.vatOverridePercent && data.vatOverridePercent !== ""
            ? parseFloat(data.vatOverridePercent)
            : null,
        color: data.color && data.color !== "" ? data.color : null,
        image: data.image && data.image !== "" ? data.image : null,
        isActive: data.isActive ?? true,
        ...(isEditMode && category
          ? {}
          : { sortOrder: categories.length + 1 }),
      };

      if (isEditMode && category) {
        await onUpdate(category.id, apiData);
      } else {
        await onSave(apiData);
      }
    },
    onSuccess: onClose,
  });

  // Filter out current category from parent options
  const parentOptions = buildCategoryTree(categories as any).filter(
    (cat) => !category || cat.id !== category.id
  );

  return (
    <Drawer open={isOpen} onOpenChange={onClose} direction="right">
      <DrawerContent className="h-full w-[500px] mt-0 rounded-none fixed right-0 top-0">
        <DrawerHeader className="border-b">
          <DrawerTitle>
            {isEditMode ? "Edit Category" : "Add New Category"}
          </DrawerTitle>
          <DrawerDescription>
            {isEditMode
              ? "Update the category information below."
              : "Create a new category to organize your products."}
          </DrawerDescription>
        </DrawerHeader>

        <Form {...form}>
          <form onSubmit={handleSubmit} className="flex flex-col h-full">
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category Name *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter category name"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Enter category description"
                        rows={3}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="parentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Parent Category</FormLabel>
                    <Select
                      onValueChange={(value) =>
                        field.onChange(value === "" ? undefined : value)
                      }
                      value={field.value || ""}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="None (Top-level)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None (Top-level)</SelectItem>
                        {parentOptions.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vatCategoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>VAT Category</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value || ""}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="None" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="">None</SelectItem>
                        {vatCategories.map((vat) => (
                          <SelectItem key={vat.id} value={vat.id}>
                            {vat.name} ({vat.ratePercent}%)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="vatOverridePercent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>VAT Override (%)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        min="0"
                        step="0.01"
                        placeholder="Override VAT percent (optional)"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="color"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Color</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter color (optional)"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter image URL (optional)"
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Active</FormLabel>
                    </div>
                  </FormItem>
                )}
              />

              {category && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">
                    Category Information
                  </h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>
                      Created:{" "}
                      {new Date(category.createdAt).toLocaleString()}
                    </div>
                    <div>
                      Last Updated:{" "}
                      {category.updatedAt
                        ? new Date(category.updatedAt).toLocaleString()
                        : "-"}
                    </div>
                    <div>Sort Order: {category.sortOrder}</div>
                    <div>
                      Status: {category.isActive ? "Active" : "Inactive"}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <DrawerFooter className="border-t">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {isSubmitting
                  ? "Saving..."
                  : isEditMode
                  ? "Update Category"
                  : "Add Category"}
              </Button>
              <DrawerClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  disabled={isSubmitting}
                  onClick={onClose}
                >
                  Cancel
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </form>
        </Form>
      </DrawerContent>
    </Drawer>
  );
}


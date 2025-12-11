/**
 * Component Tests for ProductCard
 * 
 * Tests the ProductCard component rendering and user interactions.
 * Uses React Testing Library best practices.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMockProduct } from '../../../utils/fixtures/products.fixture';

/**
 * ProductCard Component (simplified for testing example)
 * In reality, import from: @/features/sales/components/ProductCard
 */
interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
  imageUrl?: string;
}

interface ProductCardProps {
  product: Product;
  onAddToCart: (product: Product) => void;
  disabled?: boolean;
}

function ProductCard({ product, onAddToCart, disabled }: ProductCardProps) {
  return (
    <div data-testid={`product-card-${product.id}`}>
      <img 
        src={product.imageUrl || '/placeholder.jpg'} 
        alt={product.name}
        data-testid="product-image"
      />
      <h3 data-testid="product-name">{product.name}</h3>
      <p data-testid="product-price">£{product.price.toFixed(2)}</p>
      <p data-testid="product-stock">Stock: {product.stock}</p>
      {product.stock === 0 && (
        <span data-testid="out-of-stock-label">Out of Stock</span>
      )}
      <button 
        onClick={() => onAddToCart(product)}
        disabled={disabled || product.stock === 0}
        data-testid="add-to-cart-button"
      >
        Add to Cart
      </button>
    </div>
  );
}

describe('ProductCard', () => {
  const mockOnAddToCart = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render product information correctly', () => {
      const product = createMockProduct({
        id: 'prod-1',
        name: 'Test Product',
        price: 19.99,
        stock: 10,
      });

      render(<ProductCard product={product} onAddToCart={mockOnAddToCart} />);

      expect(screen.getByTestId('product-name')).toHaveTextContent('Test Product');
      expect(screen.getByTestId('product-price')).toHaveTextContent('£19.99');
      expect(screen.getByTestId('product-stock')).toHaveTextContent('Stock: 10');
    });

    it('should render product image with correct alt text', () => {
      const product = createMockProduct({
        name: 'Accessible Product',
        imageUrl: 'https://example.com/product.jpg',
      });

      render(<ProductCard product={product} onAddToCart={mockOnAddToCart} />);

      const image = screen.getByAltText('Accessible Product');
      expect(image).toBeInTheDocument();
      expect(image).toHaveAttribute('src', 'https://example.com/product.jpg');
    });

    it('should use placeholder image when imageUrl is not provided', () => {
      const product = createMockProduct({
        imageUrl: undefined,
      });

      render(<ProductCard product={product} onAddToCart={mockOnAddToCart} />);

      const image = screen.getByTestId('product-image');
      expect(image).toHaveAttribute('src', '/placeholder.jpg');
    });

    it('should format price with 2 decimal places', () => {
      const product = createMockProduct({ price: 9.5 });

      render(<ProductCard product={product} onAddToCart={mockOnAddToCart} />);

      expect(screen.getByTestId('product-price')).toHaveTextContent('£9.50');
    });

    it('should show out of stock label when stock is 0', () => {
      const product = createMockProduct({ stock: 0 });

      render(<ProductCard product={product} onAddToCart={mockOnAddToCart} />);

      expect(screen.getByTestId('out-of-stock-label')).toBeInTheDocument();
      expect(screen.getByTestId('out-of-stock-label')).toHaveTextContent('Out of Stock');
    });

    it('should not show out of stock label when stock is available', () => {
      const product = createMockProduct({ stock: 10 });

      render(<ProductCard product={product} onAddToCart={mockOnAddToCart} />);

      expect(screen.queryByTestId('out-of-stock-label')).not.toBeInTheDocument();
    });
  });

  describe('user interactions', () => {
    it('should call onAddToCart when button is clicked', async () => {
      const user = userEvent.setup();
      const product = createMockProduct({
        id: 'prod-123',
        name: 'Clickable Product',
      });

      render(<ProductCard product={product} onAddToCart={mockOnAddToCart} />);

      const button = screen.getByTestId('add-to-cart-button');
      await user.click(button);

      expect(mockOnAddToCart).toHaveBeenCalledTimes(1);
      expect(mockOnAddToCart).toHaveBeenCalledWith(product);
    });

    it('should not call onAddToCart when button is disabled', async () => {
      const user = userEvent.setup();
      const product = createMockProduct();

      render(<ProductCard product={product} onAddToCart={mockOnAddToCart} disabled />);

      const button = screen.getByTestId('add-to-cart-button');
      
      // Button should be disabled
      expect(button).toBeDisabled();
      
      // Try to click (should not work)
      await user.click(button);
      
      expect(mockOnAddToCart).not.toHaveBeenCalled();
    });

    it('should handle multiple clicks correctly', async () => {
      const user = userEvent.setup();
      const product = createMockProduct();

      render(<ProductCard product={product} onAddToCart={mockOnAddToCart} />);

      const button = screen.getByTestId('add-to-cart-button');
      
      await user.click(button);
      await user.click(button);
      await user.click(button);

      expect(mockOnAddToCart).toHaveBeenCalledTimes(3);
    });
  });

  describe('button state', () => {
    it('should enable button when product is in stock', () => {
      const product = createMockProduct({ stock: 10 });

      render(<ProductCard product={product} onAddToCart={mockOnAddToCart} />);

      expect(screen.getByTestId('add-to-cart-button')).toBeEnabled();
    });

    it('should disable button when product is out of stock', () => {
      const product = createMockProduct({ stock: 0 });

      render(<ProductCard product={product} onAddToCart={mockOnAddToCart} />);

      expect(screen.getByTestId('add-to-cart-button')).toBeDisabled();
    });

    it('should disable button when disabled prop is true', () => {
      const product = createMockProduct({ stock: 10 });

      render(<ProductCard product={product} onAddToCart={mockOnAddToCart} disabled />);

      expect(screen.getByTestId('add-to-cart-button')).toBeDisabled();
    });

    it('should keep button disabled even with stock when disabled prop is true', () => {
      const product = createMockProduct({ stock: 100 });

      render(<ProductCard product={product} onAddToCart={mockOnAddToCart} disabled />);

      expect(screen.getByTestId('add-to-cart-button')).toBeDisabled();
    });
  });

  describe('edge cases', () => {
    it('should handle product with very high price', () => {
      const product = createMockProduct({ price: 9999999.99 });

      render(<ProductCard product={product} onAddToCart={mockOnAddToCart} />);

      expect(screen.getByTestId('product-price')).toHaveTextContent('£9999999.99');
    });

    it('should handle product with 0 price', () => {
      const product = createMockProduct({ price: 0 });

      render(<ProductCard product={product} onAddToCart={mockOnAddToCart} />);

      expect(screen.getByTestId('product-price')).toHaveTextContent('£0.00');
    });

    it('should handle product with very long name', () => {
      const longName = 'A'.repeat(200);
      const product = createMockProduct({ name: longName });

      render(<ProductCard product={product} onAddToCart={mockOnAddToCart} />);

      expect(screen.getByTestId('product-name')).toHaveTextContent(longName);
    });

    it('should handle product with special characters in name', () => {
      const product = createMockProduct({ 
        name: 'Test & Product < > "Special"' 
      });

      render(<ProductCard product={product} onAddToCart={mockOnAddToCart} />);

      expect(screen.getByTestId('product-name')).toHaveTextContent('Test & Product < > "Special"');
    });
  });

  describe('accessibility', () => {
    it('should have accessible button', () => {
      const product = createMockProduct();

      render(<ProductCard product={product} onAddToCart={mockOnAddToCart} />);

      const button = screen.getByTestId('add-to-cart-button');
      expect(button).toHaveAccessibleName('Add to Cart');
    });

    it('should have accessible image', () => {
      const product = createMockProduct({ name: 'Accessible Product' });

      render(<ProductCard product={product} onAddToCart={mockOnAddToCart} />);

      const image = screen.getByAltText('Accessible Product');
      expect(image).toBeInTheDocument();
    });
  });
});


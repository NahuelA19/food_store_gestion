# Spec: Frontend Product UI

**Status**: Approved  
**Version**: 1.0  
**Owner**: Frontend Team

---

## Overview

React components for product browsing, filtering, and detail viewing. Uses React 18 functional components with TypeScript strict mode.

---

## Component Architecture

```
App
├── pages/ProductsPage
│   ├── hooks/useProducts
│   ├── hooks/useFilters
│   ├── components/SearchInput
│   ├── components/CategoryFilter
│   ├── components/ProductGrid
│   │   └── components/ProductCard (×20)
│   │       └── components/AddToCartButton
│   └── components/Pagination
└── pages/ProductDetailPage
    ├── hooks/useProduct (single)
    ├── components/ProductDetail
    │   ├── ProductImages
    │   ├── ProductInfo
    │   ├── StockStatus
    │   └── AddToCartButton
    └── components/RelatedProducts
        └── components/ProductCard (×4)
```

---

## TypeScript Types

### Product Types

```typescript
// src/types/product.ts
export interface Category {
    id: number;
    name: string;
    description: string | null;
    created_at: string;
    updated_at: string;
}

export interface Inventory {
    id: number;
    product_id: number;
    stock_quantity: number;
    reserved_quantity: number;
    available_quantity: number;
    low_stock_threshold: number;
    created_at: string;
    updated_at: string;
}

export interface Product {
    id: number;
    name: string;
    description: string | null;
    price: number; // or Decimal (convert from API)
    category: Category;
    is_available: boolean;
    inventory: Inventory | null;
    created_at: string;
    updated_at: string;
}

export interface ProductListResponse {
    items: Product[];
    total: number;
    page: number;
    limit: number;
    total_pages: number;
    has_next: boolean;
    has_previous: boolean;
}

export type ProductSortField = "name" | "price" | "created_at";
export type SortOrder = "asc" | "desc";
```

---

## Custom Hooks

### useProducts

**Purpose**: Fetch products with filtering and pagination

```typescript
// src/hooks/useProducts.ts
interface UseProductsOptions {
    page?: number;
    limit?: number;
    categoryId?: number | null;
    searchQuery?: string;
    minPrice?: number;
    maxPrice?: number;
    sortField?: ProductSortField;
    sortOrder?: SortOrder;
    inStockOnly?: boolean;
}

interface UseProductsReturn {
    products: Product[];
    total: number;
    page: number;
    totalPages: number;
    isLoading: boolean;
    error: Error | null;
    hasNext: boolean;
    hasPrevious: boolean;
    refetch: () => Promise<void>;
}

export function useProducts(options: UseProductsOptions = {}): UseProductsReturn {
    const [products, setProducts] = useState<Product[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    useEffect(() => {
        const fetchProducts = async () => {
            setIsLoading(true);
            setError(null);
            
            try {
                const params = new URLSearchParams({
                    page: String(options.page ?? 1),
                    limit: String(options.limit ?? 20),
                    ...(options.categoryId && { category_id: String(options.categoryId) }),
                    ...(options.searchQuery && { search: options.searchQuery }),
                    ...(options.minPrice && { min_price: String(options.minPrice) }),
                    ...(options.maxPrice && { max_price: String(options.maxPrice) }),
                    ...(options.sortField && { sort: options.sortField }),
                    ...(options.sortOrder && { order: options.sortOrder }),
                    ...(options.inStockOnly && { in_stock: "true" }),
                });
                
                const response = await fetch(`${API_URL}/products?${params}`);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                const data: ProductListResponse = await response.json();
                setProducts(data.items);
                setTotal(data.total);
            } catch (err) {
                setError(err instanceof Error ? err : new Error(String(err)));
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchProducts();
    }, [options.page, options.categoryId, options.searchQuery]);
    
    return {
        products,
        total,
        page: options.page ?? 1,
        totalPages: Math.ceil(total / (options.limit ?? 20)),
        isLoading,
        error,
        hasNext: (options.page ?? 1) < Math.ceil(total / (options.limit ?? 20)),
        hasPrevious: (options.page ?? 1) > 1,
        refetch: () => { /* trigger re-fetch */ },
    };
}
```

### useFilters

**Purpose**: Manage filter state (category, search, price range)

```typescript
// src/hooks/useFilters.ts
interface UseFiltersReturn {
    filters: ProductFilters;
    setFilters: (filters: Partial<ProductFilters>) => void;
    clearFilters: () => void;
    updateCategory: (categoryId: number | null) => void;
    updateSearch: (query: string) => void;
    updatePriceRange: (min: number, max: number) => void;
}

export interface ProductFilters {
    categoryId: number | null;
    searchQuery: string;
    minPrice: number | null;
    maxPrice: number | null;
    inStockOnly: boolean;
}

export function useFilters(onFiltersChange?: (filters: ProductFilters) => void): UseFiltersReturn {
    const [filters, setFilters] = useState<ProductFilters>({
        categoryId: null,
        searchQuery: "",
        minPrice: null,
        maxPrice: null,
        inStockOnly: false,
    });
    
    const updateFilters = (newFilters: Partial<ProductFilters>) => {
        const updated = { ...filters, ...newFilters };
        setFilters(updated);
        onFiltersChange?.(updated);
    };
    
    return {
        filters,
        setFilters: updateFilters,
        clearFilters: () => setFilters({ categoryId: null, searchQuery: "", minPrice: null, maxPrice: null, inStockOnly: false }),
        updateCategory: (categoryId) => updateFilters({ categoryId }),
        updateSearch: (query) => updateFilters({ searchQuery: query }),
        updatePriceRange: (min, max) => updateFilters({ minPrice: min, maxPrice: max }),
    };
}
```

### useProduct

**Purpose**: Fetch single product details

```typescript
// src/hooks/useProduct.ts
interface UseProductReturn {
    product: Product | null;
    isLoading: boolean;
    error: Error | null;
    refetch: () => Promise<void>;
}

export function useProduct(productId: number): UseProductReturn {
    const [product, setProduct] = useState<Product | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);
    
    useEffect(() => {
        const fetchProduct = async () => {
            setIsLoading(true);
            setError(null);
            
            try {
                const response = await fetch(`${API_URL}/products/${productId}`);
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                
                const data: Product = await response.json();
                setProduct(data);
            } catch (err) {
                setError(err instanceof Error ? err : new Error(String(err)));
            } finally {
                setIsLoading(false);
            }
        };
        
        fetchProduct();
    }, [productId]);
    
    return { product, isLoading, error, refetch: () => { /* trigger re-fetch */ } };
}
```

---

## Components

### ProductGrid

**Purpose**: Display paginated product list in grid layout

```typescript
// src/components/ProductGrid.tsx
interface ProductGridProps {
    products: Product[];
    isLoading: boolean;
    error: Error | null;
    onPageChange: (page: number) => void;
    currentPage: number;
    totalPages: number;
    onAddToCart: (productId: number, quantity: number) => void;
}

export function ProductGrid({
    products,
    isLoading,
    error,
    onPageChange,
    currentPage,
    totalPages,
    onAddToCart,
}: ProductGridProps): JSX.Element {
    if (error) {
        return (
            <div className="error-container">
                <p>Error loading products: {error.message}</p>
                <button onClick={() => window.location.reload()}>Retry</button>
            </div>
        );
    }
    
    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {Array.from({ length: 20 }).map((_, i) => (
                    <ProductCardSkeleton key={i} />
                ))}
            </div>
        );
    }
    
    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {products.map((product) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        onAddToCart={(qty) => onAddToCart(product.id, qty)}
                    />
                ))}
            </div>
            
            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={onPageChange}
                />
            )}
        </>
    );
}
```

### ProductCard

**Purpose**: Display single product summary with add-to-cart

```typescript
// src/components/ProductCard.tsx
interface ProductCardProps {
    product: Product;
    onAddToCart: (quantity: number) => void;
}

export function ProductCard({ product, onAddToCart }: ProductCardProps): JSX.Element {
    const [quantity, setQuantity] = useState(1);
    
    const isOutOfStock = !product.inventory || product.inventory.available_quantity === 0;
    const isLowStock = product.inventory && product.inventory.available_quantity < product.inventory.low_stock_threshold;
    
    return (
        <div className="border rounded-lg overflow-hidden hover:shadow-lg transition">
            {/* Placeholder image */}
            <div className="aspect-square bg-gray-200 flex items-center justify-center">
                <span className="text-gray-400">No image</span>
            </div>
            
            <div className="p-4">
                <h3 className="font-semibold truncate">{product.name}</h3>
                
                <div className="flex items-center justify-between mt-2">
                    <span className="text-lg font-bold">${product.price.toFixed(2)}</span>
                    <span className="text-sm bg-gray-100 px-2 py-1 rounded">{product.category.name}</span>
                </div>
                
                {isOutOfStock && (
                    <div className="mt-2 text-red-600 font-semibold">Out of Stock</div>
                )}
                
                {isLowStock && !isOutOfStock && (
                    <div className="mt-2 text-orange-600 text-sm">
                        Low stock ({product.inventory?.available_quantity} available)
                    </div>
                )}
                
                {!isOutOfStock && (
                    <AddToCartButton
                        productId={product.id}
                        quantity={quantity}
                        onQuantityChange={setQuantity}
                        onAddToCart={() => onAddToCart(quantity)}
                    />
                )}
            </div>
        </div>
    );
}
```

### ProductDetail

**Purpose**: Full product information page

```typescript
// src/components/ProductDetail.tsx
interface ProductDetailProps {
    product: Product;
    onAddToCart: (quantity: number) => void;
    isLoading?: boolean;
}

export function ProductDetail({ product, onAddToCart, isLoading = false }: ProductDetailProps): JSX.Element {
    const [quantity, setQuantity] = useState(1);
    
    if (isLoading) {
        return <div className="animate-pulse">Loading...</div>;
    }
    
    const isOutOfStock = !product.inventory || product.inventory.available_quantity === 0;
    const stockPercentage = product.inventory
        ? (product.inventory.available_quantity / product.inventory.stock_quantity) * 100
        : 0;
    
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Product image placeholder */}
            <div className="aspect-square bg-gray-200 flex items-center justify-center rounded-lg">
                <span className="text-gray-400 text-2xl">No image</span>
            </div>
            
            <div className="space-y-6">
                <div>
                    <h1 className="text-4xl font-bold">{product.name}</h1>
                    <p className="text-gray-600 mt-2">{product.category.name}</p>
                </div>
                
                <div className="text-3xl font-bold">${product.price.toFixed(2)}</div>
                
                {product.description && (
                    <p className="text-gray-700">{product.description}</p>
                )}
                
                <StockStatus
                    isAvailable={product.is_available}
                    isOutOfStock={isOutOfStock}
                    quantity={product.inventory?.available_quantity ?? 0}
                    stockPercentage={stockPercentage}
                />
                
                {!isOutOfStock && (
                    <AddToCartButton
                        productId={product.id}
                        quantity={quantity}
                        onQuantityChange={setQuantity}
                        onAddToCart={() => onAddToCart(quantity)}
                    />
                )}
            </div>
        </div>
    );
}
```

### CategoryFilter

**Purpose**: Filter products by category

```typescript
// src/components/CategoryFilter.tsx
interface CategoryFilterProps {
    categories: Category[];
    selectedCategoryId: number | null;
    onCategoryChange: (categoryId: number | null) => void;
}

export function CategoryFilter({
    categories,
    selectedCategoryId,
    onCategoryChange,
}: CategoryFilterProps): JSX.Element {
    return (
        <div className="space-y-2">
            <label className="block text-sm font-semibold">Category</label>
            <select
                value={selectedCategoryId ?? ""}
                onChange={(e) => onCategoryChange(e.target.value ? Number(e.target.value) : null)}
                className="w-full border rounded px-3 py-2"
            >
                <option value="">All Categories</option>
                {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                        {cat.name}
                    </option>
                ))}
            </select>
        </div>
    );
}
```

### SearchInput

**Purpose**: Search products with debouncing

```typescript
// src/components/SearchInput.tsx
interface SearchInputProps {
    onSearch: (query: string) => void;
    placeholder?: string;
}

export function SearchInput({ onSearch, placeholder = "Search products..." }: SearchInputProps): JSX.Element {
    const [query, setQuery] = useState("");
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setQuery(value);
        
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }
        
        debounceTimerRef.current = setTimeout(() => {
            onSearch(value);
        }, 300);
    };
    
    return (
        <input
            type="text"
            value={query}
            onChange={handleChange}
            placeholder={placeholder}
            className="w-full border rounded px-4 py-2"
        />
    );
}
```

### Pagination

**Purpose**: Navigate between product pages

```typescript
// src/components/Pagination.tsx
interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps): JSX.Element {
    return (
        <div className="flex justify-center gap-2 mt-8">
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border rounded disabled:opacity-50"
            >
                Previous
            </button>
            
            <span className="px-4 py-2">
                Page {currentPage} of {totalPages}
            </span>
            
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border rounded disabled:opacity-50"
            >
                Next
            </button>
        </div>
    );
}
```

### AddToCartButton

**Purpose**: Add product to cart with quantity selector

```typescript
// src/components/AddToCartButton.tsx
interface AddToCartButtonProps {
    productId: number;
    quantity: number;
    onQuantityChange: (quantity: number) => void;
    onAddToCart: () => void;
}

export function AddToCartButton({
    productId,
    quantity,
    onQuantityChange,
    onAddToCart,
}: AddToCartButtonProps): JSX.Element {
    const [isAdding, setIsAdding] = useState(false);
    
    const handleAddToCart = async () => {
        setIsAdding(true);
        try {
            // Emit event to parent or use cart context
            onAddToCart();
            // Show toast notification
            console.log(`Added ${quantity} of product ${productId} to cart`);
        } finally {
            setIsAdding(false);
        }
    };
    
    return (
        <div className="flex gap-2 mt-4">
            <div className="flex items-center border rounded">
                <button
                    onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
                    className="px-3 py-2"
                >
                    −
                </button>
                <span className="px-4 py-2">{quantity}</span>
                <button
                    onClick={() => onQuantityChange(quantity + 1)}
                    className="px-3 py-2"
                >
                    +
                </button>
            </div>
            
            <button
                onClick={handleAddToCart}
                disabled={isAdding}
                className="flex-1 bg-blue-600 text-white rounded px-4 py-2 disabled:opacity-50"
            >
                {isAdding ? "Adding..." : "Add to Cart"}
            </button>
        </div>
    );
}
```

### StockStatus

**Purpose**: Display inventory status

```typescript
// src/components/StockStatus.tsx
interface StockStatusProps {
    isAvailable: boolean;
    isOutOfStock: boolean;
    quantity: number;
    stockPercentage: number;
}

export function StockStatus({
    isAvailable,
    isOutOfStock,
    quantity,
    stockPercentage,
}: StockStatusProps): JSX.Element {
    if (!isAvailable) {
        return <div className="text-red-600 font-semibold">Currently Unavailable</div>;
    }
    
    if (isOutOfStock) {
        return <div className="text-red-600 font-semibold">Out of Stock</div>;
    }
    
    return (
        <div className="space-y-2">
            <div className="text-green-600 font-semibold">In Stock</div>
            <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                    className={`h-2 rounded-full transition ${stockPercentage > 20 ? "bg-green-600" : "bg-orange-600"}`}
                    style={{ width: `${Math.min(100, stockPercentage)}%` }}
                />
            </div>
            <p className="text-sm text-gray-600">{quantity} items available</p>
        </div>
    );
}
```

---

## Pages

### ProductsPage

**Purpose**: Main product browsing page

```typescript
// src/pages/ProductsPage.tsx
export function ProductsPage(): JSX.Element {
    const [page, setPage] = useState(1);
    const filters = useFilters();
    const { products, total, isLoading, error, totalPages } = useProducts({
        page,
        ...filters.filters,
    });
    
    const { categories } = useCategories();
    
    const handleAddToCart = (productId: number, quantity: number) => {
        // Emit to cart context/state
        console.log(`Add ${quantity}x product ${productId} to cart`);
    };
    
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Products</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {/* Sidebar */}
                <div className="space-y-4">
                    <SearchInput onSearch={(q) => filters.updateSearch(q)} />
                    <CategoryFilter
                        categories={categories}
                        selectedCategoryId={filters.filters.categoryId}
                        onCategoryChange={(id) => filters.updateCategory(id)}
                    />
                </div>
                
                {/* Main content */}
                <div className="md:col-span-3">
                    <ProductGrid
                        products={products}
                        isLoading={isLoading}
                        error={error}
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                        onAddToCart={handleAddToCart}
                    />
                </div>
            </div>
        </div>
    );
}
```

### ProductDetailPage

**Purpose**: Single product detail view

```typescript
// src/pages/ProductDetailPage.tsx
export function ProductDetailPage(): JSX.Element {
    const { id } = useParams<{ id: string }>();
    const productId = Number(id);
    
    const { product, isLoading, error } = useProduct(productId);
    const { products: relatedProducts } = useProducts({
        categoryId: product?.category.id,
        limit: 4,
    });
    
    if (error) {
        return <div className="text-red-600">Error loading product</div>;
    }
    
    if (isLoading || !product) {
        return <div>Loading...</div>;
    }
    
    const handleAddToCart = (quantity: number) => {
        console.log(`Add ${quantity}x to cart`);
    };
    
    return (
        <div className="space-y-8">
            <ProductDetail
                product={product}
                onAddToCart={handleAddToCart}
            />
            
            {relatedProducts.length > 0 && (
                <div>
                    <h2 className="text-2xl font-bold mb-4">Related Products</h2>
                    <div className="grid grid-cols-4 gap-4">
                        {relatedProducts.map((p) => (
                            <ProductCard
                                key={p.id}
                                product={p}
                                onAddToCart={(qty) => handleAddToCart(qty)}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
```

---

## Testing Checklist

- [ ] ProductGrid renders products correctly
- [ ] ProductCard displays price, name, category
- [ ] ProductCard "Add to Cart" button works
- [ ] CategoryFilter filters products
- [ ] SearchInput debounces and filters
- [ ] Pagination works and updates URL
- [ ] ProductDetail page loads product data
- [ ] ProductDetail shows inventory status
- [ ] useProducts hook handles loading state
- [ ] useProducts hook handles errors
- [ ] useFilters hook manages filter state
- [ ] useProduct hook fetches single product
- [ ] Components handle empty states (no products)
- [ ] Components handle error states
- [ ] Responsive design works on mobile

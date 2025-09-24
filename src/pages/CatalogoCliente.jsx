// src/pages/CatalogoCliente.jsx

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Package as PackageIcon, ShoppingCart, Frown, ImageOff, Loader2, Archive, PackageCheck, PackageX } from "lucide-react";
import { toast } from "sonner";
import Pagination from '../components/ui/Pagination';
import CartSidebar from '../components/CartSidebar';
import ProductDetailModal from '../components/ProductDetailModal';
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext"; // ✨ 1. Importamos el hook useAuth
// src/pages/CatalogoCliente.jsx
import { ClientProductCardSkeleton } from '../components/ui/ClientProductCardSkeleton';
import "../styles/CatalogoCliente.css";
import { formatCurrency } from "../utils/formatters";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const ProductImage = ({ src, alt }) => {
    const [imageSrc, setImageSrc] = useState(src);
    const [hasError, setHasError] = useState(!src);

    useEffect(() => {
        setImageSrc(src);
        setHasError(!src);
    }, [src]);

    const handleError = () => {
        setHasError(true);
    };

    if (hasError) {
        return (
            <div className="product-card-image-placeholder">
                <ImageOff className="placeholder-icon" />
            </div>
        );
    }

    return <img src={imageSrc} alt={alt} onError={handleError} className="w-full h-48 object-contain" />;
};

const getStockInfo = (stock) => {
    if (stock === 0) {
        return { text: "Agotado", className: "stock-out", Icon: PackageX };
    }
    if (stock < 10) {
        return { text: `¡Solo quedan ${stock}!`, className: "stock-low", Icon: Archive };
    }
    return { text: `${stock} disponibles`, className: "stock-available", Icon: PackageCheck };
};

export default function CatalogoCliente() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [categorySearch, setCategorySearch] = useState("");
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);

     const [currentPage, setCurrentPage] = useState(1);
    const [isChangingPage, setIsChangingPage] = useState(false); // ✨ AÑADIR
    const ITEMS_PER_PAGE = 12;

    const headerRef = useRef(null);
    
    const { 
        cart, addToCart, removeFromCart, updateQuantity, 
        cartSubtotal, cartIva, cartTotal, totalItems, 
        isCartOpen, setIsCartOpen, justAdded 
    } = useCart();
    
    const navigate = useNavigate();
    // ✨ 2. Obtenemos los tokens del contexto
    const { authTokens } = useAuth();


    const handlePageChange = (page) => {
        if (headerRef.current) {
            headerRef.current.scrollIntoView({
                behavior: 'auto' 
            });
        }
        setIsChangingPage(true);
        setTimeout(() => {
            setCurrentPage(page);
            setIsChangingPage(false);
        }, 1000);
    };
    
    const fetchCatalogoData = useCallback(async () => {
        setLoading(true);
        setError(null);
        // ✨ 3. Usamos el token del contexto
        const token = authTokens?.access;
        if (!token) {
            // No es necesario navegar aquí, PrivateRoute ya se encarga de proteger la página
            setError("No estás autenticado.");
            setLoading(false);
            return;
        }
        try {
            const response = await fetch(`${API_BASE_URL}/cliente/catalogo/`, { 
                headers: { 'Authorization': `Bearer ${token}` } 
            });
            
            if (!response.ok) {
                throw new Error('No se pudo cargar la información del catálogo.');
            }
            const data = await response.json();
            
            setProducts(data.products || []);
            setCategories(data.categories || []);
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    // ✨ 4. Añadimos authTokens a las dependencias
    }, [authTokens]);

    useEffect(() => {
        // Solo cargamos los datos si los tokens están disponibles
        if(authTokens) {
            fetchCatalogoData();
        }
    }, [fetchCatalogoData, authTokens]);

    const filteredCategories = useMemo(() => {
        return categories.filter(c =>
            c.nombre.toLowerCase().includes(categorySearch.toLowerCase())
        );
    }, [categories, categorySearch]);

    const filteredProducts = useMemo(() => {
        const searchTermLower = searchTerm.toLowerCase();

        return products.filter((product) => {
            const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(product.categoria?.nombre);
            
            const matchesSearch = searchTermLower === '' ||
                product.nombre.toLowerCase().includes(searchTermLower) ||
                // LÍNEA CORREGIDA
                (product.marca?.nombre?.toLowerCase() || "").includes(searchTermLower) ||
                (product.categoria?.nombre || '').toLowerCase().includes(searchTermLower);

            return matchesCategory && matchesSearch;
        });
    }, [products, searchTerm, selectedCategories]);

    // ✨ 3. AÑADE ESTE EFECTO PARA RESETEAR LA PÁGINA AL FILTRAR
    useEffect(() => {
      setCurrentPage(1); // Vuelve a la página 1 cada vez que cambian los filtros
    }, [searchTerm, selectedCategories]);


    // ✨ 4. AÑADE LA LÓGICA PARA PAGINAR LOS PRODUCTOS
    const paginatedProducts = useMemo(() => {
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        return filteredProducts.slice(startIndex, endIndex);
    }, [filteredProducts, currentPage]);

    const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

    const handleCategoryChange = (categoryName) => {
        setSelectedCategories(prev => {
            if (prev.includes(categoryName)) {
                return prev.filter(c => c !== categoryName);
            } else {
                return [...prev, categoryName];
            }
        });
    };

    const handleProceedToPayment = () => {
        setIsCartOpen(false);
        navigate('/checkout');
    };

    const handleAddToCart = (product, event) => {
        event.stopPropagation();
        const productForCart = {
            ...product,
            price: product.precio_venta
        };
        
        addToCart(productForCart);
        toast.success(`${product.nombre} añadido al carrito!`);
    };

     const handleViewProductDetails = (product) => {
        setSelectedProduct(product); // ✨ ¡Eso es todo! Solo establece el producto para el modal.
    };

    return (
        <div className="catalogo-container-new">
            {isCartOpen && <div className="cart-overlay" onClick={() => setIsCartOpen(false)} />}
            
            <CartSidebar
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                cart={cart}
                cartSubtotal={cartSubtotal}
                cartIva={cartIva}
                cartTotal={cartTotal}
                totalItems={totalItems}
                onUpdateQuantity={updateQuantity}
                onRemoveFromCart={removeFromCart}
                onProceedToPayment={handleProceedToPayment}
                onViewProductDetails={handleViewProductDetails}
            />

            <div
                className={`cart-floating-button ${justAdded ? 'just-added' : ''}`}
                onClick={() => setIsCartOpen(true)}
            >
                <ShoppingCart />
                {cart.length > 0 && <span className="cart-badge">{totalItems}</span>}
            </div>

            <section ref={headerRef} className="hero-section-new">
                <div className="hero-content">
                    <h1 className="hero-title-new">Nuestra Tienda</h1>
                    <p className="hero-description-new">
                        Explora nuestra amplia gama de productos de alta calidad para cada necesidad de tu obra.
                    </p>
                </div>
            </section>

            <section className="search-bar-section">
                <div className="page-search-container">
                    <Search className="page-search-icon" size={20} />
                    <input
                        type="search"
                        placeholder="Buscar por nombre, marca o categoría..."
                        className="page-search-input"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </section>

            <section className="main-content-section">
                <div className="main-content-grid">
                    <aside>
                        <div className="filter-sidebar-new">
                            <div className="filter-header-new">
                                <h2 className="filter-title-new">
                                    <PackageIcon size={20} />
                                    Categorías
                                </h2>
                            </div>
                            <div className="filter-content-new">
                                <div className="category-search-container">
                                    <Search className="category-search-icon" size={18} />
                                    <input
                                        type="search"
                                        placeholder="Buscar categoría..."
                                        className="category-search-input"
                                        value={categorySearch}
                                        onChange={(e) => setCategorySearch(e.target.value)}
                                    />
                                </div>
                                <ul className="filter-buttons-list category-filter-list">
                                    <li>
                                        <button
                                            className="filter-button-new"
                                            onClick={() => setSelectedCategories([])}
                                        >
                                            Limpiar filtros
                                        </button>
                                    </li>
                                    {filteredCategories.length > 0 ? (
                                        filteredCategories.map((category) => (
                                            <li key={category.id} className="category-filter-item">
                                                <input
                                                    type="checkbox"
                                                    id={`client-cat-${category.id}`}
                                                    className="category-checkbox"
                                                    checked={selectedCategories.includes(category.nombre)}
                                                    onChange={() => handleCategoryChange(category.nombre)}
                                                />
                                                <label htmlFor={`client-cat-${category.id}`}>{category.nombre}</label>
                                            </li>
                                        ))
                                    ) : (
                                        <li className="no-category-found">
                                            {loading ? 'Cargando...' : 'No hay categorías.'}
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    </aside>

                    <main>
    {loading ? (
        <div className="loading-container">
            <Loader2 className="loading-icon" />
            <p className="loading-text">Cargando productos...</p>
        </div>
    ) : error ? (
        <div className="no-results-container">
            <p className="error-text">{error}</p>
        </div>
    ) : filteredProducts.length > 0 ? (
        <>
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
                {isChangingPage ? (
                    Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
                        <ClientProductCardSkeleton key={index} />
                    ))
                ) : (
                    paginatedProducts.map((product) => {
                        const stockInfo = getStockInfo(product.stock_actual);
                        return (
                            <div 
                                key={product.id} 
                                className="product-card-new"
                                onClick={() => setSelectedProduct(product)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="product-card-header-new">
                                    <ProductImage src={product.imagen_url} alt={product.nombre} />
                                </div>
                                <div className="product-card-content-new">
                                    <span className="product-card-badge">{product.categoria?.nombre || 'Sin Categoría'}</span>
                                    <h3 className="product-card-title">{product.nombre}</h3>
                                    <p className="product-card-description">{product.descripcion}</p>
                                    
                                    <div className={`product-card-stock ${stockInfo.className}`}>
                                        <stockInfo.Icon size={16} />
                                        <span>{stockInfo.text}</span>
                                    </div>
                                </div>
                                <div className="product-card-footer-new">
                                    <p className="product-card-price">{formatCurrency(product.precio_venta)}</p>
                                    
                                    {product.stock_actual > 0 ? (
                                        <button className="product-card-button" onClick={(e) => handleAddToCart(product, e)}>
                                            Agregar
                                        </button>
                                    ) : (
                                        <button className="product-card-button-disabled" disabled>
                                            Agotado
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
            
            <Pagination 
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />
        </>
    ) : (
        <div className="no-results-container">
            
            <p className="no-results-text">No se encontraron productos que coincidan con tu búsqueda o filtros.</p>
        </div>
    )}
</main>
                </div>
            </section>

            {selectedProduct && (
                <ProductDetailModal 
                    product={selectedProduct} 
                    onClose={() => setSelectedProduct(null)} 
                />
            )}
        </div>
    );
}
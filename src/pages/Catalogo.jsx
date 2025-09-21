// src/pages/Catalogo.jsx

import React, { useState, useEffect, useMemo, useRef  } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search, Package, ImageOff, Loader2, Archive, PackageCheck, PackageX, ShoppingCart } from 'lucide-react';
import { toast } from "sonner";
import Pagination from '../components/ui/Pagination';

import { ProductCardSkeleton } from '../components/ui/ProductCardSkeleton';

import { useCart } from '../context/CartContext';
import CartSidebar from '../components/CartSidebar';
import ProductDetailModal from '../components/ProductDetailModal';
import { formatCurrency } from '../utils/formatters';
import '../styles/CatalogoCliente.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

const ProductImage = ({ src, alt }) => {
    const [imageSrc, setImageSrc] = useState(src);
    const [hasError, setHasError] = useState(!src);
    useEffect(() => { setImageSrc(src); setHasError(!src); }, [src]);
    const handleError = () => { setHasError(true); };
    if (hasError) {
        return (
            <div className="w-full h-48 bg-slate-200 flex items-center justify-center">
                <ImageOff className="h-10 w-10 text-slate-400" />
            </div>
        );
    }
    return <img src={imageSrc} alt={alt} onError={handleError} className="w-full h-48 object-contain" />;
};

const getStockInfoTailwind = (stock) => {
    if (stock === 0) {
        return { text: "Agotado", className: "text-red-600", Icon: PackageX };
    }
    if (stock < 10) {
        return { text: `¡Solo quedan ${stock}!`, className: "text-orange-600", Icon: Archive };
    }
    return { text: `${stock} unidades disponibles`, className: "text-green-700", Icon: PackageCheck };
};

export default function Catalogo() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [categorySearch, setCategorySearch] = useState("");
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    
    const [currentPage, setCurrentPage] = useState(1);
    const [isChangingPage, setIsChangingPage] = useState(false);
    const ITEMS_PER_PAGE = 12; // Número de productos por página
    

    const productListRef = useRef(null);
    const headerRef = useRef(null);

    const { 
        cart, addToCart, removeFromCart, updateQuantity,
        cartSubtotal, cartIva, cartTotal, totalItems, 
        isCartOpen, setIsCartOpen, justAdded 
    } = useCart();
    
    const navigate = useNavigate();

    useEffect(() => {
    const fetchCatalogoData = async () => {
        setLoading(true);
        setError(null);
        try {
            // ✨ AQUÍ ESTÁ EL ÚNICO CAMBIO ✨
            // Añadimos el parámetro '?all=true' a la URL.
            const response = await fetch(`${API_BASE_URL}/public/catalogo/?all=true`);

            if (!response.ok) {
                throw new Error('No se pudo conectar con el servidor para cargar el catálogo.');
            }
            const data = await response.json();
            
            // Como la paginación estará desactivada para esta llamada,
            // 'data.products' ahora contendrá los 20 productos.
            setProducts(data.products || []);
            setCategories(data.categories || []);
        } catch (err) {
            setError(err.message);
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };
    fetchCatalogoData();
}, []);
    
    const filteredCategories = useMemo(() => {
        return categories.filter(c =>
            c.nombre.toLowerCase().includes(categorySearch.toLowerCase())
        );
    }, [categories, categorySearch]);

    const filteredProducts = useMemo(() => {
        const searchTermLower = searchTerm.toLowerCase();

        return products.filter(product => {
            const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(product.categoria?.nombre);

            const matchesSearch = searchTermLower === '' ||
                product.nombre.toLowerCase().includes(searchTermLower) ||
                // LÍNEA CORREGIDA
                (product.marca?.nombre?.toLowerCase() || "").includes(searchTermLower) ||
                (product.categoria?.nombre || '').toLowerCase().includes(searchTermLower);
            
            return matchesCategory && matchesSearch;
        });
    }, [products, searchTerm, selectedCategories]);


    useEffect(() => {
      setCurrentPage(1); // Vuelve a la página 1 cada vez que cambian los filtros
    }, [searchTerm, selectedCategories]);

    // src/pages/Catalogo.jsx

// src/pages/Catalogo.jsx
const handlePageChange = (page) => {
    // 1. PRIMERO, desplaza la vista al inicio de forma INSTANTÁNEA.
    // Usamos 'behavior: auto' para que sea un salto y no una animación.
    // Al ser instantáneo, no puede ser interrumpido.
    if (headerRef.current) {
        headerRef.current.scrollIntoView({
            behavior: 'auto' 
        });
    }

    // 2. AHORA, muestra el estado de carga (los esqueletos).
    setIsChangingPage(true);
    
    // 3. Finalmente, después de una breve pausa para que se vean los esqueletos,
    //    actualiza el número de página y muestra los nuevos productos.
    setTimeout(() => {
        setCurrentPage(page);
        setIsChangingPage(false);
    }, 1000); // Usamos un tiempo más corto, solo para la percepción visual.
};



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
    
    const handleAddToCartClick = (product, event) => {
        event.stopPropagation();
        const productForCart = {
            ...product,
            price: product.precio_venta
        };
        addToCart(productForCart);
        toast.success(`${product.nombre} añadido al carrito!`);
    };

    const handleProceedToPayment = () => {
        setIsCartOpen(false);
        navigate('/checkout');
    };

    // ▼▼▼ NUEVA FUNCIÓN ▼▼▼
    // Esta función maneja el clic en un producto desde el carrito.
    // ▼▼▼ MODIFICACIÓN DE LA FUNCIÓN ▼▼▼
    // Antes, esta función cerraba el carrito. Ahora solo abre el modal.
    const handleViewProductDetails = (product) => {
        setSelectedProduct(product); // ✨ ¡Eso es todo! Solo establece el producto para el modal.
    };
    // ▲▲▲ FIN DE LA MODIFICACIÓN ▲▲▲

    return (
        <>
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

            <section ref={headerRef} className="bg-blue-900 border-b">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 text-center">
                    <h1 className="text-4xl lg:text-5xl font-bold text-white">Nuestro Catálogo</h1>
                    <p className="mt-4 text-xl text-white max-w-3xl mx-auto">Explora nuestra amplia gama de productos de alta calidad para cada necesidad de tu obra.</p>
                </div>
            </section>

            <section className="sticky top-16 z-20 bg-slate-50 border-b border-slate-200 py-4">
                <div className="max-w-3xl mx-auto px-4">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                        <Input
                            type="search"
                            placeholder="Buscar por nombre, marca o categoría..."
                            className="pl-12 h-12 w-full text-lg bg-white border-slate-300"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </section>

            <section className="py-12">
                <div className="w-full px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-4 gap-8">
                        <aside className="lg:col-span-1">
                            <Card className="sticky top-48 shadow-sm">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Package className="h-5 w-5"/>
                                        Categorías
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="relative mb-4">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <Input type="search" placeholder="Buscar categoría..." className="pl-10 h-10 w-full" value={categorySearch} onChange={e => setCategorySearch(e.target.value)} />
                                    </div>
                                    
                                    <ul className="space-y-2 category-filter-list">
                                        <li>
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start text-sm"
                                                onClick={() => setSelectedCategories([])}
                                            >
                                                Limpiar filtros
                                            </Button>
                                        </li>
                                        {filteredCategories.length > 0 ? (
                                            filteredCategories.map(category => (
                                                <li key={category.id} className="category-filter-item">
                                                    <input
                                                        type="checkbox"
                                                        id={`cat-${category.id}`}
                                                        className="category-checkbox"
                                                        checked={selectedCategories.includes(category.nombre)}
                                                        onChange={() => handleCategoryChange(category.nombre)}
                                                    />
                                                    <label htmlFor={`cat-${category.id}`}>{category.nombre}</label>
                                                </li>
                                            ))
                                        ) : (<li className="p-2 text-sm text-slate-500 italic">{loading ? 'Cargando...' : 'No se encontraron categorías.'}</li>)}
                                    </ul>

                                </CardContent>
                            </Card>
                        </aside>
                        
                        <main className="lg:col-span-3" ref={productListRef}>
    {loading ? (
        <div className="text-center py-16 flex flex-col items-center justify-center">
            <Loader2 className="h-12 w-12 animate-spin text-blue-800" />
            <p className="mt-4 text-xl text-slate-500">Cargando productos...</p>
        </div>
    ) : error ? (
        <div className="text-center py-16">
            <p className="text-xl text-red-600">{error}</p>
        </div>
    ) : filteredProducts.length > 0 ? (
        <>
            <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-6">
                {isChangingPage ? (
                    // "True" part: Muestra los skeletons mientras cambia la página
                    Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
                        <ProductCardSkeleton key={index} />
                    ))
                ) : (
                    // "False" part: Muestra los productos reales
                    paginatedProducts.map((product) => {
                        const stockInfo = getStockInfoTailwind(product.stock_actual);
                        return (
                            <Card 
                                key={product.id} 
                                className="flex flex-col overflow-hidden hover:shadow-lg transition-shadow duration-300 cursor-pointer"
                                onClick={() => setSelectedProduct(product)}
                            >
                                <CardHeader className="p-0">
                                    <ProductImage src={product.imagen_url} alt={product.nombre} />
                                </CardHeader>
                                <CardContent className="p-4 flex-grow">
                                    <Badge variant="outline" className="mb-2">{product.categoria?.nombre || 'Sin Categoría'}</Badge>
                                    <CardTitle className="text-lg mb-1">{product.nombre}</CardTitle>
                                    <CardDescription>{product.descripcion}</CardDescription>
                                    <div className={`mt-2 flex items-center gap-2 text-sm font-medium ${stockInfo.className}`}>
                                        <stockInfo.Icon className="h-4 w-4" />
                                        <span>{stockInfo.text}</span>
                                    </div>
                                </CardContent>
                                <CardFooter className="p-4 bg-slate-50 flex justify-between items-center mt-auto">
                                    <p className="text-xl font-bold text-slate-800">{formatCurrency(product.precio_venta)}</p>
                                    {product.stock_actual > 0 ? (
                                        <Button onClick={(e) => handleAddToCartClick(product, e)}>
                                            <ShoppingCart className="mr-2 h-4 w-4" />
                                            Añadir
                                        </Button>
                                    ) : (
                                        <Button variant="outline" disabled>
                                            Agotado
                                        </Button>
                                    )}
                                </CardFooter>
                            </Card>
                        ); // Cierra el return de cada Card
                    })   // Cierra la función .map()
                )}      {/* Cierra el ternario (paréntesis) y la expresión JSX (llave) */}
            </div>

            <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={handlePageChange}
            />
        </>
    ) : (
        <div className="text-center py-16">
            <p className="text-xl text-slate-500">No se encontraron productos que coincidan con tu búsqueda o filtros.</p>
        </div>
    )}
</main>
                    </div>
                </div>
            </section>

            {selectedProduct && (
                <ProductDetailModal 
                    product={selectedProduct} 
                    onClose={() => setSelectedProduct(null)} 
                />
            )}
        </>
    );
}
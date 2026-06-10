import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, Heart, Search, User, LogOut } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { useCart } from '../../hooks/useCart';

export function StoreNavbar() {
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const { cart } = useCart();
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 w-full bg-[#0c0a09]/80 backdrop-blur-md border-b border-brand-500/20 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <span className="font-display text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-amber-200">
                FoodStore
              </span>
            </Link>
            <div className="hidden md:flex items-center gap-6">
              <Link to="/products" className="text-gray-300 hover:text-brand-400 font-medium transition-colors">Productos</Link>
              {user && <Link to="/orders" className="text-gray-300 hover:text-brand-400 font-medium transition-colors">Mis Pedidos</Link>}
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="text-gray-300 hover:text-brand-400 p-2 transition-colors">
              <Search size={20} />
            </button>
            <Link to="/wishlist" className="text-gray-300 hover:text-rose-400 p-2 transition-colors">
              <Heart size={20} />
            </Link>
            <Link to="/cart" className="text-gray-300 hover:text-brand-400 p-2 transition-colors relative flex items-center">
              <ShoppingCart size={20} />
              {cart && cart.items.length > 0 && (
                <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-500 text-[10px] font-bold text-white">
                  {cart.items.reduce((sum, item) => sum + item.quantity, 0)}
                </span>
              )}
            </Link>
            {user ? (
              <div className="flex items-center gap-2">
                <Link to="/profile" className="text-gray-300 hover:text-brand-400 p-2 transition-colors">
                  <User size={20} />
                </Link>
                <button onClick={handleLogout} className="text-gray-300 hover:text-danger p-2 transition-colors" title="Cerrar sesión">
                  <LogOut size={20} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="bg-brand-600 hover:bg-brand-500 text-white px-4 py-2 rounded-full font-semibold transition-all shadow-[0_0_15px_-3px_rgba(234,88,12,0.4)]">
                Ingresar
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { HomePage } from "./pages/HomePage";
import { CartPage } from "./pages/CartPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ProductsPage } from "./pages/ProductsPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { WishlistPage } from "./pages/WishlistPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { OrdersPage } from "./pages/OrdersPage";
import { OrderDetailPage } from "./pages/OrderDetailPage";
import { BranchesPage } from "./pages/BranchesPage";
import { BranchDetailPage } from "./pages/BranchDetailPage";
import { EmployeesPage } from "./pages/EmployeesPage";
import { ProtectedRoute } from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DashboardLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:id" element={<OrderDetailPage />} />
            <Route path="/branches" element={<BranchesPage />} />
            <Route path="/branches/:id" element={<BranchDetailPage />} />
            <Route path="/employees" element={<EmployeesPage />} />
            <Route
              path="/wishlist"
              element={
                <ProtectedRoute>
                  <WishlistPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <NotificationsPage />
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route
              path="/cart"
              element={
                <ProtectedRoute>
                  <CartPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </DashboardLayout>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;

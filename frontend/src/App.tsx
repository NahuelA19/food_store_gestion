import { BrowserRouter, Routes, Route } from "react-router-dom";
import { DashboardLayout } from "./components/layout/DashboardLayout";
import { HomePage } from "./pages/HomePage";
import { CartPage } from "./pages/CartPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ProfilePage } from "./pages/ProfilePage";
import { ProductsPage } from "./pages/ProductsPage";
import { CreateProductPage } from "./pages/CreateProductPage";
import { EditProductPage } from "./pages/EditProductPage";
import { CreateCategoryPage } from "./pages/CreateCategoryPage";
import { EditCategoryPage } from "./pages/EditCategoryPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { WishlistPage } from "./pages/WishlistPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { OrdersPage } from "./pages/OrdersPage";
import { OrderDetailPage } from "./pages/OrderDetailPage";
import { BranchesPage } from "./pages/BranchesPage";
import { BranchDetailPage } from "./pages/BranchDetailPage";
import { EmployeesPage } from "./pages/EmployeesPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentFailurePage from "./pages/PaymentFailurePage";
import { ProtectedRoute } from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
        <DashboardLayout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/products" element={<ProductsPage />} />
            <Route
              path="/categories/new"
              element={
                <ProtectedRoute>
                  <CreateCategoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/products/new"
              element={
                <ProtectedRoute>
                  <CreateProductPage />
                </ProtectedRoute>
              }
            />
            <Route path="/products/:id" element={<ProductDetailPage />} />
            <Route
              path="/products/:id/edit"
              element={
                <ProtectedRoute>
                  <EditProductPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/categories/:id/edit"
              element={
                <ProtectedRoute>
                  <EditCategoryPage />
                </ProtectedRoute>
              }
            />
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
            <Route path="/payment/success" element={<PaymentSuccessPage />} />
            <Route path="/payment/failure" element={<PaymentFailurePage />} />
          </Routes>
        </DashboardLayout>
    </BrowserRouter>
  );
}

export default App;

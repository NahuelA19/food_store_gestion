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
import { CategoriesPage } from "./pages/CategoriesPage";
import { ProductDetailPage } from "./pages/ProductDetailPage";
import { WishlistPage } from "./pages/WishlistPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { OrdersPage } from "./pages/OrdersPage";
import { OrderDetailPage } from "./pages/OrderDetailPage";
import { BranchesPage } from "./pages/BranchesPage";
import { BranchDetailPage } from "./pages/BranchDetailPage";
import { CreateBranchPage } from "./pages/CreateBranchPage";
import { EditBranchPage } from "./pages/EditBranchPage";
import { EmployeesPage } from "./pages/EmployeesPage";
import { CreateEmployeePage } from "./pages/CreateEmployeePage";
import { EditEmployeePage } from "./pages/EditEmployeePage";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";
import { ClientsPage } from "./pages/ClientsPage";
import { HelpPage } from "./pages/HelpPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import PaymentFailurePage from "./pages/PaymentFailurePage";
import PaymentPendingPage from "./pages/PaymentPendingPage";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { SettingsPage } from "./pages/SettingsPage";
import { CajeroPage } from "./pages/CajeroPage";
import { ChefPage } from "./pages/ChefPage";
import { CocinaPage } from "./pages/CocinaPage";
import { StoreLayout } from "./components/layout/StoreLayout";
import { useAuthStore } from "./store/authStore";

function RootLayout({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const isAdminOrStaff = 
    user?.role === "admin" || 
    ["cajero", "chef", "cocina", "pedidos"].includes(user?.role?.toLowerCase() ?? "");

  if (isAdminOrStaff) {
    return <DashboardLayout>{children}</DashboardLayout>;
  }
  
  return <StoreLayout>{children}</StoreLayout>;
}

function App() {
  return (
    <BrowserRouter>
        <RootLayout>
          <Routes>
            <Route path="/" element={<ProtectedRoute><HomePage /></ProtectedRoute>} />
            <Route path="/products" element={<ProtectedRoute><ProductsPage /></ProtectedRoute>} />
            <Route
              path="/categories/new"
              element={
                <ProtectedRoute requiredRole="admin">
                  <CreateCategoryPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/products/new"
              element={
                <ProtectedRoute requiredRole="admin">
                  <CreateProductPage />
                </ProtectedRoute>
              }
            />
            <Route path="/products/:id" element={<ProtectedRoute><ProductDetailPage /></ProtectedRoute>} />
            <Route
              path="/products/:id/edit"
              element={
                <ProtectedRoute requiredRole="admin">
                  <EditProductPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/categories/:id/edit"
              element={
                <ProtectedRoute requiredRole="admin">
                  <EditCategoryPage />
                </ProtectedRoute>
              }
            />
            <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
            <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
            <Route path="/branches" element={<ProtectedRoute><BranchesPage /></ProtectedRoute>} />
            <Route
              path="/branches/new"
              element={
                <ProtectedRoute requiredRole="admin">
                  <CreateBranchPage />
                </ProtectedRoute>
              }
            />
            <Route path="/branches/:id" element={<ProtectedRoute><BranchDetailPage /></ProtectedRoute>} />
            <Route
              path="/branches/:id/edit"
              element={
                <ProtectedRoute requiredRole="admin">
                  <EditBranchPage />
                </ProtectedRoute>
              }
            />
            <Route path="/employees" element={
              <ProtectedRoute requiredRole="admin">
                <EmployeesPage />
              </ProtectedRoute>
            } />
            <Route
              path="/employees/new"
              element={
                <ProtectedRoute requiredRole="admin">
                  <CreateEmployeePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/employees/:id/edit"
              element={
                <ProtectedRoute requiredRole="admin">
                  <EditEmployeePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/change-password"
              element={
                <ProtectedRoute>
                  <ChangePasswordPage />
                </ProtectedRoute>
              }
            />
            <Route path="/clients" element={
              <ProtectedRoute requiredRole="admin">
                <ClientsPage />
              </ProtectedRoute>
            } />
            <Route path="/categories" element={
              <ProtectedRoute requiredRole="admin">
                <CategoriesPage />
              </ProtectedRoute>
            } />
            <Route path="/help" element={
              <ProtectedRoute>
                <HelpPage />
              </ProtectedRoute>
            } />
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
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
            <Route path="/payment/success" element={<PaymentSuccessPage />} />
            <Route path="/payment/failure" element={<PaymentFailurePage />} />
            <Route path="/payment/pending" element={<PaymentPendingPage />} />
            <Route
              path="/cajero"
              element={
                <ProtectedRoute allowedRoles={["admin", "cajero"]}>
                  <CajeroPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cocina"
              element={
                <ProtectedRoute allowedRoles={["admin", "chef", "cocina"]}>
                  <ChefPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cocina"
              element={
                <ProtectedRoute allowedRoles={["admin", "cocina", "pedidos", "chef", "cajero"]}>
                  <CocinaPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </RootLayout>
    </BrowserRouter>
  );
}

export default App;

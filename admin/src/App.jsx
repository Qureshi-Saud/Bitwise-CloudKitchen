import { lazy, Suspense } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import { PageSkeleton } from './components/Skeletons';
import { useAdminAuth } from './context/AdminAuthContext';

const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Orders = lazy(() => import('./pages/Orders'));
const OrderDetail = lazy(() => import('./pages/OrderDetail'));
const Products = lazy(() => import('./pages/Products'));
const ProductForm = lazy(() => import('./pages/ProductForm'));
const Categories = lazy(() => import('./pages/Categories'));
const SnackBoxConfig = lazy(() => import('./pages/SnackBoxConfig'));
const Customers = lazy(() => import('./pages/Customers'));
const DeliverySlots = lazy(() => import('./pages/DeliverySlots'));
const Coupons = lazy(() => import('./pages/Coupons'));
const Reviews = lazy(() => import('./pages/Reviews'));
const ContactRequests = lazy(() => import('./pages/ContactRequests'));
const Settings = lazy(() => import('./pages/Settings'));

const Loader = () => <PageSkeleton />;

function RequireAuth({ children }) {
  const { isAuthenticated, booting } = useAdminAuth();
  const location = useLocation();

  if (booting) return <Loader />;
  if (!isAuthenticated) return <Navigate to="/login" state={{ from: location }} replace />;
  return children;
}

export default function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route
          element={
            <RequireAuth>
              <AdminLayout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="products" element={<Products />} />
          <Route path="products/new" element={<ProductForm />} />
          <Route path="products/:id" element={<ProductForm />} />
          <Route path="categories" element={<Categories />} />
          <Route path="snack-box" element={<SnackBoxConfig />} />
          <Route path="customers" element={<Customers />} />
          <Route path="delivery-slots" element={<DeliverySlots />} />
          <Route path="coupons" element={<Coupons />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="contact-requests" element={<ContactRequests />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </Suspense>
  );
}

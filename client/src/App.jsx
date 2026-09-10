import { lazy, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import { useSocketEvent } from './hooks/useSocket';
import { useToast } from './context/ToastContext';

/* Route-level code splitting keeps the first paint small on mobile. */
const Home = lazy(() => import('./pages/Home'));
const About = lazy(() => import('./pages/About'));
const Menu = lazy(() => import('./pages/Menu'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const SnackBox = lazy(() => import('./pages/SnackBox'));
const Customize = lazy(() => import('./pages/Customize'));
const Nutrition = lazy(() => import('./pages/Nutrition'));
const TrackOrder = lazy(() => import('./pages/TrackOrder'));
const Faq = lazy(() => import('./pages/Faq'));
const Contact = lazy(() => import('./pages/Contact'));
const Cart = lazy(() => import('./pages/Cart'));
const Checkout = lazy(() => import('./pages/Checkout'));
const OrderSuccess = lazy(() => import('./pages/OrderSuccess'));

const Login = lazy(() => import('./pages/auth/Login'));
const Register = lazy(() => import('./pages/auth/Register'));
const ForgotPassword = lazy(() => import('./pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/auth/ResetPassword'));
const VerifyEmail = lazy(() => import('./pages/auth/VerifyEmail'));

const Account = lazy(() => import('./pages/account/Account'));
const Profile = lazy(() => import('./pages/account/Profile'));
const Orders = lazy(() => import('./pages/account/Orders'));
const Addresses = lazy(() => import('./pages/account/Addresses'));
const Favourites = lazy(() => import('./pages/account/Favourites'));
const Reviews = lazy(() => import('./pages/account/Reviews'));
const Rewards = lazy(() => import('./pages/account/Rewards'));
const Notifications = lazy(() => import('./pages/account/Notifications'));
const Security = lazy(() => import('./pages/account/Security'));

const Terms = lazy(() => import('./pages/legal/Terms'));
const Privacy = lazy(() => import('./pages/legal/Privacy'));
const RefundPolicy = lazy(() => import('./pages/legal/RefundPolicy'));
const ShippingPolicy = lazy(() => import('./pages/legal/ShippingPolicy'));
const NotFound = lazy(() => import('./pages/NotFound'));

export default function App() {
  const { isAuthenticated, pushNotification } = useAuth();
  const toast = useToast();

  // Live push from the kitchen: order status changes and new notifications.
  useSocketEvent('notification:new', (n) => {
    if (!isAuthenticated) return;
    pushNotification(n);
    toast.info(n.title);
  });

  useSocketEvent('order:status', (payload) => {
    if (payload?.status) toast.success('Order ' + payload.orderNumber + ' is now ' + payload.status);
  });

  useEffect(() => {
    document.documentElement.lang = 'en';
  }, []);

  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="menu" element={<Menu />} />
        <Route path="menu/:slug" element={<ProductDetail />} />
        <Route path="snack-box" element={<SnackBox />} />
        <Route path="customize" element={<Customize />} />
        <Route path="customize/:slug" element={<Customize />} />
        <Route path="nutrition" element={<Nutrition />} />
        <Route path="track-order" element={<TrackOrder />} />
        <Route path="faq" element={<Faq />} />
        <Route path="contact" element={<Contact />} />
        <Route path="cart" element={<Cart />} />

        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
        <Route path="reset-password" element={<ResetPassword />} />
        <Route path="verify-email" element={<VerifyEmail />} />

        <Route
          path="checkout"
          element={
            <ProtectedRoute>
              <Checkout />
            </ProtectedRoute>
          }
        />
        <Route
          path="order-success/:orderNumber"
          element={
            <ProtectedRoute>
              <OrderSuccess />
            </ProtectedRoute>
          }
        />

        <Route
          path="account"
          element={
            <ProtectedRoute>
              <Account />
            </ProtectedRoute>
          }
        >
          <Route index element={<Profile />} />
          <Route path="orders" element={<Orders />} />
          <Route path="addresses" element={<Addresses />} />
          <Route path="favourites" element={<Favourites />} />
          <Route path="reviews" element={<Reviews />} />
          <Route path="rewards" element={<Rewards />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="security" element={<Security />} />
        </Route>

        <Route path="terms" element={<Terms />} />
        <Route path="privacy" element={<Privacy />} />
        <Route path="refund-policy" element={<RefundPolicy />} />
        <Route path="shipping-policy" element={<ShippingPolicy />} />

        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

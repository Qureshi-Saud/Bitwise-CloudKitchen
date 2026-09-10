import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar, Avatar, Badge, Box, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon,
  ListItemText, Menu, MenuItem, Toolbar, Tooltip, Typography, useMediaQuery, useTheme, Chip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/SpaceDashboard';
import RestaurantIcon from '@mui/icons-material/RestaurantMenu';
import CategoryIcon from '@mui/icons-material/Category';
import ReceiptIcon from '@mui/icons-material/ReceiptLong';
import PeopleIcon from '@mui/icons-material/People';
import ScheduleIcon from '@mui/icons-material/Schedule';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import StarIcon from '@mui/icons-material/StarRate';
import MailIcon from '@mui/icons-material/MarkEmailUnread';
import InventoryIcon from '@mui/icons-material/Inventory2';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useAdminAuth } from '../context/AdminAuthContext';
import { useSnackbar } from '../context/SnackbarContext';
import { getSocket } from '../lib/socket';
import { initials } from '../lib/utils';
import useBrand from '../hooks/useBrand';
import BrandMark from '../components/BrandMark';
import { tokens } from '../theme';

const WIDTH = 264;

const NAV = [
  { to: '/', label: 'Dashboard', icon: DashboardIcon, end: true },
  { to: '/orders', label: 'Orders', icon: ReceiptIcon },
  { to: '/products', label: 'Products', icon: RestaurantIcon },
  { to: '/categories', label: 'Categories', icon: CategoryIcon },
  { to: '/snack-box', label: 'Snack Box', icon: InventoryIcon },
  { to: '/customers', label: 'Customers', icon: PeopleIcon },
  { to: '/delivery-slots', label: 'Delivery Slots', icon: ScheduleIcon },
  { to: '/coupons', label: 'Coupons', icon: LocalOfferIcon },
  { to: '/reviews', label: 'Reviews', icon: StarIcon },
  { to: '/contact-requests', label: 'Contact Requests', icon: MailIcon },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function AdminLayout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('lg'));
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState(null);
  const [liveCount, setLiveCount] = useState(0);
  const { user, logout } = useAdminAuth();
  const snackbar = useSnackbar();
  const location = useLocation();
  const navigate = useNavigate();
  const brand = useBrand();

  useEffect(() => setOpen(false), [location.pathname]);

  // Live kitchen feed: new orders and payments push straight into the panel.
  useEffect(() => {
    const socket = getSocket();
    const onNew = (payload) => {
      setLiveCount((c) => c + 1);
      snackbar.info('New order ' + payload.orderNumber + ' received');
    };
    const onPaid = (payload) => snackbar.success('Payment received for ' + payload.orderNumber);

    socket.on('order:new', onNew);
    socket.on('order:paid', onPaid);
    return () => {
      socket.off('order:new', onNew);
      socket.off('order:paid', onPaid);
    };
  }, [snackbar]);

  const drawer = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Toolbar sx={{ gap: 1.5, px: 2.5 }}>
        <BrandMark size={36} />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" fontWeight={800} noWrap>
            {brand.brandName}
          </Typography>
          <Typography variant="caption" color="primary.main" fontWeight={600}>
            Admin Panel
          </Typography>
        </Box>
      </Toolbar>
      <Divider />

      <List sx={{ px: 1.5, py: 2, flex: 1, overflowY: 'auto' }}>
        {NAV.map((item) => (
          <ListItemButton
            key={item.to}
            component={NavLink}
            to={item.to}
            end={item.end}
            sx={{
              borderRadius: 2,
              mb: 0.5,
              '&:hover': { bgcolor: 'hover' },
              '&.Mui-focusVisible': { outline: '2px solid', outlineColor: 'primary.main', outlineOffset: -2 },
              '&.active': {
                bgcolor: 'primary.main',
                color: 'primary.contrastText',
                '& .MuiListItemIcon-root': { color: 'inherit' },
                '&:hover': { bgcolor: 'primary.dark' },
              },
            }}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>
              <item.icon fontSize="small" />
            </ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontSize: 14, fontWeight: 600 }} primary={item.label} />
          </ListItemButton>
        ))}
      </List>

      <Divider />
      <Box sx={{ p: 2 }}>
        <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: 'surface' }}>
          <Typography variant="overline" color="success.main" sx={{ display: 'block', fontSize: 10 }}>
            On-demand ordering only
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25, lineHeight: 1.5 }}>
            No subscription or tiffin plans exist in this system by design.
          </Typography>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar
        position="fixed"
        color="inherit"
        elevation={0}
        sx={{
          width: { lg: `calc(100% - ${WIDTH}px)` },
          ml: { lg: `${WIDTH}px` },
          borderBottom: '1px solid',
          borderColor: 'divider',
          bgcolor: tokens.appBar,
          backdropFilter: 'blur(12px)',
        }}
      >
        <Toolbar sx={{ gap: 1 }}>
          <IconButton onClick={() => setOpen(true)} edge="start" sx={{ display: { lg: 'none' } }} aria-label="Open menu">
            <MenuIcon />
          </IconButton>

          <Typography variant="h6" sx={{ flex: 1, fontSize: 17 }}>
            {NAV.find((n) => (n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)))?.label || 'Admin'}
          </Typography>

          <Tooltip title={liveCount ? liveCount + ' new order(s) since you last looked' : 'No new orders'}>
            <IconButton onClick={() => { setLiveCount(0); navigate('/orders'); }} aria-label="New orders">
              <Badge badgeContent={liveCount} color="secondary">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          <IconButton onClick={(e) => setAnchor(e.currentTarget)} aria-label="Account menu">
            <Avatar sx={{ width: 34, height: 34, bgcolor: 'primary.main', fontSize: 13, fontWeight: 700 }}>
              {initials(user?.name)}
            </Avatar>
          </IconButton>

          <Menu anchorEl={anchor} open={Boolean(anchor)} onClose={() => setAnchor(null)}>
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle2" fontWeight={700}>{user?.name}</Typography>
              <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
              <Chip size="small" label={user?.role} color="primary" sx={{ mt: 1, display: 'block', width: 'fit-content' }} />
            </Box>
            <Divider />
            <MenuItem onClick={logout} sx={{ color: 'error.main', gap: 1.5 }}>
              <LogoutIcon fontSize="small" /> Sign out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Box component="nav" sx={{ width: { lg: WIDTH }, flexShrink: { lg: 0 } }}>
        <Drawer
          variant={isDesktop ? 'permanent' : 'temporary'}
          open={isDesktop || open}
          onClose={() => setOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            '& .MuiDrawer-paper': {
              width: WIDTH,
              boxSizing: 'border-box',
              borderRight: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flex: 1, minWidth: 0, p: { xs: 2, sm: 3 } }}>
        {/* Clears the fixed AppBar at whatever height the current breakpoint gives it. */}
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}

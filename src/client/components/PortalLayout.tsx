import { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { Box, Flex, IconButton, useDisclosure, Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, DrawerHeader, DrawerBody, VStack, Menu, MenuButton, MenuList, MenuItem, Button as ChakraButton, Container } from '@chakra-ui/react';
import { Menu as MenuIcon, Home, ShoppingBag, ShoppingCart, UserCircle, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PortalLayoutProps {
  children: ReactNode;
}

export default function PortalLayout({ children }: PortalLayoutProps) {
  const { user, clearAuth } = useAuthStore();
  const { getTotalItems, _hasHydrated } = useCartStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  // Safely get cart count, default to 0 if not hydrated yet
  const cartItemCount = _hasHydrated ? getTotalItems() : 0;

  const navItems = [
    { path: '/portal', icon: Home, label: 'Home' },
    { path: '/portal/shop', icon: ShoppingBag, label: 'Shop' },
    { path: '/portal/cart', icon: ShoppingCart, label: 'Cart', badge: cartItemCount },
  ];

  return (
    <Box minH="100vh" bg="gray.50">
      {/* Header */}
      <Box bg="white" borderBottom="1px" borderColor="gray.200" position="sticky" top={0} zIndex={10}>
        <Container maxW="7xl">
          <Flex px={4} h={16} align="center" justify="space-between">
          <Flex align="center" gap={4}>
            <IconButton
              aria-label="Open menu"
              icon={<MenuIcon />}
              variant="ghost"
              display={{ base: 'flex', md: 'none' }}
              onClick={onOpen}
            />
            <Link to="/portal" className="text-xl font-bold">
              Company Logo
            </Link>
          </Flex>

          {/* Desktop Navigation */}
          <Flex align="center" gap={4} display={{ base: 'none', md: 'flex' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || 
                (item.path !== '/portal' && location.pathname.startsWith(item.path));

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={cn(
                    'px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ml-1 bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </Flex>

          {/* Right side: My Account dropdown and Cart */}
          <Flex align="center" gap={4}>
            <Link
              to="/portal/cart"
              className="relative p-2 rounded-md hover:bg-gray-100 transition-colors"
            >
              <ShoppingCart className="h-5 w-5" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartItemCount}
                </span>
              )}
            </Link>

            <Menu>
              <MenuButton
                as={ChakraButton}
                variant="ghost"
                size="sm"
              >
                <Flex align="center" gap={2}>
                  <UserCircle className="h-5 w-5" />
                  <Box as="span" display={{ base: 'none', md: 'inline' }}>
                    My Profile
                  </Box>
                </Flex>
              </MenuButton>
              <MenuList>
                <MenuItem
                  onClick={() => {
                    navigate('/portal/my-account');
                  }}
                >
                  My Account
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <Flex align="center" gap={2}>
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Flex>
                </MenuItem>
              </MenuList>
            </Menu>
          </Flex>
        </Flex>
        </Container>
      </Box>

      {/* Mobile Drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Menu</DrawerHeader>
          <DrawerBody>
            <VStack spacing={2} align="stretch">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.path || 
                  (item.path !== '/portal' && location.pathname.startsWith(item.path));

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2 rounded-md transition-colors',
                      isActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{item.label}</span>
                    {item.badge !== undefined && item.badge > 0 && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Main Content */}
      <Container maxW="7xl" py={6}>
        {children}
      </Container>
    </Box>
  );
}

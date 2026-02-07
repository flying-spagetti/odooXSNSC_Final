import { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Box, Flex, IconButton, useDisclosure, Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, DrawerHeader, DrawerBody, VStack } from '@chakra-ui/react';
import { Menu, Home, FileText, CreditCard, Package, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, clearAuth } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard', roles: ['ADMIN', 'INTERNAL', 'PORTAL'] },
    { path: '/products', icon: Package, label: 'Products', roles: ['ADMIN'] },
    { path: '/subscriptions', icon: FileText, label: 'Subscriptions', roles: ['ADMIN', 'INTERNAL', 'PORTAL'] },
    { path: '/invoices', icon: CreditCard, label: 'Invoices', roles: ['ADMIN', 'INTERNAL', 'PORTAL'] },
  ];

  const visibleNavItems = navItems.filter(item => 
    !item.roles || item.roles.includes(user?.role || '')
  );

  const NavLinks = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {visibleNavItems.map((item) => {
        const Icon = item.icon;
        const isActive = location.pathname === item.path || 
          (item.path !== '/' && location.pathname.startsWith(item.path));
        
        return (
          <Link
            key={item.path}
            to={item.path}
            onClick={mobile ? onClose : undefined}
            className={cn(
              'flex items-center gap-3 px-4 py-2 rounded-md transition-colors',
              isActive
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            )}
          >
            <Icon className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </>
  );

  return (
    <Box className="min-h-screen bg-gray-50">
      {/* Top Navigation */}
      <Box className="bg-white border-b sticky top-0 z-10">
        <Flex className="container mx-auto px-4 h-16" align="center" justify="space-between">
          <Flex align="center" gap={4}>
            <IconButton
              aria-label="Open menu"
              icon={<Menu />}
              variant="ghost"
              display={{ base: 'flex', md: 'none' }}
              onClick={onOpen}
            />
            <Link to="/" className="text-xl font-bold">
              SubsManager
            </Link>
          </Flex>

          <Flex align="center" gap={4}>
            <Box className="text-sm hidden md:block">
              <span className="text-muted-foreground">Signed in as </span>
              <span className="font-medium">{user?.email}</span>
              <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-1 rounded">
                {user?.role}
              </span>
            </Box>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </Flex>
        </Flex>
      </Box>

      <Flex>
        {/* Desktop Sidebar */}
        <Box
          className="bg-white border-r w-64 min-h-[calc(100vh-4rem)] sticky top-16"
          display={{ base: 'none', md: 'block' }}
        >
          <nav className="p-4 space-y-2">
            <NavLinks />
          </nav>
        </Box>

        {/* Mobile Drawer */}
        <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>SubsManager</DrawerHeader>
            <DrawerBody>
              <VStack spacing={2} align="stretch">
                <NavLinks mobile />
              </VStack>
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        {/* Main Content */}
        <Box className="flex-1 p-6 container mx-auto max-w-7xl">
          {children}
        </Box>
      </Flex>
    </Box>
  );
}

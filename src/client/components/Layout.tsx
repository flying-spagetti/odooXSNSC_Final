import { ReactNode } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/ui/button';
import { Box, Flex, IconButton, useDisclosure, Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, DrawerHeader, DrawerBody, VStack } from '@chakra-ui/react';
import { Menu, FileText, Package, LogOut, BarChart3, Users, Settings, UserCircle, Contact } from 'lucide-react';
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
    { path: '/subscriptions', icon: FileText, label: 'Subscriptions', roles: ['ADMIN', 'INTERNAL', 'PORTAL'], group: 'main' },
    { path: '/products', icon: Package, label: 'Products', roles: ['ADMIN'], group: 'main' },
    { path: '/reporting', icon: BarChart3, label: 'Reporting', roles: ['ADMIN', 'INTERNAL'], group: 'main' },
    { path: '/users', icon: Users, label: 'Users', roles: ['ADMIN', 'INTERNAL'], group: 'main' },
    { path: '/contacts', icon: Contact, label: 'Contacts', roles: ['ADMIN', 'INTERNAL'], group: 'main' },
    { path: '/configuration', icon: Settings, label: 'Configuration', roles: ['ADMIN'], group: 'settings' },
    { path: '/my-profile', icon: UserCircle, label: 'My Profile', roles: ['ADMIN', 'INTERNAL', 'PORTAL'], group: 'settings' },
  ];

  const visibleNavItems = navItems.filter(item =>
    !item.roles || item.roles.includes(user?.role || '')
  );

  return (
    <Box className="min-h-screen bg-gray-50">
      {/* Top bar: logo + user info */}
      <Box className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <Flex className="container mx-auto px-4 h-16" align="center" justify="space-between">
          <Flex align="center" gap={4}>
            <IconButton
              aria-label="Open menu"
              icon={<Menu />}
              variant="ghost"
              display={{ base: 'flex', md: 'none' }}
              onClick={onOpen}
              size="sm"
            />
            <Link 
              to={user?.role === 'PORTAL' ? '/portal' : '/dashboard'} 
              className="text-xl font-bold text-foreground hover:text-primary transition-colors"
            >
              SubsManager
            </Link>
          </Flex>

          <Flex align="center" gap={3}>
            <Box className="text-sm hidden md:flex items-center gap-2">
              <span className="text-muted-foreground">Signed in as</span>
              <span className="font-medium text-foreground">{user?.email}</span>
              <span className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full font-medium">
                {user?.role}
              </span>
            </Box>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </Flex>
        </Flex>
      </Box>

      {/* Horizontal navigation tabs — professional design */}
      <Box className="bg-white border-b hidden md:block shadow-sm">
        <nav className="container mx-auto px-4">
          <Flex gap={1} className="py-3" align="center">
            {visibleNavItems
              .filter(item => item.group === 'main')
              .map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path));

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center gap-2',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-gray-100 hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            
            {/* Separator */}
            {visibleNavItems.filter(item => item.group === 'settings').length > 0 && (
              <Box className="h-6 w-px bg-gray-300 mx-2" />
            )}
            
            {/* Settings group */}
            {visibleNavItems
              .filter(item => item.group === 'settings')
              .map((item) => {
                const Icon = item.icon;
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path));

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={cn(
                      'px-4 py-2.5 rounded-md text-sm font-medium transition-all duration-200 whitespace-nowrap flex items-center gap-2',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:bg-gray-100 hover:text-foreground'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
          </Flex>
        </nav>
      </Box>

      {/* Mobile Drawer */}
      <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader className="border-b">SubsManager</DrawerHeader>
          <DrawerBody className="pt-4">
            <VStack spacing={1} align="stretch">
              {/* Main navigation items */}
              {visibleNavItems
                .filter(item => item.group === 'main')
                .map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    location.pathname === item.path ||
                    (item.path !== '/' && location.pathname.startsWith(item.path));

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-md transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              
              {/* Separator */}
              {visibleNavItems.filter(item => item.group === 'settings').length > 0 && (
                <Box className="h-px bg-gray-200 my-2" />
              )}
              
              {/* Settings items */}
              {visibleNavItems
                .filter(item => item.group === 'settings')
                .map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    location.pathname === item.path ||
                    (item.path !== '/' && location.pathname.startsWith(item.path));

                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={cn(
                        'flex items-center gap-3 px-4 py-3 rounded-md transition-colors',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>

      {/* Main Content — full width, no sidebar */}
      <Box className="container mx-auto max-w-7xl p-6">
        {children}
      </Box>
    </Box>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast, Box } from '@chakra-ui/react';
import { CheckCircle, AlertCircle } from 'lucide-react';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(true);
  const [isValidToken, setIsValidToken] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      toast({
        title: 'Invalid link',
        description: 'No reset token provided',
        status: 'error',
        duration: 5000,
      });
      setIsVerifying(false);
      return;
    }

    // Verify token on mount
    verifyToken();
  }, [token]);

  const verifyToken = async () => {
    if (!token) return;

    try {
      const { data } = await authApi.verifyResetToken(token);
      setIsValidToken(true);
      setUserEmail(data.email);
    } catch (error: any) {
      toast({
        title: 'Invalid or expired link',
        description: error.response?.data?.message || 'This reset link is no longer valid',
        status: 'error',
        duration: 5000,
      });
      setIsValidToken(false);
    } finally {
      setIsVerifying(false);
    }
  };

  const validatePassword = (pwd: string) => {
    const errors = [];
    if (pwd.length < 8) errors.push('at least 8 characters');
    if (!/[A-Z]/.test(pwd)) errors.push('one uppercase letter');
    if (!/[a-z]/.test(pwd)) errors.push('one lowercase letter');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) errors.push('one special character');
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate password
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      toast({
        title: 'Password requirements not met',
        description: `Password must contain ${passwordErrors.join(', ')}`,
        status: 'error',
        duration: 5000,
      });
      return;
    }

    // Check password match
    if (password !== confirmPassword) {
      toast({
        title: 'Passwords do not match',
        description: 'Please make sure both passwords are the same',
        status: 'error',
        duration: 5000,
      });
      return;
    }

    setIsLoading(true);

    try {
      const { data } = await authApi.resetPassword(token!, password);
      setIsSuccess(true);
      toast({
        title: 'Password reset successful',
        description: data.message,
        status: 'success',
        duration: 5000,
      });
      
      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error: any) {
      toast({
        title: 'Reset failed',
        description: error.response?.data?.message || 'Failed to reset password',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <Box className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Verifying reset link...</p>
            </div>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (!isValidToken) {
    return (
      <Box className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-16 w-16 text-red-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Invalid Reset Link</CardTitle>
            <CardDescription className="text-center">
              This password reset link is invalid or has expired
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p className="mb-2">Possible reasons:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>The link has expired (links are valid for 1 hour)</li>
                  <li>The link has already been used</li>
                  <li>The link was not copied correctly</li>
                </ul>
              </div>

              <Link to="/forgot-password">
                <Button className="w-full">
                  Request New Reset Link
                </Button>
              </Link>

              <div className="text-center">
                <Link to="/login" className="text-sm text-primary hover:underline">
                  Back to Login
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (isSuccess) {
    return (
      <Box className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Password Reset!</CardTitle>
            <CardDescription className="text-center">
              Your password has been successfully reset
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground text-center">
                You can now sign in with your new password
              </p>
              <Link to="/login">
                <Button className="w-full">
                  Go to Login
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Box className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold text-center">Set New Password</CardTitle>
          <CardDescription className="text-center">
            Resetting password for <strong>{userEmail}</strong>
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
              />
              <p className="text-xs text-muted-foreground">
                Must be at least 8 characters with uppercase, lowercase, and special character
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Resetting password...' : 'Reset Password'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-primary hover:underline">
              Back to Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </Box>
  );
}

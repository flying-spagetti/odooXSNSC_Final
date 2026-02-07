import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast, Box } from '@chakra-ui/react';
import { ArrowLeft, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Request password reset
      const { data } = await authApi.forgotPassword(email);
      
      setIsSubmitted(true);
      
      // In development, show the token (remove in production)
      if (data.token) {
        setResetToken(data.token);
      }
      
      toast({
        title: 'Reset link sent',
        description: data.message,
        status: 'success',
        duration: 5000,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to process request',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <Box className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="space-y-1">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-500" />
            </div>
            <CardTitle className="text-2xl font-bold text-center">Check Your Email</CardTitle>
            <CardDescription className="text-center">
              If an account exists with {email}, we've sent password reset instructions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {resetToken && (
              <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm font-medium text-yellow-800 mb-2">
                  Development Mode - Reset Token:
                </p>
                <code className="text-xs break-all bg-white p-2 rounded block">
                  {resetToken}
                </code>
                <p className="text-xs text-yellow-700 mt-2">
                  Use this token at /reset-password?token={resetToken}
                </p>
              </div>
            )}

            <div className="space-y-4">
              <div className="text-sm text-muted-foreground space-y-2">
                <p>• Check your inbox for an email from SubsManager</p>
                <p>• Click the reset link in the email</p>
                <p>• The link will expire in 1 hour</p>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-3">
                  Didn't receive the email?
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setIsSubmitted(false);
                    setResetToken('');
                  }}
                >
                  Try again
                </Button>
              </div>

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

  return (
    <Box className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Link to="/login">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Login
              </Button>
            </Link>
          </div>
          <CardTitle className="text-3xl font-bold text-center">Reset Password</CardTitle>
          <CardDescription className="text-center">
            Enter your email address and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <p className="text-xs text-muted-foreground">
                We'll send reset instructions if an account exists for this email
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Checking email...' : 'Send Reset Link'}
            </Button>
          </form>

          <div className="mt-6 text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Remember your password?{' '}
              <Link to="/login" className="text-primary hover:underline font-medium">
                Sign in
              </Link>
            </p>
            <p className="text-sm text-muted-foreground">
              Don't have an account?{' '}
              <Link to="/signup" className="text-primary hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </Box>
  );
}

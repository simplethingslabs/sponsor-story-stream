import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useValidateInvitation } from '@/hooks/useApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const [showPassword, setShowPassword] = useState(false);
  const { register: registerUser, registerWithInvitation, isLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const invitationToken = searchParams.get('token');

  const {
    data: invitation,
    isLoading: isValidatingInvitation,
    isError: invitationInvalid,
  } = useValidateInvitation(invitationToken);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    if (invitation?.email) {
      setValue('email', invitation.email);
    }
  }, [invitation, setValue]);

  const onSubmit = async (data: RegisterFormData) => {
    if (invitationToken) {
      const result = await registerWithInvitation(invitationToken, {
        password: data.password,
        full_name: data.full_name,
        phone: data.phone,
      });

      if (result.success) {
        toast({
          title: 'Welcome!',
          description: 'Your sponsor account is ready.',
        });
        navigate('/sponsor');
      } else {
        toast({
          variant: 'destructive',
          title: 'Registration failed',
          description: result.error || 'This invitation link may be invalid or expired.',
        });
      }
      return;
    }

    const result = await registerUser({
      email: data.email,
      password: data.password,
      full_name: data.full_name,
      phone: data.phone,
    });

    if (result.success) {
      toast({
        title: 'Registration Successful!',
        description: 'Your account has been created. Please wait for approval.',
      });
      navigate('/registration-pending');
    } else {
      toast({
        variant: 'destructive',
        title: 'Registration failed',
        description: result.error || 'Please try again.',
      });
    }
  };

  if (invitationToken && isValidatingInvitation) {
    return (
      <Card className="w-full max-w-md shadow-warm animate-fade-in">
        <CardContent className="py-12 text-center text-muted-foreground">
          Validating your invitation...
        </CardContent>
      </Card>
    );
  }

  if (invitationToken && invitationInvalid) {
    return (
      <Card className="w-full max-w-md shadow-warm animate-fade-in">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-display">Invitation Invalid</CardTitle>
          <CardDescription>
            This invitation link is invalid or has expired. Please ask for a new invitation, or
            register below without one.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Link to="/register" className="w-full">
            <Button variant="outline" className="w-full">
              Register Without Invitation
            </Button>
          </Link>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md shadow-warm animate-fade-in">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-display">
          {invitationToken ? 'Accept Your Invitation' : 'Become a Sponsor'}
        </CardTitle>
        <CardDescription>
          {invitationToken
            ? `You've been invited by ${invitation?.inviter_name || 'our team'} — set a password to finish creating your account.`
            : "Join our community and make a difference in a child's life"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Full Name</Label>
            <Input
              id="full_name"
              type="text"
              placeholder="Your full name"
              {...register('full_name')}
              className={errors.full_name ? 'border-destructive' : ''}
            />
            {errors.full_name && (
              <p className="text-sm text-destructive">{errors.full_name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              readOnly={!!invitationToken}
              {...register('email')}
              className={errors.email ? 'border-destructive' : ''}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone (Optional)</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="+91 98765 43210"
              {...register('phone')}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                {...register('password')}
                className={errors.password ? 'border-destructive pr-10' : 'pr-10'}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-destructive">{errors.password.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              {...register('confirmPassword')}
              className={errors.confirmPassword ? 'border-destructive' : ''}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-destructive">{errors.confirmPassword.message}</p>
            )}
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <span className="flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Creating account...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <UserPlus className="h-4 w-4" />
                Create Account
              </span>
            )}
          </Button>
          
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}

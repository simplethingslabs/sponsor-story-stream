import { Link } from 'react-router-dom';
import { Clock, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export default function RegistrationPending() {
  return (
    <Card className="w-full max-w-md shadow-warm animate-fade-in">
      <CardHeader className="space-y-1 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-accent/20">
          <Clock className="h-8 w-8 text-accent-foreground" />
        </div>
        <CardTitle className="text-2xl font-display">Registration Pending</CardTitle>
        <CardDescription>
          Thank you for your interest in becoming a sponsor!
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 text-center text-muted-foreground">
        <p>
          Your registration is being reviewed by our team. We'll send you an email
          once your account has been approved.
        </p>
        <p className="text-sm">
          This usually takes 1-2 business days. If you have any questions, please
          contact the school administration.
        </p>
      </CardContent>
      <CardFooter>
        <Link to="/login" className="w-full">
          <Button variant="outline" className="w-full">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Login
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}

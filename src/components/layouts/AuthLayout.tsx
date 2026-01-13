import { Outlet } from 'react-router-dom';
import { Heart } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      {/* Decorative elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-accent/5 blur-3xl" />
      </div>

      <div className="flex min-h-screen flex-col items-center justify-center p-4">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-2 text-primary">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
            <Heart className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="text-2xl font-display font-bold">SponsorConnect</span>
        </div>

        {/* Auth form outlet */}
        <Outlet />

        {/* Footer */}
        <p className="mt-8 text-center text-sm text-muted-foreground">
          Connecting sponsors with children, one story at a time.
        </p>
      </div>
    </div>
  );
}

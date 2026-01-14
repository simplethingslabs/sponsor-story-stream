import { Link } from 'react-router-dom';
import { Heart, Users, BookOpen, Share2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
export default function Index() {
  return <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl" />
        </div>

        <div className="container">
          {/* Navigation */}
          <nav className="flex items-center justify-between py-6">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                <Heart className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-primary">AVPSponsorConnect</span>
            </div>
            <div className="flex items-center gap-4">
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/register">
                <Button>Become a Sponsor</Button>
              </Link>
            </div>
          </nav>

          {/* Hero Content */}
          <div className="py-20 md:py-32 text-center max-w-3xl mx-auto text-[#ed5407]">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
              Transform a Child's Future{' '}
              <span className="text-gradient-warm">One Quarter at a Time</span>
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground">
              Connect directly with the children you sponsor. See their growth, 
              celebrate their achievements, and be part of their journey through 
              regular progress reports and updates.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="px-8 text-lg">
                  Start Sponsoring
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline" className="px-8 text-lg">
                  View Your Dashboard
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section className="py-20 bg-card">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">
              How SponsorConnect Works
            </h2>
            <p className="mt-2 text-muted-foreground">
              Stay connected with the child you're supporting
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-xl bg-background shadow-soft">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
                <Users className="h-7 w-7 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Quarterly Reports</h3>
              <p className="text-muted-foreground">
                Receive detailed progress updates about your sponsored child's 
                growth, activities, and achievements every quarter.
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-background shadow-soft">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent/20">
                <BookOpen className="h-7 w-7 text-accent-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Rich Media</h3>
              <p className="text-muted-foreground">
                View photos, videos, and audio recordings of your child's 
                classroom activities, artwork, and special moments.
              </p>
            </div>

            <div className="text-center p-6 rounded-xl bg-background shadow-soft">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
                <Share2 className="h-7 w-7 text-secondary-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Share the Joy</h3>
              <p className="text-muted-foreground">
                Invite friends and family to join our sponsorship program 
                and help more children receive quality education.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <div className="rounded-2xl gradient-warm p-12 text-center text-primary-foreground">
            <h2 className="text-3xl font-bold mb-4">
              Ready to Make a Difference?
            </h2>
            <p className="text-lg opacity-90 mb-8 max-w-2xl mx-auto">
              Join hundreds of sponsors who are changing lives. 
              Every child deserves a chance to learn and grow.
            </p>
            <Link to="/register">
              <Button size="lg" variant="secondary" className="px-8 text-lg">
                Become a Sponsor Today
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Heart className="h-4 w-4" />
            <span className="text-sm">
              SponsorConnect © 2024. Made with love for underprivileged children.
            </span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-primary">Privacy Policy</a>
            <a href="#" className="hover:text-primary">Terms of Service</a>
            <a href="#" className="hover:text-primary">Contact</a>
          </div>
        </div>
      </footer>
    </div>;
}
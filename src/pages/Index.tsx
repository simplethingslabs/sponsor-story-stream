import { Link } from 'react-router-dom';
import { Heart, Users, BookOpen, Share2, ArrowRight, Star, Shield, Award, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useEffect, useState } from 'react';

// Animated counter component
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const duration = 2000;
    const steps = 60;
    const increment = target / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [target]);

  return (
    <span className="text-4xl md:text-5xl font-bold text-primary">
      {count}{suffix}
    </span>
  );
}

// Testimonials data
const testimonials = [
  {
    quote: "Sponsoring Priya has been one of the most rewarding experiences of my life. Seeing her quarterly progress reports and watching her grow fills my heart with joy.",
    name: "Meera Sharma",
    location: "Mumbai",
    since: 2021,
    initials: "MS"
  },
  {
    quote: "The transparency and regular updates from AVP give me confidence that my contribution is truly making a difference. The children's artwork and photos bring smiles to our entire family.",
    name: "Rajesh Patel",
    location: "Bangalore",
    since: 2020,
    initials: "RP"
  },
  {
    quote: "As an NRI, I was looking for a trustworthy organization to support education back home. AVP's detailed reports and personal connection with sponsored children exceeded my expectations.",
    name: "Anita Krishnan",
    location: "USA",
    since: 2019,
    initials: "AK"
  }
];

// FAQ data
const faqs = [
  {
    question: "How does child sponsorship work?",
    answer: "When you sponsor a child, your monthly contribution goes directly towards their education, including school fees, uniforms, books, and nutritious meals. You'll receive quarterly progress reports with photos, artwork, and updates about your sponsored child's development."
  },
  {
    question: "How much does it cost to sponsor a child?",
    answer: "Sponsorship starts at ₹1,500 per month (approximately $18 USD). This covers a child's complete educational needs including tuition, materials, uniforms, and one nutritious meal per school day."
  },
  {
    question: "How will I receive updates about my sponsored child?",
    answer: "You'll receive detailed quarterly progress reports through our sponsor portal. These include academic progress, attendance records, photos, artwork samples, and personal notes from teachers. You can also attend virtual events and receive our monthly newsletter."
  },
  {
    question: "Is my donation tax-deductible?",
    answer: "Yes! AVP is registered under Section 80G and 12A of the Income Tax Act. You'll receive an 80G tax receipt for all your donations, which can be claimed as a deduction while filing your income tax returns."
  },
  {
    question: "Can I visit my sponsored child?",
    answer: "Absolutely! We encourage sponsors to visit our schools and meet their sponsored children. We organize annual sponsor meet events and can also arrange individual visits with prior coordination."
  }
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
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
          <div className="py-20 md:py-32 text-center max-w-3xl mx-auto">
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

      {/* Impact Numbers Section */}
      <section className="py-16 bg-primary/5">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <AnimatedCounter target={210} suffix="+" />
              <p className="text-lg text-muted-foreground font-medium">Children Supported</p>
            </div>
            <div className="space-y-2">
              <AnimatedCounter target={50} suffix="+" />
              <p className="text-lg text-muted-foreground font-medium">Sponsors Across India</p>
            </div>
            <div className="space-y-2">
              <AnimatedCounter target={4} suffix="+" />
              <p className="text-lg text-muted-foreground font-medium">Years of Impact</p>
            </div>
          </div>
        </div>
      </section>

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

      {/* Testimonials Section */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">
              What Our Sponsors Say
            </h2>
            <p className="mt-2 text-muted-foreground">
              Hear from sponsors who are making a difference
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="relative overflow-hidden">
                <CardContent className="pt-6">
                  <div className="absolute top-4 right-4">
                    <Star className="h-5 w-5 text-accent fill-accent" />
                  </div>
                  <blockquote className="text-muted-foreground mb-6">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground font-semibold">
                      {testimonial.initials}
                    </div>
                    <div>
                      <p className="font-semibold">{testimonial.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {testimonial.location} • Sponsor since {testimonial.since}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-card">
        <div className="container max-w-3xl">
          <div className="text-center mb-12">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <HelpCircle className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-3xl font-bold">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-muted-foreground">
              Everything you need to know about sponsoring a child
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="text-left">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </section>

      {/* Trust Badges Section */}
      <section className="py-12 bg-background">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-center gap-8">
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
                <Shield className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="font-semibold">80G Certified</p>
                <p className="text-sm text-muted-foreground">Tax-deductible donations</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-card">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-info/10">
                <Award className="h-6 w-6 text-info" />
              </div>
              <div>
                <p className="font-semibold">12A Registered</p>
                <p className="text-sm text-muted-foreground">Government recognized NGO</p>
              </div>
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
    </div>
  );
}

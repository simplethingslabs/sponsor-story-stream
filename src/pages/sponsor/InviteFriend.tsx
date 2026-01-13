import { useState } from 'react';
import { SponsorLayout } from '@/components/layouts/SponsorLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Heart, Copy, Mail, Share2, Facebook, Twitter } from 'lucide-react';

export default function InviteFriend() {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState(
    "I've been sponsoring a child's education through SponsorConnect, and it's been an incredibly rewarding experience. I thought you might be interested in making a difference too!"
  );

  const shareLink = 'https://sponsorconnect.org/become-a-sponsor?ref=friend';

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    toast({
      title: 'Link copied!',
      description: 'Share link has been copied to your clipboard.',
    });
  };

  const sendInvite = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: 'Invitation sent!',
      description: `An invitation has been sent to ${email}.`,
    });
    setEmail('');
  };

  return (
    <SponsorLayout>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Heart className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Invite a Friend</h1>
          <p className="mt-2 text-muted-foreground">
            Help more children get the education they deserve by inviting friends to become sponsors
          </p>
        </div>

        {/* Share Link */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Share2 className="h-5 w-5" />
              Share Your Link
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Input value={shareLink} readOnly className="bg-muted" />
              <Button onClick={copyLink} variant="outline">
                <Copy className="mr-2 h-4 w-4" />
                Copy
              </Button>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1">
                <Facebook className="mr-2 h-4 w-4" />
                Facebook
              </Button>
              <Button variant="outline" className="flex-1">
                <Twitter className="mr-2 h-4 w-4" />
                Twitter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Email Invite */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Send Email Invitation
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={sendInvite} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Friend's Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="friend@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="message">Personal Message</Label>
                <Textarea
                  id="message"
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
              </div>

              <Button type="submit" className="w-full">
                <Mail className="mr-2 h-4 w-4" />
                Send Invitation
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Impact Stats */}
        <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
          <CardContent className="py-6 text-center">
            <p className="text-lg font-medium">Your Impact</p>
            <p className="mt-2 text-muted-foreground">
              When friends become sponsors through your referral, together you help provide education, meals, and a brighter future for more children.
            </p>
          </CardContent>
        </Card>
      </div>
    </SponsorLayout>
  );
}

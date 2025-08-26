import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Shield, Brain, Heart } from 'lucide-react';
import { useEffect } from 'react';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp, user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    setIsLoading(true);
    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Sign In Failed",
        description: error.message
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You have been successfully signed in."
      });
      navigate('/');
    }
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const displayName = formData.get('displayName') as string;

    setIsLoading(true);
    const { error } = await signUp(email, password, displayName);
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Sign Up Failed",
        description: error.message
      });
    } else {
      toast({
        title: "Account Created!",
        description: "Please check your email to verify your account."
      });
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <div className="p-3 rounded-full bg-primary/10">
              <Shield className="h-8 w-8 text-primary" />
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold">ScreenWise</h1>
            <p className="text-muted-foreground">
              Your intelligent digital wellness companion
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <Card>
          <CardHeader>
            <CardTitle>Get Started</CardTitle>
            <CardDescription>
              Create an account or sign in to begin your wellness journey
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="space-y-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input
                      id="signin-email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input
                      id="signin-password"
                      name="password"
                      type="password"
                      placeholder="Your password"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing In...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-name">Display Name</Label>
                    <Input
                      id="signup-name"
                      name="displayName"
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      placeholder="Choose a password"
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating Account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Features Preview */}
        <div className="grid grid-cols-1 gap-4 mt-8">
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <Brain className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-medium">Future Messages</h3>
                <p className="text-sm text-muted-foreground">
                  Send messages to your future self
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center space-x-3">
              <Heart className="h-5 w-5 text-primary" />
              <div>
                <h3 className="font-medium">Adaptive Coaching</h3>
                <p className="text-sm text-muted-foreground">
                  AI that learns your habits and personality
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;
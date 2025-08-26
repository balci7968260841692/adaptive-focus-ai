import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Calendar, Clock, MessageSquare, Plus, Send } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

interface FutureMessage {
  id: string;
  title: string;
  message: string;
  delivery_date: string;
  is_delivered: boolean;
  created_at: string;
}

const FutureMessages = () => {
  const [messages, setMessages] = useState<FutureMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchMessages = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('future_messages')
      .select('*')
      .eq('user_id', user.id)
      .order('delivery_date', { ascending: true });
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load future messages"
      });
    } else {
      setMessages(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchMessages();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const formData = new FormData(e.target as HTMLFormElement);
    const title = formData.get('title') as string;
    const message = formData.get('message') as string;
    const deliveryDate = formData.get('deliveryDate') as string;

    setIsCreating(true);

    const { error } = await supabase
      .from('future_messages')
      .insert({
        user_id: user.id,
        title,
        message,
        delivery_date: new Date(deliveryDate).toISOString()
      });

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create future message"
      });
    } else {
      toast({
        title: "Message Created!",
        description: "Your future message has been scheduled"
      });
      setOpen(false);
      fetchMessages();
    }
    setIsCreating(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-16 bg-muted rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Future Messages</h2>
          <p className="text-muted-foreground">
            Messages you've written to your future self
          </p>
        </div>
        
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Message
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create Future Message</DialogTitle>
              <DialogDescription>
                Write a message to your future self. Choose when you'd like to receive it.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  placeholder="Remember to..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Dear future me..."
                  className="min-h-[100px]"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="deliveryDate">Delivery Date</Label>
                <Input
                  id="deliveryDate"
                  name="deliveryDate"
                  type="datetime-local"
                  min={new Date().toISOString().slice(0, 16)}
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? (
                    <>Creating...</>
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Schedule Message
                    </>
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {messages.length === 0 ? (
        <Card className="text-center p-8">
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-medium mb-2">No messages yet</h3>
          <p className="text-muted-foreground mb-4">
            Create your first future message to get started
          </p>
          <Button onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Message
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {messages.map((msg) => (
            <Card key={msg.id} className={msg.is_delivered ? 'opacity-60' : ''}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{msg.title}</CardTitle>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    {msg.is_delivered ? (
                      <span className="text-green-600">Delivered</span>
                    ) : (
                      <>
                        <Calendar className="h-4 w-4" />
                        <span>
                          {formatDistanceToNow(new Date(msg.delivery_date), { addSuffix: true })}
                        </span>
                      </>
                    )}
                  </div>
                </div>
                <CardDescription className="flex items-center space-x-2">
                  <Clock className="h-4 w-4" />
                  <span>
                    Scheduled for {format(new Date(msg.delivery_date), 'PPp')}
                  </span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{msg.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default FutureMessages;
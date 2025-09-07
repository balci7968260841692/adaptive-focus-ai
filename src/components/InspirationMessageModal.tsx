import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Sparkles, Heart, Clock } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface FutureMessage {
  id: string;
  title: string;
  message: string;
  delivery_date: string;
  is_delivered: boolean;
  created_at: string;
}

interface InspirationMessageModalProps {
  isOpen: boolean;
  message: FutureMessage | null;
  onClose: () => void;
}

const InspirationMessageModal = ({ isOpen, message, onClose }: InspirationMessageModalProps) => {
  if (!message) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>A Message From Your Past Self</span>
          </DialogTitle>
          <DialogDescription>
            You wrote this {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
          </DialogDescription>
        </DialogHeader>
        
        <Card className="p-6 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" />
              <span>Scheduled for inspiration</span>
            </div>
            
            <div>
              <h3 className="font-semibold text-lg mb-2">{message.title}</h3>
              <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                {message.message}
              </p>
            </div>
            
            <div className="flex items-center justify-center pt-4">
              <Heart className="h-4 w-4 text-red-500 mr-2" />
              <span className="text-sm text-muted-foreground">From you, with love</span>
            </div>
          </div>
        </Card>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onClose}>
            Keep for Later
          </Button>
          <Button onClick={onClose} className="primary-gradient">
            <Sparkles className="h-4 w-4 mr-2" />
            Thank You, Past Me
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default InspirationMessageModal;
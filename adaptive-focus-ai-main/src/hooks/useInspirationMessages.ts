import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface FutureMessage {
  id: string;
  title: string;
  message: string;
  delivery_date: string;
  is_delivered: boolean;
  created_at: string;
}

interface UseInspirationMessagesReturn {
  shouldShowInspiration: boolean;
  currentMessage: FutureMessage | null;
  dismissMessage: () => void;
  triggerInspiration: () => void;
}

export const useInspirationMessages = (
  screenTime: number = 0,
  trustScore: number = 0,
  hasActiveOverride: boolean = false
): UseInspirationMessagesReturn => {
  const [shouldShowInspiration, setShouldShowInspiration] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<FutureMessage | null>(null);
  const [availableMessages, setAvailableMessages] = useState<FutureMessage[]>([]);
  const { user } = useAuth();

  // Load available future messages
  useEffect(() => {
    const loadMessages = async () => {
      if (!user) return;

      const { data } = await supabase
        .from('future_messages')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_delivered', false)
        .lte('delivery_date', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (data) {
        setAvailableMessages(data);
      }
    };

    loadMessages();
  }, [user]);

  const triggerInspiration = useCallback(() => {
    if (availableMessages.length === 0) return;

    // Pick a random message
    const randomMessage = availableMessages[Math.floor(Math.random() * availableMessages.length)];
    setCurrentMessage(randomMessage);
    setShouldShowInspiration(true);

    // Mark the time
    if (user) {
      localStorage.setItem(`lastInspiration_${user.id}`, Date.now().toString());
    }
  }, [availableMessages, user]);

  // Check if inspiration should be triggered
  useEffect(() => {
    if (!user || availableMessages.length === 0) return;

    const checkInspirationTriggers = () => {
      const lastInspiration = localStorage.getItem(`lastInspiration_${user.id}`);
      const now = Date.now();
      const twoHours = 2 * 60 * 60 * 1000; // 2 hours
      
      // Don't show if recently shown
      if (lastInspiration && (now - parseInt(lastInspiration)) < twoHours) {
        return false;
      }

      // Trigger conditions:
      // 1. High screen time (over 4 hours = 240 minutes)
      // 2. Low trust score (under 50)
      // 3. Active override request
      // 4. Random chance (5% every check)
      const highScreenTime = screenTime > 240;
      const lowTrustScore = trustScore < 50;
      const randomChance = Math.random() < 0.05;
      
      if (highScreenTime || lowTrustScore || hasActiveOverride || randomChance) {
        return true;
      }

      return false;
    };

    const timer = setInterval(() => {
      if (checkInspirationTriggers() && !shouldShowInspiration) {
        triggerInspiration();
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(timer);
  }, [user, availableMessages, screenTime, trustScore, hasActiveOverride, shouldShowInspiration, triggerInspiration]);

  const dismissMessage = useCallback(async () => {
    setShouldShowInspiration(false);
    
    // Mark message as delivered
    if (currentMessage && user) {
      await supabase
        .from('future_messages')
        .update({ is_delivered: true })
        .eq('id', currentMessage.id);
      
      // Remove from available messages
      setAvailableMessages(prev => prev.filter(msg => msg.id !== currentMessage.id));
    }
    
    setCurrentMessage(null);
  }, [currentMessage, user]);

  return {
    shouldShowInspiration,
    currentMessage,
    dismissMessage,
    triggerInspiration
  };
};
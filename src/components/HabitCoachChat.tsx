import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Heart, MessageCircle, Send, TrendingUp, X, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface CoachMessage {
  id: string;
  type: 'user' | 'coach';
  content: string;
  timestamp: Date;
  intervention?: 'gentle' | 'firm' | 'supportive';
  suggestion?: string;
}

interface HabitCoachProps {
  isOpen: boolean;
  onClose: () => void;
  userContext: {
    screenTime: number;
    trustScore: number;
    recentActivity: string[];
    mood?: string;
  };
}

const HabitCoachChat = ({ isOpen, onClose, userContext }: HabitCoachProps) => {
  // Get training data from localStorage for context
  const getTrainingData = () => {
    try {
      const data = localStorage.getItem('coach_training_data');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };
  
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const welcomeMessage = generateWelcomeMessage(userContext);
      setMessages([{
        id: '1',
        type: 'coach',
        content: welcomeMessage,
        timestamp: new Date()
      }]);
    }
  }, [isOpen, userContext, messages.length]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: CoachMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    
    try {
      // Call the coach-ai edge function
      const { data: coachResponse, error } = await supabase.functions.invoke('coach-ai', {
        body: {
          userInput: inputValue,
          context: {
            screenTime: userContext.screenTime,
            trustScore: userContext.trustScore,
            recentActivity: userContext.recentActivity,
            timeOfDay: new Date().getHours() > 17 ? 'evening' : 
                       new Date().getHours() > 12 ? 'afternoon' : 'morning'
          },
          trainingData: getTrainingData()
        }
      });

      if (error) throw error;

      const coachMessage: CoachMessage = {
        id: (Date.now() + 1).toString(),
        type: 'coach',
        content: coachResponse.content,
        timestamp: new Date(),
        intervention: coachResponse.interventionType === 'supportive' ? 'supportive' : 
                     coachResponse.interventionType === 'stress-relief' ? 'gentle' : 'firm',
        suggestion: coachResponse.suggestion
      };

      // Add training data for future improvement
      const trainingData = getTrainingData();
      trainingData.push({
        input: `Context: ${JSON.stringify(userContext)}\nUser: ${inputValue}`,
        output: coachResponse.content,
        context: { intervention: coachResponse.interventionType, confidence: coachResponse.confidence }
      });
      localStorage.setItem('coach_training_data', JSON.stringify(trainingData));

      setMessages(prev => [...prev, coachMessage]);
    } catch (error) {
      console.error('Coach response error:', error);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'coach',
        content: "I'm here to support you. Could you tell me more about how you're feeling right now?",
        timestamp: new Date(),
        intervention: 'supportive'
      }]);
    } finally {
      setIsTyping(false);
    }

    setInputValue('');
  };

  const generateWelcomeMessage = (context: typeof userContext): string => {
    const { screenTime, trustScore } = context;
    const timeHours = Math.floor(screenTime / 60);
    
    if (trustScore > 80) {
      return `Hey there! 🌟 You're doing amazing with your screen time goals. You've used ${timeHours > 0 ? `${timeHours}h ` : ''}${screenTime % 60}m today. How are you feeling?`;
    } else if (trustScore > 60) {
      return `Hi! I can see you're working on building better screen time habits. You're making progress! How has your day been going?`;
    } else {
      return `Hello! I'm here to support you on your wellness journey. It looks like you might be struggling with screen time today - that's completely normal. Want to talk about it?`;
    }
  };

  const getInterventionColor = (intervention?: string) => {
    switch (intervention) {
      case 'gentle': return 'text-success';
      case 'firm': return 'text-warning';
      case 'supportive': default: return 'text-primary';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 animate-fade-in">
      <Card className="w-full max-w-md mx-4 mb-4 sm:mb-0 max-h-[80vh] flex flex-col card-gradient shadow-medium">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="p-2 wellness-gradient rounded-lg">
              <Heart className="h-5 w-5 text-secondary-foreground" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">Habit Coach</h3>
              <p className="text-xs text-muted-foreground">Your personal wellness companion</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Context Bar */}
        <div className="px-4 py-2 bg-accent/30 border-b border-border">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center space-x-4">
              <span className="text-muted-foreground">
                Screen time: <span className="font-medium text-foreground">
                  {Math.floor(userContext.screenTime / 60)}h {userContext.screenTime % 60}m
                </span>
              </span>
              <Badge 
                variant={userContext.trustScore > 70 ? 'default' : 'outline'} 
                className="text-xs"
              >
                Trust: {userContext.trustScore}%
              </Badge>
            </div>
            <div className="flex items-center space-x-1">
              <TrendingUp className={`h-3 w-3 ${userContext.trustScore > 70 ? 'text-success' : 'text-warning'}`} />
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div key={message.id}>
              <div
                className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-2xl ${
                    message.type === 'user'
                      ? 'primary-gradient text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  <p className="text-sm leading-relaxed">{message.content}</p>
                  <div className="flex items-center justify-between mt-1">
                    <p className={`text-xs ${
                      message.type === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground/70'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {message.intervention && (
                      <Badge variant="outline" className={`text-xs ${getInterventionColor(message.intervention)}`}>
                        {message.intervention}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              {/* Suggestion Card */}
              {message.suggestion && message.type === 'coach' && (
                <div className="ml-4 mt-2">
                  <Card className="p-3 bg-success/10 border-success/20">
                    <div className="flex items-start space-x-2">
                      <Sparkles className="h-4 w-4 text-success mt-0.5" />
                      <div>
                        <p className="text-xs font-medium text-success mb-1">Suggestion</p>
                        <p className="text-xs text-success/80">{message.suggestion}</p>
                      </div>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          ))}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-muted p-3 rounded-2xl">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-muted-foreground/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="How are you feeling? What's on your mind?"
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
              disabled={false}
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || isTyping}
              variant="default"
              className="wellness-gradient"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
            <span>Powered by Gemini AI</span>
            {isTyping && (
              <div className="flex items-center space-x-1">
                <div className="w-1 h-1 bg-primary rounded-full animate-pulse"></div>
                <span>AI thinking...</span>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default HabitCoachChat;
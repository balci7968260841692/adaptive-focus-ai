import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, Clock, AlertCircle, CheckCircle, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ChatMessage {
  id: string;
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
}

interface OverrideRequest {
  app: string;
  requestedTime: number;
  reason: string;
  context: string;
  status: 'pending' | 'approved' | 'denied' | 'negotiating';
}

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
  currentApp: string;
}

const AIOverrideChat = ({ isOpen, onClose, currentApp }: AIChatProps) => {
  // Get training data from localStorage for context
  const getTrainingData = () => {
    try {
      const data = localStorage.getItem('override_training_data');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  };
  
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'ai',
      content: `I see you want to continue using ${currentApp}. Your time limit has been reached. Could you please tell me why you need more time right now?`,
      timestamp: new Date()
    }
  ]);
  
  const [inputValue, setInputValue] = useState('');
  const [overrideRequest, setOverrideRequest] = useState<OverrideRequest | null>(null);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    
    // Use Gemini AI for override evaluation
    try {
      const { data: overrideDecision, error } = await supabase.functions.invoke('override-ai', {
        body: {
          request: {
            app: currentApp,
            requestedTime: 30,
            reason: inputValue,
            context: {
              trustScore: 75, // This would come from user data
              recentOverrides: 1,
              timeOfDay: new Date().getHours() > 17 ? 'evening' : 'day'
            }
          },
          trainingData: getTrainingData()
        }
      });

      if (error) throw error;

      // Add training data
      const trainingData = getTrainingData();
      trainingData.push({
        input: inputValue,
        output: JSON.stringify(overrideDecision),
        context: { app: currentApp }
      });
      localStorage.setItem('override_training_data', JSON.stringify(trainingData));

      const aiResponse = generateAIResponseFromML(overrideDecision, inputValue);
      
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse.message,
        timestamp: new Date()
      }]);

      if (aiResponse.request) {
        setOverrideRequest(aiResponse.request);
      }
    } catch (error) {
      // Fallback to template response
      const aiResponse = generateAIResponse(inputValue);
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        type: 'ai',
        content: aiResponse.message,
        timestamp: new Date()
      }]);

      if (aiResponse.request) {
        setOverrideRequest(aiResponse.request);
      }
    }

    setInputValue('');
  };

  const generateAIResponse = (userInput: string) => {
    const isWorkRelated = userInput.toLowerCase().includes('work') || 
                         userInput.toLowerCase().includes('project') ||
                         userInput.toLowerCase().includes('meeting');
    
    const isUrgent = userInput.toLowerCase().includes('urgent') ||
                     userInput.toLowerCase().includes('important') ||
                     userInput.toLowerCase().includes('deadline');

    if (isWorkRelated && isUrgent) {
      return {
        message: "I understand this is work-related and urgent. I can grant you 30 minutes, but I'd like to verify the context. It's currently after hours - would a 15-minute focused session work instead?",
        request: {
          app: currentApp,
          requestedTime: 15,
          reason: userInput,
          context: "After hours work claim - needs verification",
          status: 'negotiating' as const
        }
      };
    } else if (isWorkRelated) {
      return {
        message: "I see you mentioned work. However, it's currently outside typical work hours. Could you be more specific about what you need to accomplish?",
        request: null
      };
    } else {
      return {
        message: "I notice your reason doesn't seem to match urgent needs. How about we try a 5-minute mindful break instead, then revisit if you still need more time?",
        request: {
          app: currentApp,
          requestedTime: 5,
          reason: userInput,
          context: "Non-urgent request - suggested break first",
          status: 'negotiating' as const
        }
      };
    }
  };

  const handleAcceptNegotiation = () => {
    if (!overrideRequest) return;
    
    setOverrideRequest({ ...overrideRequest, status: 'approved' });
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'ai',
      content: `Great! I've granted you ${overrideRequest.requestedTime} minutes. I'll check in with you when time is up. Use this time wisely! 🎯`,
      timestamp: new Date()
    }]);
  };

  const handleRejectNegotiation = () => {
    if (!overrideRequest) return;
    
    setOverrideRequest({ ...overrideRequest, status: 'denied' });
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      type: 'ai',
      content: "I understand. How about taking a 5-minute walk or doing some breathing exercises? I'll be here when you're ready to try a more focused approach.",
      timestamp: new Date()
    }]);
  };

  const generateAIResponseFromML = (decision: any, userInput: string) => {
    if (decision.approved) {
      return {
        message: `${decision.reasoning} I can grant you ${decision.maxTime} minutes. ${decision.conditions ? decision.conditions.join(' ') : ''}`,
        request: {
          app: currentApp,
          requestedTime: decision.maxTime,
          reason: userInput,
          context: `AI Decision - Confidence: ${Math.round(decision.confidence * 100)}%`,
          status: 'negotiating' as const
        }
      };
    } else {
      return {
        message: `${decision.reasoning} How about we try a 5-minute mindful break instead?`,
        request: {
          app: currentApp,
          requestedTime: 5,
          reason: userInput,
          context: "AI suggested alternative",
          status: 'negotiating' as const
        }
      };
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 animate-fade-in">
      <Card className="w-full max-w-md mx-4 mb-4 sm:mb-0 max-h-[80vh] flex flex-col card-gradient shadow-medium">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-ai-chat/10 rounded-lg">
              <Bot className="h-5 w-5 text-ai-chat" />
            </div>
            <div>
              <h3 className="font-semibold text-foreground">AI Override Assistant</h3>
              <p className="text-xs text-muted-foreground">Smart time management</p>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
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
                <p className={`text-xs mt-1 ${
                  message.type === 'user' ? 'text-primary-foreground/70' : 'text-muted-foreground/70'
                }`}>
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}

          {/* Override Request Card */}
          {overrideRequest && overrideRequest.status === 'negotiating' && (
            <Card className="p-4 bg-accent/50 border-ai-chat/20 animate-slide-up">
              <div className="flex items-center space-x-2 mb-3">
                <Clock className="h-4 w-4 text-ai-chat" />
                <span className="text-sm font-medium text-foreground">Override Proposal</span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">App:</span>
                  <span className="font-medium text-foreground">{overrideRequest.app}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Time:</span>
                  <span className="font-medium text-foreground">{overrideRequest.requestedTime} minutes</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Context:</span>
                  <Badge variant="outline" className="text-xs">
                    {overrideRequest.context.includes('verification') ? 'Needs Review' : 'Suggested'}
                  </Badge>
                </div>
              </div>

              <div className="flex space-x-2 mt-4">
                <Button 
                  size="sm" 
                  variant="default"
                  onClick={handleAcceptNegotiation}
                  className="flex-1 wellness-gradient"
                >
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Accept
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={handleRejectNegotiation}
                  className="flex-1"
                >
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Decline
                </Button>
              </div>
            </Card>
          )}

          {overrideRequest && overrideRequest.status === 'approved' && (
            <div className="text-center">
              <Badge className="bg-success text-success-foreground">
                <CheckCircle className="h-3 w-3 mr-1" />
                Override Approved
              </Badge>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-border">
          <div className="flex space-x-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Explain why you need more time..."
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              className="flex-1"
            />
            <Button 
              onClick={handleSendMessage}
              disabled={!inputValue.trim()}
              variant="default"
              className="primary-gradient"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AIOverrideChat;
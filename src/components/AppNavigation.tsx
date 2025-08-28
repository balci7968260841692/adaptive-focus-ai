import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  Settings, 
  MessageCircle, 
  Home, 
  Brain,
  Clock,
  Shield
} from 'lucide-react';

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  hasActiveOverride?: boolean;
  trustScore?: number;
}

const AppNavigation = ({ activeTab, onTabChange, hasActiveOverride = false, trustScore = 75 }: NavigationProps) => {
  const navItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
      description: 'Overview'
    },
    {
      id: 'limits',
      label: 'Limits',
      icon: Clock,
      description: 'App Limits'
    },
    {
      id: 'insights',
      label: 'Insights',
      icon: BarChart3,
      description: 'Analytics'
    },
    {
      id: 'future-messages',
      label: 'Messages',
      icon: MessageCircle,
      description: 'Future Self'
    },
    {
      id: 'data-collection',
      label: 'Profile',
      icon: Brain,
      description: 'Personal Data'
    },
    {
      id: 'ml-training',
      label: 'AI Training',
      icon: Brain,
      description: 'Train Models'
    },
    {
      id: 'settings',
      label: 'Settings',
      icon: Settings,
      description: 'Preferences'
    }
  ];

  return (
    <Card className="p-4 card-gradient shadow-soft">
      {/* Trust Score Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="p-2 wellness-gradient rounded-lg">
            <Shield className="h-5 w-5 text-secondary-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">Trust Score</p>
            <p className="text-xs text-muted-foreground">{trustScore}% - Keep it up!</p>
          </div>
        </div>
        
        {hasActiveOverride && (
          <Badge className="bg-ai-chat text-ai-chat-foreground animate-gentle-bounce">
            <Brain className="h-3 w-3 mr-1" />
            AI Active
          </Badge>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          const Icon = item.icon;
          
          return (
            <Button
              key={item.id}
              variant={isActive ? "default" : "ghost"}
              size="sm"
              onClick={() => onTabChange(item.id)}
              className={`flex-col h-auto py-3 px-2 space-y-1 ${
                isActive 
                  ? 'primary-gradient text-primary-foreground shadow-glow' 
                  : 'hover:bg-accent'
              }`}
            >
              <Icon className={`h-4 w-4 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
              <span className={`text-xs font-medium ${
                isActive ? 'text-primary-foreground' : 'text-foreground'
              }`}>
                {item.label}
              </span>
              <span className={`text-xs ${
                isActive ? 'text-primary-foreground/70' : 'text-muted-foreground'
              }`}>
                {item.description}
              </span>
            </Button>
          );
        })}
      </div>

      {/* AI Chat Quick Access */}
      <div className="mt-4 pt-4 border-t border-border">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onTabChange('ai-chat')}
          className="w-full flex items-center justify-center space-x-2 border-ai-chat/20 hover:bg-ai-chat/5"
        >
          <MessageCircle className="h-4 w-4 text-ai-chat" />
          <span className="text-sm font-medium text-foreground">Request Override</span>
        </Button>
      </div>
    </Card>
  );
};

export default AppNavigation;
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import WellnessDashboard from '@/components/WellnessDashboard';
import AIOverrideChat from '@/components/AIOverrideChat';
import AppNavigation from '@/components/AppNavigation';
import AppLimitsSettings from '@/components/AppLimitsSettings';
import { Brain, Clock, AlertCircle } from 'lucide-react';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAIChat, setShowAIChat] = useState(false);
  
  // Mock data - in a real app this would come from device APIs
  const mockData = {
    totalScreenTime: 245, // minutes today
    dailyLimit: 360, // 6 hours
    trustScore: 78,
    apps: [
      {
        name: 'Instagram',
        icon: '📸',
        timeUsed: 85,
        timeLimit: 60,
        category: 'Social Media'
      },
      {
        name: 'YouTube',
        icon: '📺',
        timeUsed: 120,
        timeLimit: 90,
        category: 'Entertainment'
      },
      {
        name: 'WhatsApp',
        icon: '💬',
        timeUsed: 25,
        timeLimit: 60,
        category: 'Communication'
      },
      {
        name: 'Chrome',
        icon: '🌐',
        timeUsed: 15,
        timeLimit: 180,
        category: 'Productivity'
      }
    ]
  };

  const hasOverLimitApps = mockData.apps.some(app => app.timeUsed >= app.timeLimit);

  const handleTabChange = (tab: string) => {
    if (tab === 'ai-chat') {
      setShowAIChat(true);
    } else {
      setActiveTab(tab);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <WellnessDashboard {...mockData} />;
      case 'limits':
        return <AppLimitsSettings />;
      case 'insights':
        return (
          <div className="text-center py-12 animate-fade-in">
            <Brain className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">AI Insights Coming Soon</h3>
            <p className="text-muted-foreground">Advanced analytics and personalized recommendations</p>
          </div>
        );
      case 'settings':
        return (
          <div className="text-center py-12 animate-fade-in">
            <Clock className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Settings</h3>
            <p className="text-muted-foreground">Customize your screen time preferences</p>
          </div>
        );
      default:
        return <WellnessDashboard {...mockData} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20">
      <div className="container mx-auto px-4 py-6 max-w-md sm:max-w-2xl">
        {/* Header */}
        <header className="mb-6 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-bold text-foreground">ScreenWise</h1>
              <p className="text-sm text-muted-foreground">AI-Enhanced Screen Time Manager</p>
            </div>
            
            {hasOverLimitApps && (
              <Button
                variant="ai-chat"
                size="sm"
                onClick={() => setShowAIChat(true)}
                className="animate-gentle-bounce shadow-glow"
              >
                <AlertCircle className="h-4 w-4 mr-2" />
                Request Override
              </Button>
            )}
          </div>

          {/* Status Bar */}
          <div className="flex items-center space-x-2">
            <Badge 
              variant={mockData.trustScore >= 70 ? "success" : "warning"}
              className="text-xs"
            >
              Trust Score: {mockData.trustScore}%
            </Badge>
            <Badge variant="outline" className="text-xs">
              {Math.floor((mockData.dailyLimit - mockData.totalScreenTime) / 60)}h {(mockData.dailyLimit - mockData.totalScreenTime) % 60}m left today
            </Badge>
          </div>
        </header>

        {/* Navigation */}
        <div className="mb-6">
          <AppNavigation 
            activeTab={activeTab}
            onTabChange={handleTabChange}
            hasActiveOverride={hasOverLimitApps}
            trustScore={mockData.trustScore}
          />
        </div>

        {/* Main Content */}
        <main>
          {renderContent()}
        </main>

        {/* AI Override Chat Modal */}
        <AIOverrideChat 
          isOpen={showAIChat}
          onClose={() => setShowAIChat(false)}
          currentApp="Instagram" // In real app, this would be the app that triggered the limit
        />
      </div>

      {/* Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-1/4 right-1/4 w-64 h-64 primary-gradient rounded-full opacity-5 blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-48 h-48 wellness-gradient rounded-full opacity-5 blur-3xl" />
      </div>
    </div>
  );
};

export default Index;
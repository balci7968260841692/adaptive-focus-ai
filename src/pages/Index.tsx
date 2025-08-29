import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AppNavigation from "../components/AppNavigation";
import WellnessDashboard from "../components/WellnessDashboard";
import AppLimitsSettings from "../components/AppLimitsSettings";
import AIOverrideChat from "../components/AIOverrideChat";
import HabitCoachChat from "../components/HabitCoachChat";
import MLTrainingInterface from "../components/MLTrainingInterface";
import FutureMessages from "../components/FutureMessages";
import UserDataCollection from "../components/UserDataCollection";
import DeviceTrackingStatus from "../components/DeviceTrackingStatus";
import { useAuth } from "@/hooks/useAuth";
import { useDeviceTracking } from "@/hooks/useDeviceTracking";
import { LogOut, User, Brain, Zap } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showAIChat, setShowAIChat] = useState(false);
  const [showCoachChat, setShowCoachChat] = useState(false);
  const [showMLTraining, setShowMLTraining] = useState(false);
  const { user, profile, loading, signOut } = useAuth();
  const { screenTimeData } = useDeviceTracking();
  const navigate = useNavigate();

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  // Use real tracking data, fallback to demo data if no real data available
  const displayData = screenTimeData.apps.length > 0 ? screenTimeData : {
    totalScreenTime: 245, // minutes
    dailyLimit: 360, // 6 hours in minutes
    trustScore: 75,
    apps: [
      {
        name: "Social Media",
        icon: "📱",
        timeUsed: 135, // minutes
        timeLimit: 180, // 3 hours
        category: "Social"
      },
      {
        name: "Work Apps",
        icon: "💼",
        timeUsed: 105, // 1h 45m
        timeLimit: 480, // 8 hours
        category: "Productivity"
      },
      {
        name: "Entertainment",
        icon: "🎬",
        timeUsed: 30,
        timeLimit: 60, // 1 hour
        category: "Entertainment"
      },
      {
        name: "Games",
        icon: "🎮",
        timeUsed: 150, // 2h 30m
        timeLimit: 90, // 1h 30m
        category: "Games"
      }
    ]
  };

  const hasActiveOverride = displayData.apps.some(app => app.timeUsed >= app.timeLimit);

  const handleTabChange = (tab: string) => {
    if (tab === 'ai-chat') {
      setShowAIChat(true);
    } else {
      setActiveTab(tab);
      setShowAIChat(false);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case "limits":
        return <AppLimitsSettings />;
      case "insights":
        return <WellnessDashboard {...displayData} />;
      case "future-messages":
        return <FutureMessages />;
      case "data-collection":
        return <UserDataCollection />;
      case "ml-training":
        return (
          <Card className="p-6">
            <div className="text-center space-y-6">
              <div className="mx-auto w-16 h-16 bg-ai-chat/10 rounded-2xl flex items-center justify-center">
                <Brain className="h-8 w-8 text-ai-chat" />
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-2">ML Model Training</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Train your local AI models with custom data for personalized coaching and override decisions.
                </p>
              </div>
              <Button
                onClick={() => setShowMLTraining(true)}
                className="primary-gradient"
                size="lg"
              >
                <Brain className="mr-2 h-5 w-5" />
                Open Training Interface
              </Button>
            </div>
          </Card>
        );
      case "settings":
        return (
          <Card className="p-6">
            <h2 className="text-2xl font-bold mb-4">Settings</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5" />
                  <div>
                    <p className="font-medium">{profile?.display_name || user?.email}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                  </div>
                </div>
                <Button variant="outline" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          </Card>
        );
      default:
        return <WellnessDashboard {...displayData} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Background decorations */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-20 left-10 w-72 h-72 primary-gradient rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 secondary-gradient rounded-full opacity-10 blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-3xl font-bold">ScreenWise</h1>
            <p className="text-muted-foreground">
              Welcome back, {profile?.display_name || user?.email?.split('@')[0]}
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            {hasActiveOverride && (
              <div className="px-3 py-1 bg-warning/10 text-warning border border-warning/20 rounded-full text-sm font-medium">
                Limits Exceeded
              </div>
            )}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowCoachChat(true)}
              className="wellness-gradient text-secondary-foreground"
            >
              <Zap className="mr-2 h-4 w-4" />
              Coach
            </Button>
            {hasActiveOverride && (
              <Button 
                variant="default" 
                size="sm"
                onClick={() => setShowAIChat(true)}
                className="primary-gradient shadow-glow"
              >
                Request Override
              </Button>
            )}
          </div>
        </div>

        {/* Navigation */}
            <AppNavigation 
              activeTab={activeTab} 
              onTabChange={handleTabChange}
              hasActiveOverride={hasActiveOverride}
              trustScore={displayData.trustScore}
            />

        {/* Main Content */}
        <div className="space-y-6">
          <DeviceTrackingStatus />
          {renderContent()}
        </div>

        {/* AI Override Chat Modal */}
        <AIOverrideChat 
          isOpen={showAIChat}
          onClose={() => setShowAIChat(false)}
          currentApp="Games"
        />

        {/* Habit Coach Chat Modal */}
        <HabitCoachChat
          isOpen={showCoachChat}
          onClose={() => setShowCoachChat(false)}
          userContext={{
            screenTime: displayData.totalScreenTime,
            trustScore: displayData.trustScore,
            recentActivity: displayData.apps.map(app => app.name),
            mood: 'neutral'
          }}
        />

        {/* ML Training Interface Modal */}
        <MLTrainingInterface
          isOpen={showMLTraining}
          onClose={() => setShowMLTraining(false)}
        />
      </div>
    </div>
  );
};

export default Index;
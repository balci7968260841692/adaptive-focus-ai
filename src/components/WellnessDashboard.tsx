import React from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, Shield, TrendingUp, Brain } from 'lucide-react';

interface AppUsage {
  name: string;
  icon: string;
  timeUsed: number;
  timeLimit: number;
  category: string;
}

interface DashboardProps {
  totalScreenTime: number;
  dailyLimit: number;
  trustScore: number;
  apps: AppUsage[];
}

const WellnessDashboard = ({ totalScreenTime, dailyLimit, trustScore, apps }: DashboardProps) => {
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getUsagePercentage = (used: number, limit: number) => {
    return Math.min((used / limit) * 100, 100);
  };

  const getTrustLevel = (score: number) => {
    if (score >= 80) return { level: 'Excellent', color: 'success' };
    if (score >= 60) return { level: 'Good', color: 'primary' };
    if (score >= 40) return { level: 'Fair', color: 'warning' };
    return { level: 'Needs Work', color: 'danger' };
  };

  const trustLevel = getTrustLevel(trustScore);
  const overallProgress = getUsagePercentage(totalScreenTime, dailyLimit);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-6 card-gradient shadow-soft">
          <div className="flex items-center space-x-3">
            <div className="p-3 primary-gradient rounded-xl">
              <Clock className="h-6 w-6 text-primary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Today's Usage</p>
              <p className="text-2xl font-bold text-foreground">
                {formatTime(totalScreenTime)}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <Progress 
              value={overallProgress} 
              variant={overallProgress > 90 ? 'danger' : overallProgress > 70 ? 'warning' : 'default'}
              className="h-2" 
            />
            <p className="text-xs text-muted-foreground mt-2">
              {formatTime(dailyLimit - totalScreenTime)} remaining
            </p>
          </div>
        </Card>

        <Card className="p-6 card-gradient shadow-soft">
          <div className="flex items-center space-x-3">
            <div className="p-3 wellness-gradient rounded-xl">
              <Shield className="h-6 w-6 text-secondary-foreground" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Trust Score</p>
              <div className="flex items-center space-x-2">
                <p className="text-2xl font-bold text-foreground">{trustScore}%</p>
                <Badge variant={trustLevel.color as any} className="text-xs">
                  {trustLevel.level}
                </Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* App Usage Breakdown */}
      <Card className="p-6 card-gradient shadow-soft">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-foreground flex items-center">
            <TrendingUp className="h-5 w-5 mr-2 text-primary" />
            App Usage Today
          </h3>
          <Badge variant="outline" className="text-xs">
            {apps?.length || 0} apps tracked
          </Badge>
        </div>
        
        <div className="space-y-4">
          {apps?.map((app, index) => {
            const percentage = getUsagePercentage(app.timeUsed, app.timeLimit);
            const isOverLimit = app.timeUsed >= app.timeLimit;
            
            return (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{app.icon}</span>
                    <div>
                      <p className="font-medium text-foreground">{app.name}</p>
                      <p className="text-xs text-muted-foreground">{app.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-medium ${isOverLimit ? 'text-danger' : 'text-foreground'}`}>
                      {formatTime(app.timeUsed)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      of {formatTime(app.timeLimit)}
                    </p>
                  </div>
                </div>
                <Progress 
                  value={percentage} 
                  variant={isOverLimit ? 'danger' : percentage > 70 ? 'warning' : 'default'}
                  className="h-2"
                />
              </div>
            );
          }) || []}
        </div>
      </Card>

      {/* AI Insights */}
      <Card className="p-6 card-gradient shadow-soft border-l-4 border-ai-chat">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-ai-chat/10 rounded-lg">
            <Brain className="h-5 w-5 text-ai-chat" />
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">AI Insights</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              You've been staying within limits well this week! Your trust score improved by 12% 
              since last week. Consider setting a 15-minute break after 2 hours of screen time.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default WellnessDashboard;
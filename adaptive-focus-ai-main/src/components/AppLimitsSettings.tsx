import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Clock, 
  Plus, 
  Trash2, 
  Edit, 
  Save, 
  X, 
  Smartphone,
  Monitor,
  Gamepad2,
  MessageSquare,
  Camera
} from 'lucide-react';

interface AppLimit {
  id: string;
  name: string;
  icon: string;
  category: string;
  dailyLimit: number; // in minutes
  isEnabled: boolean;
  overrideHistory: number; // number of overrides this week
}

const AppLimitsSettings = () => {
  const [appLimits, setAppLimits] = useState<AppLimit[]>([
    {
      id: '1',
      name: 'Instagram',
      icon: '📸',
      category: 'Social Media',
      dailyLimit: 60,
      isEnabled: true,
      overrideHistory: 3
    },
    {
      id: '2',
      name: 'TikTok',
      icon: '🎵',
      category: 'Entertainment',
      dailyLimit: 30,
      isEnabled: true,
      overrideHistory: 8
    },
    {
      id: '3',
      name: 'YouTube',
      icon: '📺',
      category: 'Entertainment',
      dailyLimit: 90,
      isEnabled: true,
      overrideHistory: 2
    },
    {
      id: '4',
      name: 'Chrome',
      icon: '🌐',
      category: 'Productivity',
      dailyLimit: 180,
      isEnabled: false,
      overrideHistory: 0
    }
  ]);

  const [editingApp, setEditingApp] = useState<string | null>(null);
  const [showAddApp, setShowAddApp] = useState(false);

  const categoryIcons: { [key: string]: any } = {
    'Social Media': MessageSquare,
    'Entertainment': Gamepad2,
    'Productivity': Monitor,
    'Utilities': Smartphone,
    'Photography': Camera
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getOverrideRisk = (overrides: number) => {
    if (overrides >= 7) return { level: 'High Risk', color: 'danger' };
    if (overrides >= 4) return { level: 'Medium Risk', color: 'warning' };
    if (overrides >= 1) return { level: 'Low Risk', color: 'primary' };
    return { level: 'Good', color: 'success' };
  };

  const updateAppLimit = (appId: string, field: keyof AppLimit, value: any) => {
    setAppLimits(prev => prev.map(app => 
      app.id === appId ? { ...app, [field]: value } : app
    ));
  };

  const deleteApp = (appId: string) => {
    setAppLimits(prev => prev.filter(app => app.id !== appId));
  };

  const categories = Array.from(new Set(appLimits.map(app => app.category)));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">App Limits</h2>
          <p className="text-muted-foreground">Manage your daily screen time limits</p>
        </div>
        <Button 
          onClick={() => setShowAddApp(true)}
          variant="wellness"
          className="shadow-soft"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add App
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-4 card-gradient text-center">
          <p className="text-2xl font-bold text-foreground">{appLimits.filter(a => a.isEnabled).length}</p>
          <p className="text-sm text-muted-foreground">Apps Limited</p>
        </Card>
        <Card className="p-4 card-gradient text-center">
          <p className="text-2xl font-bold text-foreground">
            {Math.round(appLimits.reduce((sum, app) => sum + app.dailyLimit, 0) / 60)}h
          </p>
          <p className="text-sm text-muted-foreground">Total Daily Limit</p>
        </Card>
        <Card className="p-4 card-gradient text-center">
          <p className="text-2xl font-bold text-foreground">
            {appLimits.reduce((sum, app) => sum + app.overrideHistory, 0)}
          </p>
          <p className="text-sm text-muted-foreground">Overrides This Week</p>
        </Card>
      </div>

      {/* Apps by Category */}
      {categories.map(category => {
        const categoryApps = appLimits.filter(app => app.category === category);
        const CategoryIcon = categoryIcons[category] || Monitor;
        
        return (
          <Card key={category} className="p-6 card-gradient shadow-soft">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 primary-gradient rounded-lg">
                <CategoryIcon className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground">{category}</h3>
                <p className="text-sm text-muted-foreground">{categoryApps.length} apps</p>
              </div>
            </div>

            <div className="space-y-4">
              {categoryApps.map(app => {
                const isEditing = editingApp === app.id;
                const riskLevel = getOverrideRisk(app.overrideHistory);

                return (
                  <div key={app.id} className="p-4 bg-accent/30 rounded-lg border border-border/50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{app.icon}</span>
                        <div>
                          <p className="font-medium text-foreground">{app.name}</p>
                          <div className="flex items-center space-x-2">
                            <Badge variant={riskLevel.color as any} className="text-xs">
                              {riskLevel.level}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {app.overrideHistory} overrides this week
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={app.isEnabled}
                          onCheckedChange={(checked) => updateAppLimit(app.id, 'isEnabled', checked)}
                        />
                        <Button 
                          variant="ghost" 
                          size="icon-sm"
                          onClick={() => setEditingApp(isEditing ? null : app.id)}
                        >
                          {isEditing ? <X className="h-3 w-3" /> : <Edit className="h-3 w-3" />}
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon-sm"
                          onClick={() => deleteApp(app.id)}
                          className="text-danger hover:text-danger"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-sm font-medium text-foreground mb-2 block">
                            Daily Limit: {formatTime(app.dailyLimit)}
                          </label>
                          <Slider
                            value={[app.dailyLimit]}
                            onValueChange={([value]) => updateAppLimit(app.id, 'dailyLimit', value)}
                            max={300}
                            min={15}
                            step={15}
                            className="w-full"
                          />
                        </div>
                        <Button 
                          size="sm" 
                          variant="success"
                          onClick={() => setEditingApp(null)}
                          className="w-full"
                        >
                          <Save className="h-3 w-3 mr-2" />
                          Save Changes
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm text-foreground font-medium">
                            {formatTime(app.dailyLimit)} daily limit
                          </span>
                        </div>
                        <Badge 
                          variant={app.isEnabled ? "success" : "outline"}
                          className="text-xs"
                        >
                          {app.isEnabled ? 'Active' : 'Disabled'}
                        </Badge>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

export default AppLimitsSettings;
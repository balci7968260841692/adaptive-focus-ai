import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Smartphone, Clock, Search, Save } from 'lucide-react';
import { toast } from 'sonner';
import UsageTracker, { AppUsageInfo } from '@/plugins/UsageTracker';

interface AppLimit {
  packageName: string;
  dailyLimitMinutes: number;
}

export const AllAppsManager = () => {
  const [installedApps, setInstalledApps] = useState<AppUsageInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [appLimits, setAppLimits] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    // Load saved limits from localStorage
    const savedLimits = localStorage.getItem('app_limits');
    if (savedLimits) {
      setAppLimits(new Map(JSON.parse(savedLimits)));
    }
  }, []);

  const scanInstalledApps = async () => {
    setLoading(true);
    try {
      const result = await UsageTracker.getInstalledApps();
      
      if (result.apps && result.apps.length > 0) {
        // Sort alphabetically
        const sortedApps = result.apps.sort((a, b) => 
          a.appName.localeCompare(b.appName)
        );
        setInstalledApps(sortedApps);
        toast.success(`Found ${sortedApps.length} installed apps`);
      } else {
        toast.info('No user apps found');
      }
    } catch (error) {
      console.error('Error scanning apps:', error);
      toast.error('Failed to scan installed apps. Make sure permissions are granted.');
    } finally {
      setLoading(false);
    }
  };

  const updateAppLimit = (packageName: string, minutes: number) => {
    const newLimits = new Map(appLimits);
    if (minutes > 0) {
      newLimits.set(packageName, minutes);
    } else {
      newLimits.delete(packageName);
    }
    setAppLimits(newLimits);
  };

  const saveAllLimits = () => {
    try {
      const limitsArray = Array.from(appLimits.entries());
      localStorage.setItem('app_limits', JSON.stringify(limitsArray));
      toast.success(`Saved limits for ${limitsArray.length} apps`);
    } catch (error) {
      toast.error('Failed to save app limits');
    }
  };

  const filteredApps = installedApps.filter(app =>
    app.appName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    app.packageName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'Social': return 'bg-blue-500/10 text-blue-500';
      case 'Entertainment': return 'bg-purple-500/10 text-purple-500';
      case 'Productivity': return 'bg-green-500/10 text-green-500';
      case 'Games': return 'bg-red-500/10 text-red-500';
      case 'Finance': return 'bg-yellow-500/10 text-yellow-500';
      case 'Health': return 'bg-pink-500/10 text-pink-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Smartphone className="w-5 h-5" />
          All Installed Apps
        </CardTitle>
        <CardDescription>
          Scan your device and set screen time limits for any installed app
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={scanInstalledApps} 
            disabled={loading}
            className="flex-1"
          >
            {loading ? 'Scanning...' : 'Scan Device for Apps'}
          </Button>
          {installedApps.length > 0 && (
            <Button 
              onClick={saveAllLimits}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Save All Limits
            </Button>
          )}
        </div>

        {installedApps.length > 0 && (
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search apps..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

            <div className="text-sm text-muted-foreground">
              Found {filteredApps.length} apps
              {appLimits.size > 0 && ` • ${appLimits.size} apps with limits set`}
            </div>

            <ScrollArea className="h-[400px] rounded-md border">
              <div className="p-4 space-y-3">
                {filteredApps.map((app) => (
                  <div
                    key={app.packageName}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex-1 min-w-0 mr-4">
                      <div className="font-medium truncate">{app.appName}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {app.packageName}
                      </div>
                      {app.category && (
                        <Badge 
                          variant="secondary" 
                          className={`mt-1 text-xs ${getCategoryColor(app.category)}`}
                        >
                          {app.category}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <Input
                        type="number"
                        min="0"
                        placeholder="Limit (min)"
                        value={appLimits.get(app.packageName) || ''}
                        onChange={(e) => updateAppLimit(app.packageName, parseInt(e.target.value) || 0)}
                        className="w-24"
                      />
                      <span className="text-xs text-muted-foreground whitespace-nowrap">
                        min/day
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </>
        )}

        {installedApps.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            Click "Scan Device for Apps" to discover all installed applications
          </div>
        )}
      </CardContent>
    </Card>
  );
};

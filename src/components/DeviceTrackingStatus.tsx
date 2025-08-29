import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Smartphone, Play, Pause, Info } from 'lucide-react';
import { useDeviceTracking } from '@/hooks/useDeviceTracking';

const DeviceTrackingStatus = () => {
  const { screenTimeData, isTracking, loadTodaysData } = useDeviceTracking();

  return (
    <Card className="p-4 border-dashed border-2 border-ai-chat/20 bg-ai-chat/5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Smartphone className="h-5 w-5 text-ai-chat" />
          <span className="font-medium">Device Tracking</span>
          <Badge variant={isTracking ? "default" : "secondary"} className="text-xs">
            {isTracking ? (
              <>
                <Play className="h-3 w-3 mr-1" />
                Active
              </>
            ) : (
              <>
                <Pause className="h-3 w-3 mr-1" />
                Inactive
              </>
            )}
          </Badge>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadTodaysData}
          className="text-xs"
        >
          Refresh
        </Button>
      </div>
      
      <div className="space-y-2 text-sm text-muted-foreground">
        <div className="flex items-start space-x-2">
          <Info className="h-4 w-4 mt-0.5 flex-shrink-0" />
          <div>
            {screenTimeData.apps.length > 0 ? (
              <p>
                Currently tracking <strong>{screenTimeData.apps.length} apps</strong> with{' '}
                <strong>{screenTimeData.totalScreenTime} minutes</strong> of usage today.
              </p>
            ) : (
              <div className="space-y-1">
                <p><strong>Real device tracking is ready!</strong></p>
                <p>
                  • Currently showing demo data<br/>
                  • App will track real usage when deployed to mobile<br/>
                  • Requires app usage permissions on device
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

export default DeviceTrackingStatus;
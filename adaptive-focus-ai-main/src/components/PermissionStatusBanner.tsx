import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Shield, Settings, Info } from "lucide-react";

interface PermissionStatusBannerProps {
  hasPermission: boolean;
  onRequestPermission: () => void;
  onShowPrivacyPolicy: () => void;
}

const PermissionStatusBanner = ({ 
  hasPermission, 
  onRequestPermission, 
  onShowPrivacyPolicy 
}: PermissionStatusBannerProps) => {
  const [dismissed, setDismissed] = useState(false);

  if (hasPermission || dismissed) return null;

  return (
    <Alert className="mb-4 border-orange-200 bg-orange-50/50">
      <AlertTriangle className="h-4 w-4 text-orange-600" />
      <AlertDescription className="flex items-center justify-between">
        <div className="flex-1 mr-4">
          <p className="font-medium text-orange-800">Limited Mode Active</p>
          <p className="text-sm text-orange-700">
            Grant usage access for personalized insights and accurate tracking.
          </p>
        </div>
        <div className="flex gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onShowPrivacyPolicy}
            className="text-xs"
          >
            <Info className="h-3 w-3 mr-1" />
            Privacy
          </Button>
          <Button
            size="sm"
            onClick={onRequestPermission}
            className="text-xs"
          >
            <Shield className="h-3 w-3 mr-1" />
            Enable
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDismissed(true)}
            className="text-xs px-2"
          >
            ×
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};

export default PermissionStatusBanner;
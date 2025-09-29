import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Eye, Clock, Settings, AlertTriangle } from "lucide-react";

interface PermissionExplanationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAccept: () => void;
  onDecline: () => void;
}

const PermissionExplanationDialog = ({ 
  open, 
  onOpenChange, 
  onAccept, 
  onDecline 
}: PermissionExplanationDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Usage Statistics Permission
          </DialogTitle>
          <DialogDescription>
            ScreenWise needs access to usage statistics to help you manage your screen time effectively.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Card>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Eye className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">What we track:</p>
                  <p className="text-sm text-muted-foreground">App usage times and frequency</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Why we need it:</p>
                  <p className="text-sm text-muted-foreground">To provide accurate screen time insights and personalized coaching</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <Settings className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">Your control:</p>
                  <p className="text-sm text-muted-foreground">You can revoke this permission anytime in Android Settings</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="bg-secondary/50 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Privacy guarantee:</p>
                <p className="text-muted-foreground">Your usage data stays on your device and is only used for your personal insights. We never share this data with third parties.</p>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={onDecline} className="flex-1">
              Use Limited Mode
            </Button>
            <Button onClick={onAccept} className="flex-1">
              Grant Permission
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PermissionExplanationDialog;
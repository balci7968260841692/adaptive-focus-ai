import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Shield, Lock, Eye, Trash2 } from "lucide-react";

interface PrivacyPolicyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PrivacyPolicyDialog = ({ open, onOpenChange }: PrivacyPolicyDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Privacy Policy & Data Usage
          </DialogTitle>
          <DialogDescription>
            How ScreenWise protects and uses your data
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="max-h-[60vh]">
          <div className="space-y-6 pr-4">
            <section>
              <div className="flex items-center gap-2 mb-3">
                <Eye className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Data We Collect</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground ml-6">
                <li>• App usage statistics (time spent, frequency)</li>
                <li>• Device information (platform, model for compatibility)</li>
                <li>• Personal preferences and goals you set</li>
                <li>• AI coaching interactions and responses</li>
              </ul>
            </section>

            <Separator />

            <section>
              <div className="flex items-center gap-2 mb-3">
                <Lock className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">How We Protect Your Data</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground ml-6">
                <li>• All data is encrypted in transit and at rest</li>
                <li>• Usage statistics are processed locally when possible</li>
                <li>• AI interactions are anonymized</li>
                <li>• No data is sold or shared with third parties</li>
                <li>• Secure authentication using industry standards</li>
              </ul>
            </section>

            <Separator />

            <section>
              <div className="flex items-center gap-2 mb-3">
                <Shield className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">How We Use Your Data</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground ml-6">
                <li>• Provide personalized screen time insights</li>
                <li>• Generate AI-powered coaching recommendations</li>
                <li>• Track your progress toward digital wellness goals</li>
                <li>• Improve app functionality and user experience</li>
              </ul>
            </section>

            <Separator />

            <section>
              <div className="flex items-center gap-2 mb-3">
                <Trash2 className="h-4 w-4 text-primary" />
                <h3 className="font-semibold">Your Rights</h3>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground ml-6">
                <li>• Request deletion of all your data</li>
                <li>• Export your data in a standard format</li>
                <li>• Revoke app permissions at any time</li>
                <li>• Opt out of data collection while using basic features</li>
                <li>• Contact support for privacy-related questions</li>
              </ul>
            </section>

            <Separator />

            <section className="bg-secondary/30 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">Android Permissions</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <p><strong>Usage Access:</strong> Required to track app usage statistics for insights</p>
                <p><strong>Package Queries:</strong> Needed to identify installed apps for categorization</p>
                <p><strong>Internet:</strong> For AI coaching features and cloud sync (optional)</p>
                <p className="text-xs mt-2 italic">
                  All permissions can be revoked in Android Settings → Apps → ScreenWise → Permissions
                </p>
              </div>
            </section>
          </div>
        </ScrollArea>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>
            I Understand
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PrivacyPolicyDialog;
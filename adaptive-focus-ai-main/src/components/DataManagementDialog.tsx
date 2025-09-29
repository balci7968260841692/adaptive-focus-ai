import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Download, Trash2, Shield, AlertTriangle } from "lucide-react";

interface DataManagementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DataManagementDialog = ({ open, onOpenChange }: DataManagementDialogProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleExportData = async () => {
    if (!user) return;
    
    setIsExporting(true);
    try {
      // Collect all user data
      const [profileData, appUsageData, screenTimeData, userDataEntries] = await Promise.all([
        supabase.from('profiles').select('*').eq('user_id', user.id).single(),
        supabase.from('app_usage').select('*').eq('user_id', user.id),
        supabase.from('screen_time_summary').select('*').eq('user_id', user.id),
        supabase.from('user_data').select('*').eq('user_id', user.id)
      ]);

      const exportData = {
        profile: profileData.data,
        appUsage: appUsageData.data,
        screenTimeSummary: screenTimeData.data,
        userDataCollection: userDataEntries.data,
        exportedAt: new Date().toISOString(),
        format: 'JSON',
        version: '1.0'
      };

      // Create and download file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `screenwise-data-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: "Data exported successfully",
        description: "Your data has been downloaded as a JSON file"
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        variant: "destructive",
        title: "Export failed",
        description: "There was an error exporting your data"
      });
    }
    setIsExporting(false);
  };

  const handleDeleteAllData = async () => {
    if (!user) return;
    
    setIsDeleting(true);
    try {
      // Delete all user data (cascade will handle related records)
      await Promise.all([
        supabase.from('app_usage').delete().eq('user_id', user.id),
        supabase.from('screen_time_summary').delete().eq('user_id', user.id),
        supabase.from('user_data').delete().eq('user_id', user.id),
        supabase.from('profiles').delete().eq('user_id', user.id)
      ]);

      toast({
        title: "Data deleted successfully",
        description: "All your data has been permanently removed"
      });
      
      setShowDeleteConfirm(false);
      onOpenChange(false);
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description: "There was an error deleting your data"
      });
    }
    setIsDeleting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-primary" />
            Data Management & Privacy
          </DialogTitle>
          <DialogDescription>
            Manage your personal data in compliance with privacy regulations
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <Alert>
            <Shield className="h-4 w-4" />
            <AlertDescription>
              You have full control over your data. Export or delete your information at any time.
            </AlertDescription>
          </Alert>

          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Download className="h-4 w-4" />
                  Export Your Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Download all your personal data in a portable JSON format including:
                </p>
                <ul className="text-sm text-muted-foreground ml-4 space-y-1">
                  <li>• Profile information and preferences</li>
                  <li>• App usage statistics and history</li>
                  <li>• Screen time data and limits</li>
                  <li>• AI coaching interactions</li>
                </ul>
                <Button
                  onClick={handleExportData}
                  disabled={isExporting}
                  className="w-full"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  {isExporting ? "Exporting..." : "Export My Data"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base text-destructive">
                  <Trash2 className="h-4 w-4" />
                  Delete All Data
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Permanently remove all your data from our servers. This action cannot be undone.
                </p>
                {!showDeleteConfirm ? (
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteConfirm(true)}
                    className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete All My Data
                  </Button>
                ) : (
                  <Alert className="border-destructive bg-destructive/5">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <p className="font-medium mb-2">Are you absolutely sure?</p>
                      <p className="text-sm mb-3">This will permanently delete all your data including usage history, preferences, and AI interactions. This action cannot be undone.</p>
                      <div className="flex gap-2">
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={handleDeleteAllData}
                          disabled={isDeleting}
                        >
                          {isDeleting ? "Deleting..." : "Yes, Delete Everything"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowDeleteConfirm(false)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="text-xs text-muted-foreground p-3 bg-secondary/30 rounded-lg">
            <p className="font-medium mb-1">Data Retention Policy:</p>
            <p>• Active data is retained while your account is active</p>
            <p>• Usage statistics are aggregated and anonymized after 1 year</p>
            <p>• Account deletion removes all personal data within 30 days</p>
            <p>• Backup data is purged within 90 days of deletion request</p>
          </div>
        </div>

        <div className="flex justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DataManagementDialog;
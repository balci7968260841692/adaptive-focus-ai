import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, Upload, Download, Database, Zap } from 'lucide-react';
import useMLModels, { TrainingData } from '@/hooks/useMLModels';
import { useToast } from '@/hooks/use-toast';

interface TrainingInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
}

const MLTrainingInterface = ({ isOpen, onClose }: TrainingInterfaceProps) => {
  const { addTrainingData, exportTrainingData, trainingData, isLoading } = useMLModels();
  const { toast } = useToast();
  
  const [currentTab, setCurrentTab] = useState<'coach' | 'override'>('coach');
  const [newTrainingData, setNewTrainingData] = useState({
    input: '',
    output: '',
    context: ''
  });

  const handleAddTrainingData = () => {
    if (!newTrainingData.input.trim() || !newTrainingData.output.trim()) {
      toast({
        title: "Missing Data",
        description: "Please provide both input and output for training data.",
        variant: "destructive"
      });
      return;
    }

    const trainingEntry: TrainingData = {
      input: newTrainingData.input,
      output: newTrainingData.output,
      context: newTrainingData.context ? JSON.parse(newTrainingData.context) : {},
      timestamp: new Date()
    };

    addTrainingData(currentTab, trainingEntry);
    setNewTrainingData({ input: '', output: '', context: '' });
    
    toast({
      title: "Training Data Added",
      description: `Added new ${currentTab} training example.`,
    });
  };

  const handleExportData = (type: 'coach' | 'override') => {
    const data = exportTrainingData(type);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${type}_training_data.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Data Exported",
      description: `${type} training data exported successfully.`,
    });
  };

  const handleImportData = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string) as TrainingData[];
        data.forEach(entry => addTrainingData(currentTab, entry));
        
        toast({
          title: "Data Imported",
          description: `Imported ${data.length} ${currentTab} training examples.`,
        });
      } catch (error) {
        toast({
          title: "Import Error",
          description: "Failed to parse training data file.",
          variant: "destructive"
        });
      }
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden card-gradient shadow-medium">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-ai-chat/10 rounded-lg">
              <Brain className="h-6 w-6 text-ai-chat" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-foreground">ML Training Interface</h2>
              <p className="text-sm text-muted-foreground">
                Train your local AI models with custom data
              </p>
            </div>
          </div>
          <Button variant="ghost" onClick={onClose}>×</Button>
        </div>

        <div className="p-6 overflow-y-auto">
          <Tabs value={currentTab} onValueChange={(v) => setCurrentTab(v as 'coach' | 'override')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="coach" className="flex items-center space-x-2">
                <Zap className="h-4 w-4" />
                <span>Coach AI</span>
              </TabsTrigger>
              <TabsTrigger value="override" className="flex items-center space-x-2">
                <Database className="h-4 w-4" />
                <span>Override AI</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="coach" className="space-y-6">
              <Card className="p-4 bg-accent/30">
                <h3 className="font-medium text-foreground mb-2">Coach AI Training</h3>
                <p className="text-sm text-muted-foreground">
                  Train the coach to provide personalized habit coaching, wellness insights, and supportive interventions.
                </p>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="coach-input">User Input / Situation</Label>
                    <Textarea
                      id="coach-input"
                      placeholder="e.g., 'I've been on my phone for 6 hours today and feel terrible'"
                      value={newTrainingData.input}
                      onChange={(e) => setNewTrainingData(prev => ({ ...prev, input: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="coach-output">Ideal Coach Response</Label>
                    <Textarea
                      id="coach-output"
                      placeholder="e.g., 'I hear that you're feeling overwhelmed. Let's start with a 10-minute break and then set a gentle boundary for the rest of the day.'"
                      value={newTrainingData.output}
                      onChange={(e) => setNewTrainingData(prev => ({ ...prev, output: e.target.value }))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="coach-context">Context (JSON)</Label>
                    <Textarea
                      id="coach-context"
                      placeholder='{"screenTime": 360, "trustScore": 45, "timeOfDay": "evening", "mood": "stressed"}'
                      value={newTrainingData.context}
                      onChange={(e) => setNewTrainingData(prev => ({ ...prev, context: e.target.value }))}
                      className="mt-1 font-mono text-xs"
                    />
                  </div>

                  <Button onClick={handleAddTrainingData} className="w-full primary-gradient">
                    <Upload className="h-4 w-4 mr-2" />
                    Add Training Example
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground">Training Data Management</h4>
                    <Badge variant="outline">{trainingData} total examples</Badge>
                  </div>

                  <div className="space-y-2">
                    <Button 
                      onClick={() => handleExportData('coach')} 
                      variant="outline" 
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Coach Data
                    </Button>

                    <div>
                      <Input
                        type="file"
                        accept=".json"
                        onChange={handleImportData}
                        className="hidden"
                        id="coach-import"
                      />
                      <Button 
                        onClick={() => document.getElementById('coach-import')?.click()}
                        variant="outline" 
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Import Coach Data
                      </Button>
                    </div>
                  </div>

                  <Card className="p-4 bg-success/10 border-success/20">
                    <h5 className="font-medium text-success mb-2">Training Tips</h5>
                    <ul className="text-xs text-success/80 space-y-1">
                      <li>• Include diverse emotional states and contexts</li>
                      <li>• Vary response styles (supportive, firm, gentle)</li>
                      <li>• Add examples for different times of day</li>
                      <li>• Include both positive and challenging scenarios</li>
                    </ul>
                  </Card>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="override" className="space-y-6">
              <Card className="p-4 bg-accent/30">
                <h3 className="font-medium text-foreground mb-2">Override AI Training</h3>
                <p className="text-sm text-muted-foreground">
                  Train the override system to make intelligent decisions about time limit extensions based on context and user history.
                </p>
              </Card>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="override-input">Override Request</Label>
                    <Textarea
                      id="override-input"
                      placeholder="e.g., 'I need 20 more minutes to finish this work presentation for tomorrow'"
                      value={newTrainingData.input}
                      onChange={(e) => setNewTrainingData(prev => ({ ...prev, input: e.target.value }))}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="override-output">Decision & Reasoning</Label>
                    <Textarea
                      id="override-output"
                      placeholder="e.g., 'APPROVED: 15 minutes. Work-related request with good justification, but reduced time to maintain balance.'"
                      value={newTrainingData.output}
                      onChange={(e) => setNewTrainingData(prev => ({ ...prev, output: e.target.value }))}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="override-context">User Context (JSON)</Label>
                    <Textarea
                      id="override-context"
                      placeholder='{"trustScore": 75, "recentOverrides": 1, "timeOfDay": "evening", "currentApp": "Microsoft Word", "requestedTime": 20}'
                      value={newTrainingData.context}
                      onChange={(e) => setNewTrainingData(prev => ({ ...prev, context: e.target.value }))}
                      className="mt-1 font-mono text-xs"
                    />
                  </div>

                  <Button onClick={handleAddTrainingData} className="w-full primary-gradient">
                    <Upload className="h-4 w-4 mr-2" />
                    Add Training Example
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-foreground">Training Data Management</h4>
                    <Badge variant="outline">{trainingData} total examples</Badge>
                  </div>

                  <div className="space-y-2">
                    <Button 
                      onClick={() => handleExportData('override')} 
                      variant="outline" 
                      className="w-full"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Override Data
                    </Button>

                    <div>
                      <Input
                        type="file"
                        accept=".json"
                        onChange={handleImportData}
                        className="hidden"
                        id="override-import"
                      />
                      <Button 
                        onClick={() => document.getElementById('override-import')?.click()}
                        variant="outline" 
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Import Override Data
                      </Button>
                    </div>
                  </div>

                  <Card className="p-4 bg-warning/10 border-warning/20">
                    <h5 className="font-medium text-warning mb-2">Override Examples</h5>
                    <ul className="text-xs text-warning/80 space-y-1">
                      <li>• Work vs leisure requests</li>
                      <li>• High vs low trust score scenarios</li>
                      <li>• Different time periods (5min vs 60min)</li>
                      <li>• Various justification quality levels</li>
                    </ul>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {isLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">Loading ML models...</p>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default MLTrainingInterface;
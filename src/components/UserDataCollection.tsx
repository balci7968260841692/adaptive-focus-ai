import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Brain, Target, Coffee, Moon, Activity } from 'lucide-react';

interface UserData {
  id: string;
  data_type: string;
  data_key: string;
  data_value: any;
  collected_at: string;
}

const UserDataCollection = () => {
  const [userData, setUserData] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  // Form state
  const [personalityData, setPersonalityData] = useState({
    stress_level: [5],
    focus_duration: [30],
    energy_pattern: 'morning',
    motivation_type: 'intrinsic',
    communication_style: 'direct',
    goal_orientation: 'short_term'
  });

  const [habitData, setHabitData] = useState({
    morning_routine: true,
    exercise_frequency: 3,
    sleep_schedule: 'consistent',
    screen_time_goal: 6,
    break_frequency: 30,
    wellness_priority: 'balance'
  });

  const fetchUserData = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('user_data')
      .select('*')
      .eq('user_id', user.id)
      .order('collected_at', { ascending: false });
    
    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load user data"
      });
    } else {
      setUserData(data || []);
      
      // Populate form with existing data
      const personalityEntries = data?.filter(d => d.data_type === 'personality') || [];
      const habitEntries = data?.filter(d => d.data_type === 'habit') || [];
      
      const newPersonalityData = { ...personalityData };
      const newHabitData = { ...habitData };
      
      personalityEntries.forEach(entry => {
        if (entry.data_key in newPersonalityData) {
          (newPersonalityData as any)[entry.data_key] = entry.data_value;
        }
      });
      
      habitEntries.forEach(entry => {
        if (entry.data_key in newHabitData) {
          (newHabitData as any)[entry.data_key] = entry.data_value;
        }
      });
      
      setPersonalityData(newPersonalityData);
      setHabitData(newHabitData);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchUserData();
  }, [user]);

  const saveData = async (dataType: string, dataKey: string, dataValue: any) => {
    if (!user) return;

    const { error } = await supabase
      .from('user_data')
      .upsert({
        user_id: user.id,
        data_type: dataType,
        data_key: dataKey,
        data_value: dataValue
      }, { 
        onConflict: 'user_id,data_type,data_key',
        ignoreDuplicates: false
      });

    if (error) {
      console.error('Error saving data:', error);
      return false;
    }
    return true;
  };

  const handlePersonalitySave = async () => {
    setIsSaving(true);
    let success = true;

    for (const [key, value] of Object.entries(personalityData)) {
      const result = await saveData('personality', key, value);
      if (!result) success = false;
    }

    if (success) {
      toast({
        title: "Personality Profile Updated",
        description: "Your personality data has been saved successfully"
      });
      fetchUserData();
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save some personality data"
      });
    }
    setIsSaving(false);
  };

  const handleHabitSave = async () => {
    setIsSaving(true);
    let success = true;

    for (const [key, value] of Object.entries(habitData)) {
      const result = await saveData('habit', key, value);
      if (!result) success = false;
    }

    if (success) {
      toast({
        title: "Habit Profile Updated",
        description: "Your habit data has been saved successfully"
      });
      fetchUserData();
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save some habit data"
      });
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-1/2"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="h-12 bg-muted rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Personal Data Collection</h2>
        <p className="text-muted-foreground">
          Help us understand you better for personalized coaching
        </p>
      </div>

      {/* Personality Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>Personality Profile</span>
          </CardTitle>
          <CardDescription>
            Tell us about your work style and preferences
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Current Stress Level (1-10)</Label>
              <Slider
                value={personalityData.stress_level}
                onValueChange={(value) => 
                  setPersonalityData(prev => ({ ...prev, stress_level: value }))
                }
                max={10}
                min={1}
                step={1}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                Current: {personalityData.stress_level[0]}/10
              </p>
            </div>

            <div className="space-y-2">
              <Label>Typical Focus Duration (minutes)</Label>
              <Slider
                value={personalityData.focus_duration}
                onValueChange={(value) => 
                  setPersonalityData(prev => ({ ...prev, focus_duration: value }))
                }
                max={120}
                min={5}
                step={5}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                {personalityData.focus_duration[0]} minutes
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="energy-pattern">Energy Pattern</Label>
                <Select
                  value={personalityData.energy_pattern}
                  onValueChange={(value) => 
                    setPersonalityData(prev => ({ ...prev, energy_pattern: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="morning">Morning Person</SelectItem>
                    <SelectItem value="afternoon">Afternoon Peak</SelectItem>
                    <SelectItem value="evening">Evening Person</SelectItem>
                    <SelectItem value="night">Night Owl</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="motivation-type">Motivation Type</Label>
                <Select
                  value={personalityData.motivation_type}
                  onValueChange={(value) => 
                    setPersonalityData(prev => ({ ...prev, motivation_type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="intrinsic">Self-Motivated</SelectItem>
                    <SelectItem value="extrinsic">External Rewards</SelectItem>
                    <SelectItem value="social">Social Recognition</SelectItem>
                    <SelectItem value="achievement">Achievement-Driven</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Button onClick={handlePersonalitySave} disabled={isSaving} className="w-full">
            {isSaving ? 'Saving...' : 'Save Personality Profile'}
          </Button>
        </CardContent>
      </Card>

      {/* Habit Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Habit Profile</span>
          </CardTitle>
          <CardDescription>
            Share your current habits and wellness goals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="morning-routine">Morning Routine</Label>
                <p className="text-sm text-muted-foreground">
                  Do you have a consistent morning routine?
                </p>
              </div>
              <Switch
                id="morning-routine"
                checked={habitData.morning_routine}
                onCheckedChange={(checked) => 
                  setHabitData(prev => ({ ...prev, morning_routine: checked }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Exercise Frequency (days per week)</Label>
              <Slider
                value={[habitData.exercise_frequency]}
                onValueChange={(value) => 
                  setHabitData(prev => ({ ...prev, exercise_frequency: value[0] }))
                }
                max={7}
                min={0}
                step={1}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                {habitData.exercise_frequency} days per week
              </p>
            </div>

            <div className="space-y-2">
              <Label>Screen Time Goal (hours per day)</Label>
              <Slider
                value={[habitData.screen_time_goal]}
                onValueChange={(value) => 
                  setHabitData(prev => ({ ...prev, screen_time_goal: value[0] }))
                }
                max={12}
                min={1}
                step={1}
                className="w-full"
              />
              <p className="text-sm text-muted-foreground">
                {habitData.screen_time_goal} hours per day
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sleep-schedule">Sleep Schedule</Label>
                <Select
                  value={habitData.sleep_schedule}
                  onValueChange={(value) => 
                    setHabitData(prev => ({ ...prev, sleep_schedule: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="consistent">Consistent</SelectItem>
                    <SelectItem value="irregular">Irregular</SelectItem>
                    <SelectItem value="shift_work">Shift Work</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wellness-priority">Wellness Priority</Label>
                <Select
                  value={habitData.wellness_priority}
                  onValueChange={(value) => 
                    setHabitData(prev => ({ ...prev, wellness_priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="balance">Work-Life Balance</SelectItem>
                    <SelectItem value="productivity">Productivity</SelectItem>
                    <SelectItem value="health">Physical Health</SelectItem>
                    <SelectItem value="mental">Mental Health</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Button onClick={handleHabitSave} disabled={isSaving} className="w-full">
            {isSaving ? 'Saving...' : 'Save Habit Profile'}
          </Button>
        </CardContent>
      </Card>

      {/* Data Summary */}
      {userData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="h-5 w-5" />
              <span>Your Data</span>
            </CardTitle>
            <CardDescription>
              Recent data collection summary
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <p>Total data points: {userData.length}</p>
              <p>
                Last updated: {
                  userData.length > 0 
                    ? new Date(userData[0].collected_at).toLocaleDateString()
                    : 'Never'
                }
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default UserDataCollection;
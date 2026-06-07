import { useState } from 'react';
import { motion } from 'framer-motion';
import { User, Bell, Moon, LogOut, Trash2, Save, Loader2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useTheme } from '@/components/theme-provider';

const Settings = () => {
  const { data: profile, isLoading } = useProfile();
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile();
  const { signOut } = useAuth();
  const { toast } = useToast();
  const { setTheme } = useTheme(); // Use the hook

  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    age: profile?.age?.toString() || '',
    gender: profile?.gender || '',
    medical_notes: profile?.medical_notes || '',
    reminders_enabled: profile?.reminders_enabled ?? true,
    dark_mode: profile?.dark_mode ?? false,
  });

  const handleSave = async () => {
    try {
      await updateProfile({
        full_name: formData.full_name,
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender as 'male' | 'female' | 'other' | null,
        medical_notes: formData.medical_notes,
        reminders_enabled: formData.reminders_enabled,
        dark_mode: formData.dark_mode,
      });
      toast({ title: 'Settings saved!', description: 'Your profile has been updated.' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    }
  };

  if (isLoading) return <MainLayout><div className="text-center py-12">Loading...</div></MainLayout>;

  return (
    <MainLayout>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl space-y-8">
        <div>
          <h1 className="text-3xl font-display font-bold">Settings</h1>
          <p className="text-muted-foreground">Manage your profile and preferences</p>
        </div>

        {/* Profile Section */}
        <div className="health-card space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b">
            <User className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-lg">Profile Information</h2>
          </div>

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Full Name</Label>
              <Input value={formData.full_name} onChange={e => setFormData(p => ({ ...p, full_name: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Age</Label>
                <Input type="number" value={formData.age} onChange={e => setFormData(p => ({ ...p, age: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Gender</Label>
                <Select value={formData.gender} onValueChange={v => setFormData(p => ({ ...p, gender: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Medical Notes</Label>
              <Textarea value={formData.medical_notes} onChange={e => setFormData(p => ({ ...p, medical_notes: e.target.value }))} placeholder="Any medical conditions, allergies..." />
            </div>
          </div>
        </div>

        {/* Preferences */}
        <div className="health-card space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b">
            <Bell className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-lg">Preferences</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Health Reminders</p>
                <p className="text-sm text-muted-foreground">Receive hourly health reminders</p>
              </div>
              <Switch checked={formData.reminders_enabled} onCheckedChange={v => setFormData(p => ({ ...p, reminders_enabled: v }))} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Dark Mode</p>
                <p className="text-sm text-muted-foreground">Use dark theme</p>
              </div>
              <Switch
                checked={formData.dark_mode}
                onCheckedChange={v => {
                  setFormData(p => ({ ...p, dark_mode: v }));
                  setTheme(v ? 'dark' : 'light');
                }}
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3">
          <Button onClick={handleSave} className="gradient-primary text-white" disabled={isPending}>
            {isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save Changes
          </Button>
          <Button variant="outline" onClick={signOut}>
            <LogOut className="w-4 h-4 mr-2" /> Sign Out
          </Button>
          <Button variant="destructive">
            <Trash2 className="w-4 h-4 mr-2" /> Deactivate Account
          </Button>
        </div>
      </motion.div>
    </MainLayout>
  );
};

export default Settings;

import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Bell, Plus, Trash2, Calendar, Clock, CheckCircle2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';

import { Switch } from '@/components/ui/switch';
import { Droplets, Utensils, Accessibility } from 'lucide-react';

interface Reminder {
  id: string;
  title: string;
  date: string;
  time: string;
  completed: boolean;
  active: boolean;
}

const Reminders = () => {
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newReminder, setNewReminder] = useState({ title: '', date: '', time: '' });
  const [dailyHabits, setDailyHabits] = useState({
    hydration: true,
    meals: true,
    posture: true
  });
  const { toast } = useToast();

  useEffect(() => {
    const saved = localStorage.getItem('health_reminders');
    const savedHabits = localStorage.getItem('health_habits');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Ensure backward compatibility with 'active' field
      setReminders(parsed.map((r: any) => ({ ...r, active: r.active ?? true })));
    }
    if (savedHabits) {
      setDailyHabits(JSON.parse(savedHabits));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('health_reminders', JSON.stringify(reminders));
  }, [reminders]);

  useEffect(() => {
    localStorage.setItem('health_habits', JSON.stringify(dailyHabits));
  }, [dailyHabits]);

  const addReminder = () => {
    if (!newReminder.title || !newReminder.date || !newReminder.time) return;

    const reminder: Reminder = {
      id: Date.now().toString(),
      title: newReminder.title,
      date: newReminder.date,
      time: newReminder.time,
      completed: false,
      active: true
    };

    setReminders([...reminders, reminder]);
    setNewReminder({ title: '', date: '', time: '' });
    setIsDialogOpen(false);
    toast({ title: 'Reminder set!' });
  };

  const deleteReminder = (id: string) => {
    setReminders(reminders.filter(r => r.id !== id));
  };

  const toggleComplete = (id: string) => {
    setReminders(reminders.map(r => r.id === id ? { ...r, completed: !r.completed } : r));
  };

  const toggleActive = (id: string) => {
    setReminders(reminders.map(r => r.id === id ? { ...r, active: !r.active } : r));
  };

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold">Health Reminders</h1>
            <p className="text-muted-foreground">Manage your habits and appointments.</p>
          </div>
          <Button onClick={() => setIsDialogOpen(true)} className="gradient-primary text-white">
            <Plus className="w-4 h-4 mr-2" /> Add Custom Reminder
          </Button>
        </div>

        {/* Daily Habits Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Daily Habits</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                    <Droplets className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Hydration</h3>
                    <p className="text-xs text-muted-foreground">Drink water frequently</p>
                  </div>
                </div>
                <Switch
                  checked={dailyHabits.hydration}
                  onCheckedChange={(c) => setDailyHabits(prev => ({ ...prev, hydration: c }))}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Meal Intake</h3>
                    <p className="text-xs text-muted-foreground">Log your meals</p>
                  </div>
                </div>
                <Switch
                  checked={dailyHabits.meals}
                  onCheckedChange={(c) => setDailyHabits(prev => ({ ...prev, meals: c }))}
                />
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                    <Accessibility className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium">Posture</h3>
                    <p className="text-xs text-muted-foreground">Stretch every hour</p>
                  </div>
                </div>
                <Switch
                  checked={dailyHabits.posture}
                  onCheckedChange={(c) => setDailyHabits(prev => ({ ...prev, posture: c }))}
                />
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Custom Reminders</h2>
          {reminders.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed rounded-xl">
              <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No custom reminders set.</p>
            </div>
          ) : (
            reminders.map(reminder => (
              <Card key={reminder.id} className={`transition-all ${!reminder.active ? 'opacity-50 grayscale' : ''}`}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`rounded-full ${reminder.completed ? 'text-green-500 hover:text-green-600' : 'text-muted-foreground'}`}
                      onClick={() => toggleComplete(reminder.id)}
                      disabled={!reminder.active}
                    >
                      <CheckCircle2 className="w-6 h-6" />
                    </Button>
                    <div>
                      <h3 className={`font-semibold text-lg ${reminder.completed ? 'line-through decoration-slate-400' : ''}`}>{reminder.title}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(reminder.date).toLocaleDateString()}</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {reminder.time}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 mr-4">
                      <Label htmlFor={`active-${reminder.id}`} className="text-xs text-muted-foreground">Active</Label>
                      <Switch
                        id={`active-${reminder.id}`}
                        checked={reminder.active}
                        onCheckedChange={() => toggleActive(reminder.id)}
                      />
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteReminder(reminder.id)} className="text-red-500 hover:text-red-700 hover:bg-red-100">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Set New Reminder</DialogTitle>
              <DialogDescription>Get notified about your health tasks.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  placeholder="e.g. Take Blood Pressure Meds"
                  value={newReminder.title}
                  onChange={(e) => setNewReminder({ ...newReminder, title: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newReminder.date}
                    onChange={(e) => setNewReminder({ ...newReminder, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Label>Time</Label>
                  <div className="flex gap-2">
                    <Select
                      value={newReminder.time.split(':')[0] || '08'}
                      onValueChange={(val) => {
                        const parts = newReminder.time.split(':');
                        setNewReminder({ ...newReminder, time: `${val}:${parts[1] || '00'}` });
                      }}
                    >
                      <SelectTrigger className="w-[80px]">
                        <SelectValue placeholder="HH" />
                      </SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: 24 }).map((_, i) => (
                          <SelectItem key={i} value={i.toString().padStart(2, '0')}>{i.toString().padStart(2, '0')}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <span className="self-center">:</span>
                    <Select
                      value={newReminder.time.split(':')[1] || '00'}
                      onValueChange={(val) => {
                        const parts = newReminder.time.split(':');
                        setNewReminder({ ...newReminder, time: `${parts[0] || '08'}:${val}` });
                      }}
                    >
                      <SelectTrigger className="w-[80px]">
                        <SelectValue placeholder="MM" />
                      </SelectTrigger>
                      <SelectContent>
                        {['00', '15', '30', '45'].map(m => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
              <Button onClick={addReminder} className="gradient-primary text-white">Save Reminder</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};

export default Reminders;

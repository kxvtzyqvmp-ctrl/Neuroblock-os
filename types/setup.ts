export interface UserDetoxSettings {
  selectedApps: string[];
  dailyLimitMinutes: number;
  activeScheduleType: 'work_hours' | 'evenings' | 'custom';
  activeScheduleStart: string;
  activeScheduleEnd: string;
  pauseDurationSeconds: number;
}

export const POPULAR_APPS = [
  'Instagram',
  'TikTok',
  'YouTube',
  'Snapchat',
  'Facebook',
  'Twitter',
  'Reddit',
  'Netflix',
  'Twitch',
  'WhatsApp',
];

export const DAILY_LIMIT_OPTIONS = [
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '3 hours', value: 180 },
];

export const SCHEDULE_PRESETS = [
  {
    type: 'work_hours' as const,
    label: 'Work Hours',
    description: '9 AM – 5 PM',
    start: '09:00:00',
    end: '17:00:00',
  },
  {
    type: 'evenings' as const,
    label: 'Evenings',
    description: '10 PM – 6 AM',
    start: '22:00:00',
    end: '06:00:00',
  },
  {
    type: 'custom' as const,
    label: 'Custom',
    description: 'Set your own times',
    start: '09:00:00',
    end: '17:00:00',
  },
];

export const PAUSE_OPTIONS = [
  { label: '5 seconds', value: 5 },
  { label: '10 seconds', value: 10 },
  { label: '15 seconds', value: 15 },
];

import { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { saveDetoxSettings } from '@/lib/localStorage';
import { UserDetoxSettings } from '@/types/setup';
import SetupProgress from '@/components/SetupProgress';
import Step1Welcome from '@/components/setup/Step1Welcome';
import Step2SelectApps from '@/components/setup/Step2SelectApps';
import Step3DailyLimit from '@/components/setup/Step3DailyLimit';
import Step4ActiveHours from '@/components/setup/Step4ActiveHours';
import Step5PauseDuration from '@/components/setup/Step5PauseDuration';
import Step6Permissions from '@/components/setup/Step6Permissions';
import AuroraBackground from '@/components/shared/AuroraBackground';

const TOTAL_STEPS = 6;

export default function SetupScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);

  const [userSettings, setUserSettings] = useState<UserDetoxSettings>({
    selectedApps: [],
    dailyLimitMinutes: 60,
    activeScheduleType: 'work_hours',
    activeScheduleStart: '09:00:00',
    activeScheduleEnd: '17:00:00',
    pauseDurationSeconds: 10,
  });

  const handleNext = () => {
    if (currentStep < TOTAL_STEPS) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSelectApp = (app: string) => {
    setUserSettings((prev) => {
      const isSelected = prev.selectedApps.includes(app);
      const newApps = isSelected
        ? prev.selectedApps.filter((a) => a !== app)
        : [...prev.selectedApps, app];

      return { ...prev, selectedApps: newApps };
    });
  };

  const handleSelectLimit = (minutes: number) => {
    setUserSettings((prev) => ({ ...prev, dailyLimitMinutes: minutes }));
  };

  const handleSelectSchedule = (
    type: 'work_hours' | 'evenings' | 'custom',
    start: string,
    end: string
  ) => {
    setUserSettings((prev) => ({
      ...prev,
      activeScheduleType: type,
      activeScheduleStart: start,
      activeScheduleEnd: end,
    }));
  };

  const handleSelectPause = (seconds: number) => {
    setUserSettings((prev) => ({ ...prev, pauseDurationSeconds: seconds }));
  };

  const handleComplete = async () => {
    try {
      // Save settings to local storage (offline-first approach)
      await saveDetoxSettings({
          selected_apps: userSettings.selectedApps,
          daily_limit_minutes: userSettings.dailyLimitMinutes,
          active_schedule_type: userSettings.activeScheduleType,
          active_schedule_start: userSettings.activeScheduleStart,
          active_schedule_end: userSettings.activeScheduleEnd,
          pause_duration_seconds: userSettings.pauseDurationSeconds,
          is_active: true,
      });

      // Navigate to dashboard after successful save
      router.replace('/dashboard');
    } catch (err) {
      console.error('[Setup] Error saving settings:', err);
      // Still navigate to dashboard even on error (graceful degradation)
      router.replace('/dashboard');
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1Welcome onNext={handleNext} />;
      case 2:
        return (
          <Step2SelectApps
            selectedApps={userSettings.selectedApps}
            onSelectApp={handleSelectApp}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <Step3DailyLimit
            dailyLimitMinutes={userSettings.dailyLimitMinutes}
            onSelectLimit={handleSelectLimit}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <Step4ActiveHours
            activeScheduleType={userSettings.activeScheduleType}
            activeScheduleStart={userSettings.activeScheduleStart}
            activeScheduleEnd={userSettings.activeScheduleEnd}
            onSelectSchedule={handleSelectSchedule}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 5:
        return (
          <Step5PauseDuration
            pauseDurationSeconds={userSettings.pauseDurationSeconds}
            onSelectPause={handleSelectPause}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 6:
        return <Step6Permissions onComplete={handleComplete} onBack={handleBack} />;
      default:
        return <Step1Welcome onNext={handleNext} />;
    }
  };

  return (
    <View style={styles.container}>
      <AuroraBackground />
      <SetupProgress currentStep={currentStep} totalSteps={TOTAL_STEPS} />
      {renderStep()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0B0B',
  },
});

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Timer } from 'lucide-react-native';
import { PAUSE_OPTIONS } from '@/types/setup';

interface Step5PauseDurationProps {
  pauseDurationSeconds: number;
  onSelectPause: (seconds: number) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function Step5PauseDuration({
  pauseDurationSeconds,
  onSelectPause,
  onNext,
  onBack,
}: Step5PauseDurationProps) {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Timer color="#7C9DD9" size={40} strokeWidth={1.5} />
        </View>

        <Text style={styles.heading}>Add a mindful pause before opening blocked apps.</Text>

        <Text style={styles.subtext}>
          This helps you reconsider impulsive taps.
        </Text>

        <View style={styles.optionsContainer}>
          {PAUSE_OPTIONS.map((option) => {
            const isSelected = pauseDurationSeconds === option.value;

            return (
              <TouchableOpacity
                key={option.value}
                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                onPress={() => onSelectPause(option.value)}
              >
                <Text style={[styles.optionText, isSelected && styles.optionTextSelected]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.nextButton} onPress={onNext}>
          <Text style={styles.nextButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 32,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  heading: {
    fontSize: 24,
    fontWeight: '600',
    color: '#E8EDF4',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 32,
    paddingHorizontal: 8,
  },
  subtext: {
    fontSize: 15,
    color: '#9BA8BA',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
  optionsContainer: {
    width: '100%',
    gap: 12,
  },
  optionCard: {
    backgroundColor: '#161C26',
    paddingVertical: 18,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#2A3441',
    alignItems: 'center',
  },
  optionCardSelected: {
    backgroundColor: '#7C9DD9',
    borderColor: '#7C9DD9',
  },
  optionText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#E8EDF4',
  },
  optionTextSelected: {
    color: '#0A0E14',
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 24,
  },
  backButton: {
    flex: 1,
    backgroundColor: 'transparent',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A3441',
  },
  backButtonText: {
    fontSize: 17,
    fontWeight: '500',
    color: '#9BA8BA',
  },
  nextButton: {
    flex: 1,
    backgroundColor: '#7C9DD9',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#0A0E14',
  },
});

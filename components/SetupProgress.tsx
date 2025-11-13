import { View, Text, StyleSheet } from 'react-native';

interface SetupProgressProps {
  currentStep: number;
  totalSteps: number;
}

export default function SetupProgress({ currentStep, totalSteps }: SetupProgressProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Step {currentStep} of {totalSteps}
      </Text>
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${(currentStep / totalSteps) * 100}%` },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 32,
    paddingTop: 16,
    paddingBottom: 24,
  },
  text: {
    fontSize: 13,
    color: '#6B7A8F',
    textAlign: 'center',
    marginBottom: 12,
    fontWeight: '500',
  },
  progressBar: {
    height: 3,
    backgroundColor: '#1E2630',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#7C9DD9',
    borderRadius: 2,
  },
});

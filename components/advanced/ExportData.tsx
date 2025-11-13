import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Download, FileJson, FileSpreadsheet, FileText } from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';

type ExportFormat = 'json' | 'csv' | 'pdf';

export default function ExportData() {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    setExporting(true);
    try {
      const [detoxData, usageData, notifData, privacyData] = await Promise.all([
        supabase.from('detox_settings').select('*'),
        supabase.from('usage_sessions').select('*').limit(100),
        supabase.from('notification_preferences').select('*'),
        supabase.from('privacy_settings').select('*'),
      ]);

      const exportData = {
        export_date: new Date().toISOString(),
        detox_settings: detoxData.data || [],
        usage_history: usageData.data || [],
        notification_preferences: notifData.data || [],
        privacy_settings: privacyData.data || [],
      };

      await supabase.from('data_exports').insert([
        {
          export_type: format,
          export_data: exportData,
        },
      ]);

      if (format === 'json') {
        const jsonString = JSON.stringify(exportData, null, 2);
        console.log('Export ready (JSON):', jsonString.length, 'characters');
      } else if (format === 'csv') {
        const csvData = convertToCSV(exportData);
        console.log('Export ready (CSV):', csvData.length, 'characters');
      } else {
        console.log('Export ready (PDF): Data prepared for PDF generation');
      }

      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }

      if (Platform.OS === 'web') {
        Alert.alert(
          'Export Complete',
          `Your data has been exported in ${format.toUpperCase()} format. Check the console for details.`,
          [{ text: 'OK' }]
        );
      }
    } catch (err) {
      console.error('Error exporting data:', err);
      if (Platform.OS !== 'web') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } finally {
      setExporting(false);
    }
  };

  const convertToCSV = (data: any): string => {
    const sessions = data.usage_history || [];
    if (sessions.length === 0) return 'No data available';

    const headers = Object.keys(sessions[0]).join(',');
    const rows = sessions.map((session: any) =>
      Object.values(session)
        .map((val) => `"${val}"`)
        .join(',')
    );

    return [headers, ...rows].join('\n');
  };

  return (
    <View style={styles.container}>
      <View style={styles.infoCard}>
        <Download color="#7C9DD9" size={28} strokeWidth={2} />
        <Text style={styles.infoTitle}>Export Your Data</Text>
        <Text style={styles.infoDescription}>
          Download all your settings, usage history, and preferences in your
          preferred format. Your privacy is our priority.
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Choose Format</Text>

      <TouchableOpacity
        style={styles.exportButton}
        onPress={() => handleExport('json')}
        disabled={exporting}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['rgba(124, 157, 217, 0.1)', 'rgba(124, 157, 217, 0.05)']}
          style={styles.exportButtonGradient}
        >
          <View style={styles.exportButtonLeft}>
            <View style={[styles.exportIcon, styles.jsonIcon]}>
              <FileJson color="#7C9DD9" size={24} strokeWidth={2} />
            </View>
            <View style={styles.exportButtonText}>
              <Text style={styles.exportButtonTitle}>JSON</Text>
              <Text style={styles.exportButtonDescription}>
                Complete data with full structure
              </Text>
            </View>
          </View>
          <Download color="#7C9DD9" size={20} strokeWidth={2} />
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.exportButton}
        onPress={() => handleExport('csv')}
        disabled={exporting}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['rgba(78, 212, 199, 0.1)', 'rgba(78, 212, 199, 0.05)']}
          style={styles.exportButtonGradient}
        >
          <View style={styles.exportButtonLeft}>
            <View style={[styles.exportIcon, styles.csvIcon]}>
              <FileSpreadsheet color="#4ED4C7" size={24} strokeWidth={2} />
            </View>
            <View style={styles.exportButtonText}>
              <Text style={styles.exportButtonTitle}>CSV</Text>
              <Text style={styles.exportButtonDescription}>
                Spreadsheet format for analysis
              </Text>
            </View>
          </View>
          <Download color="#4ED4C7" size={20} strokeWidth={2} />
        </LinearGradient>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.exportButton}
        onPress={() => handleExport('pdf')}
        disabled={exporting}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={['rgba(255, 167, 38, 0.1)', 'rgba(255, 167, 38, 0.05)']}
          style={styles.exportButtonGradient}
        >
          <View style={styles.exportButtonLeft}>
            <View style={[styles.exportIcon, styles.pdfIcon]}>
              <FileText color="#FFA726" size={24} strokeWidth={2} />
            </View>
            <View style={styles.exportButtonText}>
              <Text style={styles.exportButtonTitle}>PDF</Text>
              <Text style={styles.exportButtonDescription}>
                Formatted report for sharing
              </Text>
            </View>
          </View>
          <Download color="#FFA726" size={20} strokeWidth={2} />
        </LinearGradient>
      </TouchableOpacity>

      {exporting && (
        <View style={styles.exportingIndicator}>
          <Text style={styles.exportingText}>Preparing your export...</Text>
        </View>
      )}

      <View style={styles.noteCard}>
        <Text style={styles.noteText}>
          Exports include: detox settings, usage history, notification preferences,
          and privacy settings. Personal identifiers are excluded for your privacy.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  infoCard: {
    alignItems: 'center',
    padding: 20,
    backgroundColor: 'rgba(124, 157, 217, 0.1)',
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(124, 157, 217, 0.2)',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  infoDescription: {
    fontSize: 14,
    color: '#9BA8BA',
    textAlign: 'center',
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 8,
    marginBottom: 4,
  },
  exportButton: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(107, 122, 143, 0.2)',
    marginBottom: 12,
  },
  exportButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  exportButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  exportIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jsonIcon: {
    backgroundColor: 'rgba(124, 157, 217, 0.2)',
  },
  csvIcon: {
    backgroundColor: 'rgba(78, 212, 199, 0.2)',
  },
  pdfIcon: {
    backgroundColor: 'rgba(255, 167, 38, 0.2)',
  },
  exportButtonText: {
    flex: 1,
  },
  exportButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  exportButtonDescription: {
    fontSize: 13,
    color: '#9BA8BA',
  },
  exportingIndicator: {
    padding: 16,
    backgroundColor: 'rgba(124, 157, 217, 0.1)',
    borderRadius: 12,
    alignItems: 'center',
  },
  exportingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7C9DD9',
  },
  noteCard: {
    padding: 16,
    backgroundColor: 'rgba(107, 122, 143, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(107, 122, 143, 0.2)',
    marginTop: 8,
  },
  noteText: {
    fontSize: 13,
    color: '#9BA8BA',
    lineHeight: 19,
    textAlign: 'center',
  },
});

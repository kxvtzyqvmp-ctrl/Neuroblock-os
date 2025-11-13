import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Send, Sparkles } from 'lucide-react-native';
import { generateAIResponse, saveAIConversation } from '@/lib/aiEngine';
import { usePaywall } from '@/hooks/usePaywall';
import PaywallModal from '@/components/subscription/PaywallModal';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export default function AICoachChat() {
  const { canAccessAI, showPaywall, paywallConfig, closePaywall } = usePaywall();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your NeuroBlock OS coach. Ask me about your progress, habits, or how to stay consistent.",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return;

    if (!canAccessAI()) {
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      const response = await generateAIResponse(userMessage.text);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response,
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);

      await saveAIConversation(userMessage.text, response, {
        patterns: 'analyzed',
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error generating response:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble responding right now. Please try again in a moment.",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const suggestedQuestions = [
    'How am I doing this week?',
    "What's my most distracting app?",
    'How can I stay consistent?',
  ];

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={100}
    >
      <ScrollView
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message) => (
          <View
            key={message.id}
            style={[
              styles.messageBubble,
              message.isUser ? styles.userBubble : styles.aiBubble,
            ]}
          >
            {!message.isUser && (
              <View style={styles.aiIcon}>
                <Sparkles color="#7C9DD9" size={16} strokeWidth={2} />
              </View>
            )}
            <Text
              style={[
                styles.messageText,
                message.isUser ? styles.userText : styles.aiText,
              ]}
            >
              {message.text}
            </Text>
          </View>
        ))}

        {isLoading && (
          <View style={[styles.messageBubble, styles.aiBubble, styles.loadingBubble]}>
            <View style={styles.aiIcon}>
              <Sparkles color="#7C9DD9" size={16} strokeWidth={2} />
            </View>
            <ActivityIndicator size="small" color="#7C9DD9" />
          </View>
        )}

        {messages.length === 1 && (
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Try asking:</Text>
            {suggestedQuestions.map((question, index) => (
              <TouchableOpacity
                key={index}
                style={styles.suggestionChip}
                onPress={() => setInputText(question)}
              >
                <Text style={styles.suggestionText}>{question}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask me anything..."
          placeholderTextColor="#6B7A8F"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={200}
          editable={!isLoading}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || isLoading}
        >
          <Send color={!inputText.trim() || isLoading ? '#6B7A8F' : '#7C9DD9'} size={20} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <PaywallModal
        visible={showPaywall}
        onClose={closePaywall}
        feature={paywallConfig.feature}
        message={paywallConfig.message}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    gap: 12,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#7C9DD9',
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#161C26',
    borderBottomLeftRadius: 4,
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    borderColor: '#2A3441',
  },
  loadingBubble: {
    paddingVertical: 16,
  },
  aiIcon: {
    marginTop: 2,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  userText: {
    color: '#0A0E14',
  },
  aiText: {
    color: '#E8EDF4',
    flex: 1,
  },
  suggestionsContainer: {
    marginTop: 16,
    gap: 12,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9BA8BA',
    marginBottom: 4,
  },
  suggestionChip: {
    backgroundColor: '#161C26',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2A3441',
  },
  suggestionText: {
    fontSize: 14,
    color: '#7C9DD9',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    backgroundColor: '#0A0E14',
    borderTopWidth: 1,
    borderTopColor: '#2A3441',
  },
  input: {
    flex: 1,
    backgroundColor: '#161C26',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: '#E8EDF4',
    maxHeight: 100,
    borderWidth: 1,
    borderColor: '#2A3441',
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#161C26',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2A3441',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

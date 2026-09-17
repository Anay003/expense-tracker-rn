import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import {
  ExpenseCategory,
  ExpenseType,
  CATEGORY_DETAILS,
} from '@/types/expense';
import { useTheme } from '@/hooks/use-theme';
import { Spacing } from '@/constants/theme';
import { expenseService } from '@/services/expenseService';

interface AddExpenseModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CATEGORIES: ExpenseCategory[] = [
  'food',
  'transport',
  'shopping',
  'bills',
  'entertainment',
  'salary',
  'investment',
  'health',
  'other',
];

export function AddExpenseModal({
  visible,
  onClose,
  onSuccess,
}: AddExpenseModalProps) {
  const theme = useTheme();

  const [type, setType] = useState<ExpenseType>('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('food');
  const [note, setNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const resetForm = () => {
    setTitle('');
    setAmount('');
    setCategory(type === 'income' ? 'salary' : 'food');
    setNote('');
  };

  const handleTypeChange = (newType: ExpenseType) => {
    setType(newType);
    if (newType === 'income' && category === 'food') {
      setCategory('salary');
    } else if (newType === 'expense' && category === 'salary') {
      setCategory('food');
    }
  };

  const handleSubmit = async () => {
    const trimmedTitle = title.trim();
    const parsedAmount = parseFloat(amount);

    if (!trimmedTitle) {
      Alert.alert('Missing Title', 'Please enter a title for this transaction.');
      return;
    }

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount greater than 0.');
      return;
    }

    setIsSubmitting(true);
    try {
      const today = new Date().toISOString().split('T')[0];
      await expenseService.add({
        title: trimmedTitle,
        amount: parsedAmount,
        type,
        category,
        date: today,
        note: note.trim() || undefined,
      });

      resetForm();
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error('Failed to add transaction', err);
      Alert.alert('Error', 'Failed to save transaction. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View
          style={[
            styles.modalCard,
            {
              backgroundColor: theme.card,
              borderColor: theme.border,
            },
          ]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>
              New Transaction
            </Text>
            <Pressable
              onPress={onClose}
              hitSlop={10}
              style={({ pressed }) => pressed && { opacity: 0.6 }}>
              <Text style={[styles.closeIcon, { color: theme.textSecondary }]}>
                ✕
              </Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}>
            {/* Type Selector (Expense vs Income) */}
            <View
              style={[
                styles.typeToggleContainer,
                { backgroundColor: theme.backgroundElement },
              ]}>
              <Pressable
                style={[
                  styles.typeTab,
                  type === 'expense' && {
                    backgroundColor: theme.expense,
                  },
                ]}
                onPress={() => handleTypeChange('expense')}>
                <Text
                  style={[
                    styles.typeTabText,
                    {
                      color:
                        type === 'expense' ? '#FFFFFF' : theme.textSecondary,
                    },
                  ]}>
                  Expense
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.typeTab,
                  type === 'income' && {
                    backgroundColor: theme.income,
                  },
                ]}
                onPress={() => handleTypeChange('income')}>
                <Text
                  style={[
                    styles.typeTabText,
                    {
                      color:
                        type === 'income' ? '#FFFFFF' : theme.textSecondary,
                    },
                  ]}>
                  Income
                </Text>
              </Pressable>
            </View>

            {/* Amount Input */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              Amount ($)
            </Text>
            <View
              style={[
                styles.amountInputRow,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
              ]}>
              <Text style={[styles.currencyPrefix, { color: theme.text }]}>$</Text>
              <TextInput
                style={[styles.amountInput, { color: theme.text }]}
                placeholder="0.00"
                placeholderTextColor={theme.textSecondary}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            {/* Title Input */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              Title
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              placeholder="e.g. Grocery store, Electric bill, Freelance"
              placeholderTextColor={theme.textSecondary}
              value={title}
              onChangeText={setTitle}
            />

            {/* Category Selector */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              Category
            </Text>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((catKey) => {
                const meta = CATEGORY_DETAILS[catKey];
                const isSelected = category === catKey;

                return (
                  <Pressable
                    key={catKey}
                    onPress={() => setCategory(catKey)}
                    style={[
                      styles.categoryChip,
                      {
                        backgroundColor: isSelected
                          ? meta.color + '22'
                          : theme.backgroundElement,
                        borderColor: isSelected ? meta.color : theme.border,
                      },
                    ]}>
                    <Text style={styles.categoryEmoji}>{meta.emoji}</Text>
                    <Text
                      style={[
                        styles.categoryLabel,
                        {
                          color: isSelected ? meta.color : theme.textSecondary,
                          fontWeight: isSelected ? '700' : '500',
                        },
                      ]}>
                      {meta.label.split(' ')[0]}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Note Input */}
            <Text style={[styles.label, { color: theme.textSecondary }]}>
              Notes (Optional)
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                  color: theme.text,
                },
              ]}
              placeholder="Add additional details or reference"
              placeholderTextColor={theme.textSecondary}
              value={note}
              onChangeText={setNote}
              multiline
            />

            {/* Submit Button */}
            <Pressable
              disabled={isSubmitting}
              onPress={handleSubmit}
              style={({ pressed }) => [
                styles.submitBtn,
                {
                  backgroundColor:
                    type === 'income' ? theme.income : theme.accent,
                },
                pressed && { opacity: 0.8 },
              ]}>
              <Text style={styles.submitBtnText}>
                {isSubmitting ? 'Saving...' : 'Add Transaction'}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  modalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
    paddingBottom: Spacing.six,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeIcon: {
    fontSize: 18,
    fontWeight: '600',
    padding: 4,
  },
  scrollContent: {
    paddingBottom: Spacing.four,
  },
  typeToggleContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: Spacing.three,
  },
  typeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: Spacing.two,
    marginBottom: Spacing.one,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    height: 54,
  },
  currencyPrefix: {
    fontSize: 22,
    fontWeight: '700',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    height: '100%',
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    fontSize: 15,
  },
  textArea: {
    height: 60,
    textAlignVertical: 'top',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 4,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  categoryEmoji: {
    fontSize: 14,
  },
  categoryLabel: {
    fontSize: 12,
  },
  submitBtn: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: Spacing.four,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

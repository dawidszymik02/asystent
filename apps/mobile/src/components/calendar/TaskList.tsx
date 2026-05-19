import { useState, useRef, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, Animated, Modal, Platform, Keyboard,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'react-native';
import { colors } from '../../theme/colors';
import { useTasks } from '../../hooks/useTasks';
import type { Task } from '../../store/taskStore';

interface TaskListProps {
  date: string; // 'yyyy-MM-dd'
}

const TaskList = ({ date }: TaskListProps) => {
  const scheme = useColorScheme() ?? 'dark';
  const theme = colors[scheme];
  const { tasks, createTask, updateTask, deleteTask, toggleComplete } = useTasks();
  const [newTitle, setNewTitle] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const inputRef = useRef<TextInput>(null);
  const [menuTask, setMenuTask] = useState<Task | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [pickerDate, setPickerDate] = useState(new Date());

  const dayTasks = tasks.filter((t) => t.date === date);

  const handleAdd = useCallback(async () => {
    const title = newTitle.trim();
    if (!title) return;
    setNewTitle('');
    try {
      await createTask(title, date);
    } catch (e) {
      Alert.alert('Błąd', 'Nie udało się dodać zadania');
    }
  }, [newTitle, date, createTask]);

  const handleLongPress = useCallback((task: Task) => {
    setMenuTask(task);
  }, []);

  const handleMoveToDate = useCallback(async (task: Task, newDate: string) => {
    setMenuTask(null);
    try {
      await updateTask(task.id, { date: newDate });
    } catch {
      Alert.alert('Błąd', 'Nie udało się przenieść zadania');
    }
  }, [updateTask]);

  const handleSaveEdit = useCallback(async (id: string) => {
    const title = editingTitle.trim();
    if (!title) return;
    try {
      await updateTask(id, { title });
    } catch {
      Alert.alert('Błąd', 'Nie udało się zapisać');
    } finally {
      setEditingId(null);
      setEditingTitle('');
    }
  }, [editingTitle, updateTask]);

  const handleToggle = useCallback(async (task: Task) => {
    try {
      await toggleComplete(task.id);
    } catch {
      Alert.alert('Błąd', 'Nie udało się zaktualizować zadania');
    }
  }, [toggleComplete]);

  return (
    <View style={styles.container}>

      {/* Nagłówek */}
      <View style={styles.header}>
        <Ionicons name="checkmark-circle-outline" size={16} color={theme.textMuted} />
        <Text style={[styles.headerText, { color: theme.textMuted }]}>
          Zadania {dayTasks.length > 0 ? `(${dayTasks.filter(t => t.completed).length}/${dayTasks.length})` : ''}
        </Text>
      </View>

      {/* Lista zadań */}
      {dayTasks.map((task) => (
        <TouchableOpacity
          key={task.id}
          style={[
            styles.taskRow,
            { backgroundColor: task.completed ? theme.surface : theme.background,
              borderColor: theme.border },
          ]}
          onLongPress={() => handleLongPress(task)}
          delayLongPress={400}
          activeOpacity={0.7}
        >
          {/* Checkbox */}
          <TouchableOpacity
            onPress={() => handleToggle(task)}
            style={[styles.checkbox,
              { borderColor: task.completed ? theme.accent : theme.border,
                backgroundColor: task.completed ? theme.accent : 'transparent' }]}
          >
            {task.completed && (
              <Ionicons name="checkmark" size={12} color={theme.background} />
            )}
          </TouchableOpacity>

          {/* Tytuł lub input edycji */}
          {editingId === task.id ? (
            <TextInput
              style={[styles.editInput, { color: theme.text, borderColor: theme.accent }]}
              value={editingTitle}
              onChangeText={setEditingTitle}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => handleSaveEdit(task.id)}
              onBlur={() => handleSaveEdit(task.id)}
            />
          ) : (
            <Text style={[
              styles.taskTitle,
              { color: task.completed ? theme.textMuted : theme.text },
              task.completed && styles.taskTitleDone,
            ]}>
              {task.title}
            </Text>
          )}
        </TouchableOpacity>
      ))}

      {/* Formularz dodawania */}
      <View style={[styles.addRow, { borderColor: theme.border }]}>
        <TextInput
          ref={inputRef}
          style={[styles.addInput, { color: theme.text }]}
          placeholder="Dodaj zadanie..."
          placeholderTextColor={theme.textMuted}
          value={newTitle}
          onChangeText={setNewTitle}
          onSubmitEditing={handleAdd}
          returnKeyType="done"
          blurOnSubmit={false}
        />
        <View
          onTouchStart={() => handleAdd()}
          style={[styles.addBtn,
            { backgroundColor: newTitle.trim() ? theme.accent : theme.surface }]}
        >
          <Ionicons
            name="add"
            size={20}
            color={newTitle.trim() ? theme.background : theme.textMuted}
          />
        </View>
      </View>

      {menuTask && (
        <Modal
          transparent
          animationType="fade"
          visible={!!menuTask}
          onRequestClose={() => setMenuTask(null)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setMenuTask(null)}
          >
            <View style={[styles.menuCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.menuTitle, { color: theme.text }]} numberOfLines={1}>
                {menuTask.title}
              </Text>
              <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

              <TouchableOpacity style={styles.menuItem} onPress={() => {
                setEditingId(menuTask.id);
                setEditingTitle(menuTask.title);
                setMenuTask(null);
              }}>
                <Ionicons name="pencil-outline" size={18} color={theme.text} />
                <Text style={[styles.menuItemText, { color: theme.text }]}>Edytuj tytuł</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => {
                const d = new Date(menuTask.date + 'T12:00:00');
                d.setDate(d.getDate() + 1);
                handleMoveToDate(menuTask, d.toISOString().split('T')[0]);
              }}>
                <Ionicons name="arrow-forward-outline" size={18} color={theme.text} />
                <Text style={[styles.menuItemText, { color: theme.text }]}>Przenieś na jutro</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem} onPress={() => {
                setPickerDate(new Date(menuTask.date + 'T12:00:00'));
                setShowDatePicker(true);
              }}>
                <Ionicons name="calendar-outline" size={18} color={theme.text} />
                <Text style={[styles.menuItemText, { color: theme.text }]}>Przenieś na inną datę</Text>
              </TouchableOpacity>

              <View style={[styles.menuDivider, { backgroundColor: theme.border }]} />

              <TouchableOpacity style={styles.menuItem} onPress={() => {
                const task = menuTask;
                setMenuTask(null);
                Alert.alert('Usuń zadanie', `Usunąć "${task.title}"?`, [
                  { text: 'Anuluj', style: 'cancel' },
                  { text: 'Usuń', style: 'destructive', onPress: () => deleteTask(task.id) },
                ]);
              }}>
                <Ionicons name="trash-outline" size={18} color={theme.error ?? '#EF4444'} />
                <Text style={[styles.menuItemText, { color: theme.error ?? '#EF4444' }]}>Usuń</Text>
              </TouchableOpacity>

              <TouchableOpacity style={[styles.menuItem, styles.menuCancel]}
                onPress={() => setMenuTask(null)}>
                <Text style={[styles.menuItemText, { color: theme.textMuted }]}>Anuluj</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={pickerDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={(_, date) => {
                setShowDatePicker(false);
                if (date && menuTask) {
                  handleMoveToDate(menuTask, date.toISOString().split('T')[0]);
                }
              }}
            />
          )}
        </Modal>
      )}

    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginBottom: 8 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 },
  headerText: { fontSize: 12, fontWeight: '600', letterSpacing: 0.5 },
  taskRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 12, borderBottomWidth: 1, gap: 12 },
  checkbox: { width: 20, height: 20, borderRadius: 10, borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center' },
  taskTitle: { flex: 1, fontSize: 15 },
  taskTitleDone: { textDecorationLine: 'line-through' },
  editInput: { flex: 1, fontSize: 15, borderBottomWidth: 1, paddingVertical: 2 },
  addRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16,
    paddingVertical: 10, borderBottomWidth: 1, gap: 10 },
  addInput: { flex: 1, fontSize: 15 },
  addBtn: { width: 32, height: 32, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  menuCard: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '600',
    padding: 16,
    textAlign: 'center',
  },
  menuDivider: { height: 1 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 16,
  },
  menuItemText: { fontSize: 16 },
  menuCancel: { justifyContent: 'center' },
});

export default TaskList;

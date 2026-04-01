import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useTheme } from '../../theme';
import { fontSize, fontWeight } from '../../constants/theme';

type ToastType = 'success' | 'error' | 'info';
interface ToastMsg { id: number; message: string; type: ToastType; }
interface ToastCtx { showToast: (m: string, t?: ToastType) => void; showError: (m: string) => void; showSuccess: (m: string) => void; }

const ToastContext = createContext<ToastCtx>({ showToast: () => {}, showError: () => {}, showSuccess: () => {} });

let _id = 0;

function ToastItem({ toast, onDone }: { toast: ToastMsg; onDone: (id: number) => void }) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0)).current;
  React.useEffect(() => {
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      Animated.delay(2800),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => onDone(toast.id));
  }, [onDone, opacity, toast.id]);
  const bg = toast.type === 'error' ? colors.statusClosed : toast.type === 'success' ? colors.statusOpen : colors.accent;
  const icon = toast.type === 'error' ? 'x-circle' : toast.type === 'success' ? 'check-circle' : 'info';
  return (
    <Animated.View style={[styles.toast, { backgroundColor: bg, opacity }]}>
      <Feather name={icon} size={17} color={colors.white} />
      <Text style={styles.message} numberOfLines={3}>{toast.message}</Text>
    </Animated.View>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    const id = ++_id;
    setToasts(prev => [...prev, { id, message, type }]);
  }, []);
  const showError = useCallback((m: string) => showToast(m, 'error'), [showToast]);
  const showSuccess = useCallback((m: string) => showToast(m, 'success'), [showToast]);
  const remove = useCallback((id: number) => setToasts(prev => prev.filter(t => t.id !== id)), []);
  return (
    <ToastContext.Provider value={{ showToast, showError, showSuccess }}>
      {children}
      <View style={styles.container}>
        {toasts.map(t => <ToastItem key={t.id} toast={t} onDone={remove} />)}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast() { return useContext(ToastContext); }

const styles = StyleSheet.create({
  container: { position: 'absolute', bottom: 100, left: 16, right: 16, zIndex: 9999, gap: 8, pointerEvents: 'none' },
  toast: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    boxShadow: '0px 2px 6px rgba(0,0,0,0.25)',
    elevation: 8,
    gap: 10,
  },
  message: { color: '#fff', fontSize: fontSize.sm, fontWeight: fontWeight.medium, flex: 1 },
});

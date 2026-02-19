import React, { createContext, useContext, useState, useCallback, useRef, ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Dimensions,
  Modal,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSizes, BorderRadius, Fonts } from '@/constants/theme';

// ═══════════════════════════════════
// Toast Types & Config
// ═══════════════════════════════════

type ToastType = 'success' | 'error' | 'warning' | 'info';

type ToastConfig = {
  icon: string;
  accentColor: string;
  bgGlow: string;
};

const TOAST_CONFIGS: Record<ToastType, ToastConfig> = {
  success: {
    icon: 'check-circle',
    accentColor: '#4CAF50',
    bgGlow: 'rgba(76, 175, 80, 0.15)',
  },
  error: {
    icon: 'close-circle',
    accentColor: '#FF4757',
    bgGlow: 'rgba(255, 71, 87, 0.15)',
  },
  warning: {
    icon: 'alert-circle',
    accentColor: '#FFA502',
    bgGlow: 'rgba(255, 165, 2, 0.15)',
  },
  info: {
    icon: 'information',
    accentColor: Colors.purpleLight,
    bgGlow: 'rgba(156, 39, 176, 0.15)',
  },
};

// ═══════════════════════════════════
// Alert Dialog Types
// ═══════════════════════════════════

type AlertButton = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

type AlertOptions = {
  title: string;
  message: string;
  buttons?: AlertButton[];
  type?: ToastType;
};

// ═══════════════════════════════════
// Context
// ═══════════════════════════════════

type ToastContextType = {
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  showAlert: (options: AlertOptions) => void;
};

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within a ToastProvider');
  return context;
}

// ═══════════════════════════════════
// Toast Component (slides down from top)
// ═══════════════════════════════════

type ToastData = {
  id: number;
  type: ToastType;
  title: string;
  message?: string;
};

function ToastItem({ toast, onDismiss }: { toast: ToastData; onDismiss: (id: number) => void }) {
  const config = TOAST_CONFIGS[toast.type];
  const translateY = useSharedValue(-120);
  const opacity = useSharedValue(0);

  React.useEffect(() => {
    translateY.value = withSpring(0, { damping: 20, stiffness: 200 }); // Faster spring
    opacity.value = withTiming(1, { duration: 200 }); // Faster fade
  }, []);

  const dismiss = useCallback(() => {
    translateY.value = withTiming(-120, { duration: 200 });
    opacity.value = withTiming(0, { duration: 200 }, () => {
      runOnJS(onDismiss)(toast.id);
    });
  }, [toast.id, onDismiss]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.toastContainer, animatedStyle]}>
      <Pressable onPress={dismiss} style={styles.toastInner}>
        {/* Accent bar on left */}
        <View style={[styles.toastAccent, { backgroundColor: config.accentColor }]} />

        <MaterialCommunityIcons
          name={config.icon as any}
          size={24}
          color={config.accentColor}
          style={styles.toastIcon}
        />
        <View style={styles.toastTextContainer}>
          <Text style={styles.toastTitle}>{toast.title}</Text>
          {toast.message ? (
            <Text style={styles.toastMessage}>{toast.message}</Text>
          ) : null}
        </View>
        <MaterialCommunityIcons name="close" size={18} color={Colors.textMuted} />
      </Pressable>
    </Animated.View>
  );
}

// ═══════════════════════════════════
// Custom Alert Dialog
// ═══════════════════════════════════

function AlertDialog({
  visible,
  options,
  onClose,
}: {
  visible: boolean;
  options: AlertOptions | null;
  onClose: () => void;
}) {
  const scale = useSharedValue(0.85);
  const dialogOpacity = useSharedValue(0);

  React.useEffect(() => {
    if (visible) {
      scale.value = withSpring(1, { damping: 15, stiffness: 150 });
      dialogOpacity.value = withTiming(1, { duration: 200 });
    }
  }, [visible]);

  const animatedDialogStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: dialogOpacity.value,
  }));

  if (!visible || !options) return null;

  const config = TOAST_CONFIGS[options.type || 'info'];
  const buttons = options.buttons || [{ text: 'OK', onPress: undefined }];

  const handlePress = (button: AlertButton) => {
    scale.value = withTiming(0.85, { duration: 150 });
    dialogOpacity.value = withTiming(0, { duration: 150 }, () => {
      runOnJS(() => {
        button.onPress?.();
        onClose();
      })();
    });
  };

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <Pressable style={styles.alertOverlay} onPress={() => handlePress({ text: 'dismiss' })}>
        <Animated.View style={[styles.alertDialog, animatedDialogStyle]}>
          <Pressable>
            {/* Icon */}
            <View style={[styles.alertIconContainer, { backgroundColor: config.bgGlow }]}>
              <MaterialCommunityIcons
                name={config.icon as any}
                size={40}
                color={config.accentColor}
              />
            </View>

            {/* Title */}
            <Text style={styles.alertTitle}>{options.title}</Text>
            <Text style={styles.alertMessage}>{options.message}</Text>

            {/* Buttons */}
            <View style={styles.alertButtonRow}>
              {buttons.map((button, index) => {
                const isDestructive = button.style === 'destructive';
                const isCancel = button.style === 'cancel';
                const isPrimary = !isCancel && !isDestructive && index === buttons.length - 1;

                if (isPrimary || isDestructive) {
                  return (
                    <Pressable
                      key={index}
                      style={styles.alertButtonPrimary}
                      onPress={() => handlePress(button)}
                    >
                      <LinearGradient
                        colors={
                          isDestructive
                            ? ['#FF4757', '#FF6B81']
                            : [Colors.gradientStart, Colors.gradientEnd]
                        }
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                        style={styles.alertButtonGradient}
                      >
                        <Text style={styles.alertButtonPrimaryText}>{button.text}</Text>
                      </LinearGradient>
                    </Pressable>
                  );
                }

                return (
                  <Pressable
                    key={index}
                    style={styles.alertButtonSecondary}
                    onPress={() => handlePress(button)}
                  >
                    <Text style={styles.alertButtonSecondaryText}>{button.text}</Text>
                  </Pressable>
                );
              })}
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

// ═══════════════════════════════════
// Provider
// ═══════════════════════════════════

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertOptions, setAlertOptions] = useState<AlertOptions | null>(null);
  const toastIdRef = useRef(0);

  const showToast = useCallback(
    (type: ToastType, title: string, message?: string, duration: number = 3500) => {
      const id = ++toastIdRef.current;
      setToasts((prev) => [...prev, { id, type, title, message }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    },
    []
  );

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showAlert = useCallback((options: AlertOptions) => {
    setAlertOptions(options);
    setAlertVisible(true);
  }, []);

  const closeAlert = useCallback(() => {
    setAlertVisible(false);
    setAlertOptions(null);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, showAlert }}>
      {children}

      {/* Toasts render on top */}
      <View style={styles.toastLayer} pointerEvents="box-none">
        {toasts.map((toast) => (
          <ToastItem key={toast.id} toast={toast} onDismiss={dismissToast} />
        ))}
      </View>

      {/* Alert modal */}
      <AlertDialog visible={alertVisible} options={alertOptions} onClose={closeAlert} />
    </ToastContext.Provider>
  );
}

// ═══════════════════════════════════
// Styles
// ═══════════════════════════════════

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  // Toast styles
  toastLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingTop: 54,
    alignItems: 'center',
  },
  toastContainer: {
    width: width - 32,
    marginBottom: 8,
  },
  toastInner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface, // Solid background
    borderWidth: 1,
    borderColor: 'rgba(156, 39, 176, 0.2)',
    overflow: 'hidden',
    // slight shadow for depth since we removed transparency
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
  },
  toastAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: BorderRadius.lg,
    borderBottomLeftRadius: BorderRadius.lg,
  },
  toastIcon: {
    marginRight: 12,
  },
  toastTextContainer: {
    flex: 1,
  },
  toastTitle: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontFamily: Fonts.bold,
  },
  toastMessage: {
    color: Colors.textSecondary,
    fontSize: FontSizes.xs,
    fontFamily: Fonts.regular,
    marginTop: 2,
    lineHeight: 18,
  },

  // Alert dialog styles
  alertOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  alertDialog: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: Colors.backgroundSecondary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: 'rgba(156, 39, 176, 0.25)',
    alignItems: 'center',
    shadowColor: Colors.purple,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 20,
  },
  alertIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  alertTitle: {
    color: Colors.white,
    fontSize: FontSizes.xl,
    fontFamily: Fonts.bold,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  alertMessage: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    fontFamily: Fonts.regular,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.xl,
  },
  alertButtonRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    width: '100%',
  },
  alertButtonPrimary: {
    flex: 1,
  },
  alertButtonGradient: {
    paddingVertical: 14,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
  },
  alertButtonPrimaryText: {
    color: Colors.white,
    fontSize: FontSizes.md,
    fontFamily: Fonts.bold,
  },
  alertButtonSecondary: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(156, 39, 176, 0.3)',
    alignItems: 'center',
  },
  alertButtonSecondaryText: {
    color: Colors.textSecondary,
    fontSize: FontSizes.md,
    fontFamily: Fonts.semiBold,
  },
});

import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
  StatusBar,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView } from 'expo-camera';
import { useRouter } from 'expo-router';
import { api } from '../src/services/api';
import { spacing, borderRadius, fontSize, fontWeight, type ThemeColors } from '../src/constants/theme';
import { GlassCard } from '../src/components';
import { useI18n } from '../src/i18n';
import { useTheme } from '../src/theme';
import { useAuth } from '../src/auth';
import { requestCameraPermission } from '../src/utils/cameraPermission';

import { getErrorMessage } from '../src/utils/errorMessage';
export default function JoinScreen() {
  const router = useRouter();
  const { translate } = useI18n();
  const { colors } = useTheme();
  const { user } = useAuth();
  const styles = createStyles(colors);

  const [code, setCode] = useState('');
  const [name, setName] = useState(user?.displayName || '');
  const [loading, setLoading] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [scanned, setScanned] = useState(false);

  const handleJoin = async () => {
    const joinCode = code.toUpperCase().trim();
    if (!joinCode) {
      Alert.alert(translate('common.error'), translate('join.noCode'));
      return;
    }
    if (!name.trim()) {
      Alert.alert(translate('common.error'), translate('join.noName'));
      return;
    }

    setLoading(true);
    try {
      await api.getSession(joinCode);
      await api.joinSession(joinCode, {
        userId: user?.id || 'anonymous',
        displayName: name.trim(),
      });
      router.replace(`/session/${joinCode}`);
    } catch (err: unknown) {
      Alert.alert(translate('common.error'), getErrorMessage(err, translate('join.errorJoining')));
    } finally {
      setLoading(false);
    }
  };

  const handleOpenScanner = async () => {
    const granted = await requestCameraPermission();
    if (!granted) {
      Alert.alert(translate('common.error'), translate('join.permissionDenied'));
      return;
    }
    setScanned(false);
    setShowScanner(true);
  };

  const handleBarcodeScan = useCallback(({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);
    setShowScanner(false);

    // Support both raw join code ("VACA-XXXX") and deep link ("https://lavaca.app/join?code=VACA-XXXX")
    let extracted = data.trim().toUpperCase();
    try {
      const url = new URL(data);
      const codeParam = url.searchParams.get('code');
      if (codeParam) extracted = codeParam.toUpperCase();
    } catch {
      // Not a URL, use raw value
    }

    setCode(extracted);
  }, [scanned]);

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <LinearGradient
        colors={['#0f0f23', '#1a1a2e', '#16213e']}
        style={styles.background}
      >
        <View style={styles.content}>
          <Text style={styles.emoji}>🔗</Text>
          <Text style={styles.title}>{translate('join.title')}</Text>
          <Text style={styles.subtitle}>{translate('join.subtitle')}</Text>

          {/* QR Scan button */}
          <TouchableOpacity style={styles.scanButton} onPress={handleOpenScanner} activeOpacity={0.8}>
            <GlassCard style={styles.scanButtonInner}>
              <Text style={styles.scanIcon}>📷</Text>
              <Text style={styles.scanButtonText}>{translate('join.scanQR')}</Text>
            </GlassCard>
          </TouchableOpacity>

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>o</Text>
            <View style={styles.dividerLine} />
          </View>

          <GlassCard style={styles.formCard}>
            <TextInput
              style={styles.codeInput}
              placeholder="VACA-XXXX"
              placeholderTextColor={colors.textMuted}
              value={code}
              onChangeText={(text) => setCode(text.toUpperCase())}
              autoCapitalize="characters"
              autoFocus
              maxLength={9}
            />

            <TextInput
              style={styles.nameInput}
              placeholder={translate('join.yourName')}
              placeholderTextColor={colors.textMuted}
              value={name}
              onChangeText={setName}
            />

            <TouchableOpacity
              style={{ borderRadius: borderRadius.md, overflow: 'hidden', opacity: loading ? 0.6 : 1 }}
              onPress={handleJoin}
              disabled={loading}
            >
              <LinearGradient
                colors={[colors.primary, colors.accent || colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.joinButton}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.joinButtonText}>{translate('join.joinButton')}</Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </GlassCard>
        </View>
      </LinearGradient>

      {/* QR Scanner Modal */}
      <Modal
        visible={showScanner}
        animationType="slide"
        onRequestClose={() => setShowScanner(false)}
        statusBarTranslucent
      >
        <View style={styles.scannerContainer}>
          <StatusBar barStyle="light-content" />
          <CameraView
            style={StyleSheet.absoluteFill}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={scanned ? undefined : handleBarcodeScan}
          />

          {/* Dark overlay outside the scan frame */}
          <View style={styles.scanOverlayTop} />
          <View style={styles.scanOverlayRow}>
            <View style={styles.scanOverlaySide} />
            {/* Corner brackets */}
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTL]} />
              <View style={[styles.corner, styles.cornerTR]} />
              <View style={[styles.corner, styles.cornerBL]} />
              <View style={[styles.corner, styles.cornerBR]} />
            </View>
            <View style={styles.scanOverlaySide} />
          </View>
          <View style={styles.scanOverlayBottom}>
            <Text style={styles.scanHintText}>{translate('join.scanHint')}</Text>
            <TouchableOpacity
              style={styles.cancelScanButton}
              onPress={() => setShowScanner(false)}
            >
              <Text style={styles.cancelScanText}>{translate('common.cancel') ?? 'Cancelar'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const FRAME_SIZE = 240;
const CORNER_SIZE = 28;
const CORNER_THICKNESS = 4;

const createStyles = (colors: ThemeColors) =>
  StyleSheet.create({
    background: {
      flex: 1,
    },
    content: {
      flex: 1,
      padding: spacing.lg,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emoji: {
      fontSize: 56,
      marginBottom: spacing.md,
    },
    title: {
      fontSize: fontSize.xl,
      fontWeight: fontWeight.bold,
      color: '#fff',
      marginBottom: spacing.sm,
    },
    subtitle: {
      fontSize: fontSize.md,
      color: 'rgba(255,255,255,0.65)',
      marginBottom: spacing.xl,
      textAlign: 'center',
    },
    scanButton: {
      width: '100%',
      marginBottom: spacing.lg,
    },
    scanButtonInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.md,
      gap: spacing.sm,
      borderRadius: borderRadius.md,
    },
    scanIcon: { fontSize: 22 },
    scanButtonText: {
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
      color: colors.primary,
    },
    dividerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      width: '100%',
      marginBottom: spacing.lg,
    },
    dividerLine: {
      flex: 1,
      height: 1,
      backgroundColor: 'rgba(255,255,255,0.15)',
    },
    dividerText: {
      color: 'rgba(255,255,255,0.4)',
      fontSize: fontSize.sm,
      marginHorizontal: spacing.md,
    },
    formCard: {
      width: '100%',
      padding: spacing.lg,
      borderRadius: borderRadius.xl,
    },
    codeInput: {
      fontSize: fontSize.xxl,
      fontWeight: fontWeight.bold,
      color: '#fff',
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderRadius: borderRadius.md,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
      textAlign: 'center',
      width: '100%',
      marginBottom: spacing.md,
      letterSpacing: 4,
    },
    nameInput: {
      fontSize: fontSize.md,
      color: '#fff',
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderRadius: borderRadius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
      textAlign: 'center',
      width: '100%',
      marginBottom: spacing.lg,
    },
    joinButton: {
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.xxl,
      borderRadius: borderRadius.md,
      alignItems: 'center',
    },
    joinButtonText: {
      fontSize: fontSize.lg,
      fontWeight: fontWeight.bold,
      color: '#fff',
    },
    // ── Scanner ──────────────────────────────────────────
    scannerContainer: {
      flex: 1,
      backgroundColor: '#000',
    },
    scanOverlayTop: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.65)',
    },
    scanOverlayRow: {
      flexDirection: 'row',
      height: FRAME_SIZE,
    },
    scanOverlaySide: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.65)',
    },
    scanFrame: {
      width: FRAME_SIZE,
      height: FRAME_SIZE,
      position: 'relative',
    },
    corner: {
      position: 'absolute',
      width: CORNER_SIZE,
      height: CORNER_SIZE,
      borderColor: colors.primary,
    },
    cornerTL: {
      top: 0,
      left: 0,
      borderTopWidth: CORNER_THICKNESS,
      borderLeftWidth: CORNER_THICKNESS,
      borderTopLeftRadius: 4,
    },
    cornerTR: {
      top: 0,
      right: 0,
      borderTopWidth: CORNER_THICKNESS,
      borderRightWidth: CORNER_THICKNESS,
      borderTopRightRadius: 4,
    },
    cornerBL: {
      bottom: 0,
      left: 0,
      borderBottomWidth: CORNER_THICKNESS,
      borderLeftWidth: CORNER_THICKNESS,
      borderBottomLeftRadius: 4,
    },
    cornerBR: {
      bottom: 0,
      right: 0,
      borderBottomWidth: CORNER_THICKNESS,
      borderRightWidth: CORNER_THICKNESS,
      borderBottomRightRadius: 4,
    },
    scanOverlayBottom: {
      flex: 1.5,
      backgroundColor: 'rgba(0,0,0,0.65)',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
    },
    scanHintText: {
      color: 'rgba(255,255,255,0.8)',
      fontSize: fontSize.md,
      textAlign: 'center',
      paddingHorizontal: spacing.xl,
    },
    cancelScanButton: {
      backgroundColor: 'rgba(255,255,255,0.12)',
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.sm,
      borderRadius: borderRadius.full,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
    },
    cancelScanText: {
      color: '#fff',
      fontSize: fontSize.md,
      fontWeight: fontWeight.semibold,
    },
  });

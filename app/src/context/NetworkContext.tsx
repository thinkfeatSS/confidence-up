import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/ThemeContext';
import { BorderRadius, Spacing, Typography } from '../theme';
import { setOnNetworkFailure } from '../services/api';

type NetworkContextValue = {
  isOffline: boolean;
  dismissOfflineBanner: () => void;
};

const NetworkContext = createContext<NetworkContextValue>({
  isOffline: false,
  dismissOfflineBanner: () => {},
});

function isOfflineState(state: NetInfoState): boolean {
  // Only consider offline if device is explicitly disconnected from all networks
  if (state.isConnected === false) return true;
  return false;
}

export const NetworkProvider = ({ children }: { children: ReactNode }) => {
  const [isOffline, setIsOffline] = useState(false);
  const [showOfflineBanner, setShowOfflineBanner] = useState(false);
  const [showOnlineToast, setShowOnlineToast] = useState(false);
  const wasOfflineRef = useRef(false);
  /** User dismissed the banner for the current offline session — don't show again until back online */
  const offlineDismissedRef = useRef(false);

  const presentOfflineBanner = useCallback(() => {
    if (!offlineDismissedRef.current) {
      setShowOfflineBanner(true);
    }
  }, []);

  const dismissOfflineBanner = useCallback(() => {
    offlineDismissedRef.current = true;
    setShowOfflineBanner(false);
  }, []);

  const handleOnline = useCallback(() => {
    if (wasOfflineRef.current) {
      wasOfflineRef.current = false;
      offlineDismissedRef.current = false;
      setShowOfflineBanner(false);
      setShowOnlineToast(true);
      setTimeout(() => setShowOnlineToast(false), 3500);
    }
  }, []);

  const handleOffline = useCallback(() => {
    wasOfflineRef.current = true;
    setShowOnlineToast(false);
    presentOfflineBanner();
  }, [presentOfflineBanner]);

  useEffect(() => {
    setOnNetworkFailure(() => {
      NetInfo.fetch().then((state) => {
        if (state.isConnected === false) {
          setIsOffline(true);
          handleOffline();
        }
      }).catch(() => {});
    });
    return () => setOnNetworkFailure(null);
  }, [handleOffline]);

  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    try {
      unsubscribe = NetInfo.addEventListener((state) => {
        const offline = isOfflineState(state);
        setIsOffline(offline);
        if (offline) {
          handleOffline();
        } else {
          handleOnline();
        }
      });

      NetInfo.fetch()
        .then((state) => {
          const offline = isOfflineState(state);
          setIsOffline(offline);
          if (offline) {
            handleOffline();
          }
        })
        .catch(() => {});
    } catch {
      // NetInfo unavailable
    }

    return () => unsubscribe?.();
  }, [handleOffline, handleOnline]);

  const value = useMemo(
    () => ({ isOffline, dismissOfflineBanner }),
    [isOffline, dismissOfflineBanner],
  );

  return (
    <NetworkContext.Provider value={value}>
      {children}
      <NetworkStatusOverlay
        showOffline={showOfflineBanner && isOffline}
        showOnline={showOnlineToast}
        onDismissOffline={dismissOfflineBanner}
      />
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);

type OverlayProps = {
  showOffline: boolean;
  showOnline: boolean;
  onDismissOffline: () => void;
};

const NetworkStatusOverlay = ({ showOffline, showOnline, onDismissOffline }: OverlayProps) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  return (
    <>
      <Modal
        visible={showOffline}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={onDismissOffline}>
        <Pressable style={[styles.modalBackdrop, { backgroundColor: colors.overlayLight }]} onPress={onDismissOffline}>
          <Pressable
            style={[
              styles.offlineCard,
              {
                backgroundColor: colors.bgCard,
                borderColor: colors.border,
                marginBottom: insets.bottom + Spacing.lg,
              },
            ]}
            onPress={(e) => e.stopPropagation()}>
            <Text style={styles.offlineIcon}>📡</Text>
            <Text style={[styles.offlineTitle, { color: colors.textPrimary }]}>No Internet</Text>
            <Text style={[styles.offlineBody, { color: colors.textSecondary }]}>
              Check your connection and try again. You can close this message and retry when you are back online.
            </Text>
            <TouchableOpacity
              style={[styles.dismissBtn, { backgroundColor: colors.accentPurple }]}
              onPress={onDismissOffline}
              activeOpacity={0.85}>
              <Text style={[styles.dismissBtnText, { color: colors.white }]}>Close</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {showOnline && (
        <View
          pointerEvents="none"
          style={[
            styles.onlineToast,
            {
              top: insets.top + Spacing.sm,
              backgroundColor: colors.accentPurple,
            },
          ]}>
          <Text style={[styles.onlineToastText, { color: colors.white }]}>Back online</Text>
        </View>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.lg,
  },
  offlineCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  offlineIcon: { fontSize: 36 },
  offlineTitle: { fontSize: 18, fontWeight: '800' },
  offlineBody: {
    ...(Typography.bodySmall as object),
    textAlign: 'center',
    lineHeight: 20,
  },
  dismissBtn: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
    minWidth: 140,
    alignItems: 'center',
  },
  dismissBtnText: { fontWeight: '700', fontSize: 15 },
  onlineToast: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
    zIndex: 9999,
  },
  onlineToastText: {
    fontWeight: '700',
    fontSize: 13,
  },
});

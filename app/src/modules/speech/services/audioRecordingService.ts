import { Platform, PermissionsAndroid } from 'react-native';

export interface AudioRecordResult {
    filePath: string;
    durationSeconds: number;
    fileSizeBytes?: number;
    mimeType: string;
}

export async function requestAudioRecordingPermissions(): Promise<boolean> {
    if (Platform.OS !== 'android') return true;
    try {
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
                title: 'Microphone Permission',
                message: 'ConfidenceUp needs microphone access to record and analyze your speaking practice.',
                buttonPositive: 'Allow',
            }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
    } catch (e) {
        return false;
    }
}

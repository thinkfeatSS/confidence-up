import { apiClient } from './api';
import { LEGAL_VERSION } from '../constants/links';

export async function acceptLegalDocuments() {
  await Promise.all([
    apiClient.post('/compliance/accept', { documentType: 'TERMS', version: LEGAL_VERSION }),
    apiClient.post('/compliance/accept', { documentType: 'PRIVACY', version: LEGAL_VERSION }),
  ]);
}

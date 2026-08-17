import { useMutation } from '@tanstack/react-query';
import { analyzeSpeech } from '../services/speechAnalysisPipeline';
import { SpeechAnalysisInput } from '../types/speechAnalysis.types';

export function useSpeechAnalysis() {
  return useMutation({
    mutationFn: (input: SpeechAnalysisInput) => analyzeSpeech(input),
  });
}

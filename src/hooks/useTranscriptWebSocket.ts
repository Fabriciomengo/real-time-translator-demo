import { useEffect, useMemo, useRef, useState } from "react";
import { LanguageCode, languageNameMap } from "@/utils/language";
import { translateText } from "@/utils/translate";
import {
    detectLanguageChangeCommand,
    findLanguageInText,
} from "@/utils/language";

interface Word {
    text: string;
    start_time: number;
    end_time: number;
}

interface Transcript {
    speaker: string | null;
    speaker_id: string | null;
    transcription_provider_speaker?: string;
    language: string | null;
    original_transcript_id: number;
    words: Word[];
    is_final: boolean;
}

interface TranscriptMessage {
    bot_id: string;
    transcript: Transcript;
}

interface Utterance {
    id: string;
    speaker: string | null;
    original: string;
    translated: string;
    color?: string;
}

    const RECONNECT_RETRY_INTERVAL_MS = 3000;

export const useTranscriptWebSocket = (wsUrl: string) => {
    const targetLanguageRef = useRef<LanguageCode | undefined>(
        import.meta.env.VITE_DEFAULT_TARGET_LANGUAGE_CODE
    );
    const wsRef = useRef<WebSocket | null>(null);
    const retryIntervalRef = useRef<number | null>(null);

    const [finalizedUtterances, setFinalizedUtterances] = useState<Utterance[]>(
        []
    );
    const [currentUtterance, setCurrentUtterance] = useState<Utterance | null>(
        null
    );

    useEffect(() => {
        const updateFinalizedUtteranceTranslation = (
            utteranceId: string,
            translated: string
        ) => {
            setFinalizedUtterances((prev) =>
                prev.map((item) =>
                    item.id === utteranceId
                        ? {
                              ...item,
                              translated,
                          }
                        : item
                )
            );
        };

        const handleTranscriptMessage = async (event: MessageEvent) => {
            const receivedAt = performance.now();
            const message = JSON.parse(event.data) as TranscriptMessage;
            const transcript = message.transcript;
            const originalText = transcript.words
                .map((word) => word.text)
                .join(" ");

            console.debug("[transcript] WebSocket message received", {
                transcriptId: transcript.original_transcript_id,
                isFinal: transcript.is_final,
                speaker: transcript.speaker,
                wordCount: transcript.words.length,
                characterCount: originalText.length,
            });

            if (!targetLanguageRef.current) {
                const targetLanguage = findLanguageInText(originalText);
                if (targetLanguage) {
                    targetLanguageRef.current = targetLanguage;
                    console.debug("[language] Target language detected", {
                        targetLanguage,
                        languageName: languageNameMap[targetLanguage],
                    });
                }
                return;
            }

            const newLanguage = detectLanguageChangeCommand(originalText);
            if (newLanguage) {
                if (newLanguage !== targetLanguageRef.current) {
                    targetLanguageRef.current = newLanguage;

                    setFinalizedUtterances((prev) => [
                        ...prev,
                        {
                            id: `language-change-${Date.now()}`,
                            speaker: null,
                            original: "",
                            translated: `Now translating to ${languageNameMap[newLanguage]}`,
                            color: "#ff8c00",
                        },
                    ]);
                } else {
                    console.error(`Language not found: ${newLanguage}`);
                }
            }

            const targetLanguage = targetLanguageRef.current;
            const utteranceId = `${transcript.original_transcript_id}-${
                transcript.is_final ? "final" : "current"
            }`;

            // Show the transcript immediately before waiting for translation.
            // The UI already displays "(Translating...)" when translated is empty.
            if (!transcript.is_final) {
                setCurrentUtterance({
                    id: utteranceId,
                    speaker: transcript.speaker,
                    original: originalText,
                    translated: "",
                });
            } else {
                setFinalizedUtterances((prev) => [
                    ...prev,
                    {
                        id: utteranceId,
                        speaker: transcript.speaker,
                        original: originalText,
                        translated: "",
                    },
                ]);
                setCurrentUtterance(null);
            }

            const translationStartedAt = performance.now();

            console.debug("[translation] Started", {
                transcriptId: transcript.original_transcript_id,
                isFinal: transcript.is_final,
                targetLanguage,
                millisecondsSinceMessageReceived: Math.round(
                    translationStartedAt - receivedAt
                ),
            });

            const translated = await translateText(originalText, targetLanguage);

            console.debug("[translation] Finished", {
                transcriptId: transcript.original_transcript_id,
                isFinal: transcript.is_final,
                durationMs: Math.round(performance.now() - translationStartedAt),
                translatedCharacterCount: translated.length,
            });

            if (!transcript.is_final) {
                setCurrentUtterance((prev) => {
                    // Ignore stale translations from older partial transcript messages.
                    if (
                        !prev ||
                        prev.id !== utteranceId ||
                        prev.original !== originalText
                    ) {
                        return prev;
                    }

                    return {
                        ...prev,
                        translated,
                    };
                });
                return;
            }

            updateFinalizedUtteranceTranslation(utteranceId, translated);
        };

        const attemptReconnect = () => {
            if (!retryIntervalRef.current) {
                retryIntervalRef.current = window.setInterval(() => {
                    console.log("Attempting to reconnect to WebSocket...");
                    connectWebSocket();
                }, RECONNECT_RETRY_INTERVAL_MS);
            }
        };

        const connectWebSocket = () => {
            if (wsRef.current) return;

            wsRef.current = new WebSocket(wsUrl);

            wsRef.current.onopen = () => {
                console.log("Connected to WebSocket server");
                if (retryIntervalRef.current) {
                    clearInterval(retryIntervalRef.current);
                    retryIntervalRef.current = null;
                }
            };

            wsRef.current.onmessage = handleTranscriptMessage;

            wsRef.current.onclose = () => {
                console.log("WebSocket closed. Attempting to reconnect...");
                wsRef.current = null;
                attemptReconnect();
            };

            wsRef.current.onerror = (error: Event) => {
                console.error("WebSocket error:", error);
                wsRef.current?.close();
            };
        };

        connectWebSocket();

        return () => {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
            if (retryIntervalRef.current) {
                clearInterval(retryIntervalRef.current);
                retryIntervalRef.current = null;
            }
        };
    }, [wsUrl]);

    // This could get super long for really long conversations.
    // Consider limiting the number of utterances stored.
    const utterances = useMemo(() => {
        if (currentUtterance) {
            return [...finalizedUtterances, currentUtterance];
        }
        return finalizedUtterances;
    }, [finalizedUtterances, currentUtterance]);

    return {
        utterances,
        targetLanguage: targetLanguageRef.current,
    };
};

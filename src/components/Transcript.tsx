import React, { useEffect, useMemo, useRef } from "react";
import { useTranscriptWebSocket } from "@/hooks/useTranscriptWebSocket";
import { languageNameMap } from "@/utils/language";
import "./Transcript.css";

const Transcript: React.FC = () => {
  const { utterances, targetLanguage } = useTranscriptWebSocket(
    "wss://meeting-data.bot.recall.ai/api/v1/transcript"
  );

  const currentLanguage = useMemo(
    () => (targetLanguage ? languageNameMap[targetLanguage] : "None"),
    [targetLanguage]
  );

  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo(0, 0);
    }
  }, [utterances]);

  let lastSpeaker: string | null = null;

  if (targetLanguage === null) {
    return (
      <div className="waiting-message">
        What language would you like to translate to?
      </div>
    );
  }

  return (
    <>
      <div className="transcript-container" ref={containerRef}>
        {!utterances.length ? (
          <div className="waiting-message">
            Start speaking to translate in real-time.
          </div>
        ) : (
          <div className="language-badge">
            Translating to:{" "}
            <span className="language-highlight">
              {currentLanguage}
            </span>
          </div>
        )}
        {utterances
          .slice()
          .reverse()
          .map((item, index) => {
            const isNewSpeaker = item.speaker !== lastSpeaker;
            lastSpeaker = item.speaker;

            return (
              <div key={index} className="transcript-item">
                <div className="speaker-column">
                  {isNewSpeaker && item.speaker
                    ? `${item.speaker}`
                    : ""}
                </div>
                <div className="utterance-column">
                  <div className="translated-text" style={item.color ? { color: item.color } : {}}>
                    {item.translated || "(Translating...)"}
                  </div>
                  <div className="original-text">
                    {item.original}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </>
  );
};

export default Transcript;
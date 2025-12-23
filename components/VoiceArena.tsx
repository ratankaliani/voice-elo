"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface VoiceData {
  id: string;
  voiceId: string;
  name: string;
  elo?: number;
}

interface ScriptData {
  id: string;
  title: string;
  content: string;
  category?: string | null;
}

interface Matchup {
  voiceA: VoiceData;
  voiceB: VoiceData;
  script: ScriptData;
}

type LoadingState = "idle" | "loading-matchup" | "generating-audio" | "ready" | "submitting";

export default function VoiceArena() {
  const [matchup, setMatchup] = useState<Matchup | null>(null);
  const [loadingState, setLoadingState] = useState<LoadingState>("idle");
  const [error, setError] = useState<string | null>(null);
  
  // Audio state
  const [audioA, setAudioA] = useState<string | null>(null);
  const [audioB, setAudioB] = useState<string | null>(null);
  const [playingA, setPlayingA] = useState(false);
  const [playingB, setPlayingB] = useState(false);
  const [progressA, setProgressA] = useState(0);
  const [progressB, setProgressB] = useState(0);
  
  const audioRefA = useRef<HTMLAudioElement>(null);
  const audioRefB = useRef<HTMLAudioElement>(null);

  const generateAudio = async (voiceId: string, text: string): Promise<string> => {
    const response = await fetch("/api/elevenlabs/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voiceId, text }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to generate audio");
    }

    const audioBlob = await response.blob();
    return URL.createObjectURL(audioBlob);
  };

  const loadMatchup = useCallback(async () => {
    setLoadingState("loading-matchup");
    setError(null);
    setAudioA(null);
    setAudioB(null);
    setPlayingA(false);
    setPlayingB(false);
    setProgressA(0);
    setProgressB(0);

    try {
      // Fetch random matchup
      const response = await fetch("/api/matchup");
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || "Failed to load matchup");
      }
      const data: Matchup = await response.json();
      setMatchup(data);

      // Generate audio sequentially to avoid rate limiting
      setLoadingState("generating-audio");
      const urlA = await generateAudio(data.voiceA.voiceId, data.script.content);
      setAudioA(urlA);
      
      const urlB = await generateAudio(data.voiceB.voiceId, data.script.content);
      setAudioB(urlB);
      
      setLoadingState("ready");
    } catch (err: any) {
      console.error("Error loading matchup:", err);
      setError(err.message || "Something went wrong");
      setLoadingState("idle");
    }
  }, []);

  useEffect(() => {
    loadMatchup();
  }, [loadMatchup]);

  // Audio progress tracking
  useEffect(() => {
    const audioA = audioRefA.current;
    const audioB = audioRefB.current;
    
    const updateProgressA = () => {
      if (audioA && audioA.duration) {
        setProgressA((audioA.currentTime / audioA.duration) * 100);
      }
    };
    
    const updateProgressB = () => {
      if (audioB && audioB.duration) {
        setProgressB((audioB.currentTime / audioB.duration) * 100);
      }
    };

    audioA?.addEventListener("timeupdate", updateProgressA);
    audioB?.addEventListener("timeupdate", updateProgressB);

    return () => {
      audioA?.removeEventListener("timeupdate", updateProgressA);
      audioB?.removeEventListener("timeupdate", updateProgressB);
    };
  }, [audioA, audioB]);

  const togglePlayA = () => {
    if (!audioRefA.current) return;
    
    // Stop the other audio
    if (audioRefB.current) {
      audioRefB.current.pause();
      audioRefB.current.currentTime = 0;
      setPlayingB(false);
      setProgressB(0);
    }
    
    if (playingA) {
      audioRefA.current.pause();
      setPlayingA(false);
    } else {
      audioRefA.current.currentTime = 0;
      audioRefA.current.play();
      setPlayingA(true);
    }
  };

  const togglePlayB = () => {
    if (!audioRefB.current) return;
    
    // Stop the other audio
    if (audioRefA.current) {
      audioRefA.current.pause();
      audioRefA.current.currentTime = 0;
      setPlayingA(false);
      setProgressA(0);
    }
    
    if (playingB) {
      audioRefB.current.pause();
      setPlayingB(false);
    } else {
      audioRefB.current.currentTime = 0;
      audioRefB.current.play();
      setPlayingB(true);
    }
  };

  const submitVote = async (winnerId: string | null) => {
    if (!matchup) return;
    
    setLoadingState("submitting");
    
    try {
      await fetch("/api/comparisons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voice1Id: matchup.voiceA.id,
          voice2Id: matchup.voiceB.id,
          scriptId: matchup.script.id,
          winnerId: winnerId === null ? "tie" : winnerId,
        }),
      });
      
      // Load next matchup
      loadMatchup();
    } catch (err) {
      setError("Failed to submit vote");
      setLoadingState("ready");
    }
  };

  // Loading skeleton
  if (loadingState === "loading-matchup" || loadingState === "idle") {
    return (
      <div className="arena-container">
        <div className="loading-state">
          <div className="loading-spinner" />
          <p>Finding your next matchup...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="arena-container">
        <div className="error-state">
          <p>{error}</p>
          <button onClick={loadMatchup} className="retry-btn">
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const isGenerating = loadingState === "generating-audio";
  const isSubmitting = loadingState === "submitting";
  const isReady = loadingState === "ready";

  return (
    <div className="arena-container">
      {/* Hidden audio elements */}
      <audio
        ref={audioRefA}
        src={audioA || undefined}
        onEnded={() => { setPlayingA(false); setProgressA(0); }}
      />
      <audio
        ref={audioRefB}
        src={audioB || undefined}
        onEnded={() => { setPlayingB(false); setProgressB(0); }}
      />

      {/* Script display */}
      {matchup && (
        <div className="script-card">
          <span className="script-category">{matchup.script.category || "Script"}</span>
          <p className="script-content">"{matchup.script.content}"</p>
        </div>
      )}

      {/* Voice cards */}
      <div className="voices-grid">
        {/* Voice A */}
        <button
          className={`voice-card voice-a ${playingA ? "playing" : ""} ${isReady ? "clickable" : ""}`}
          onClick={isReady ? togglePlayA : undefined}
          disabled={!isReady}
        >
          <div className="voice-progress" style={{ width: `${progressA}%` }} />
          <div className="voice-content">
            {isGenerating ? (
              <div className="generating">
                <div className="pulse-ring" />
                <span>Generating...</span>
              </div>
            ) : (
              <>
                <div className="play-icon">
                  {playingA ? (
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </div>
                <span className="voice-label">Voice A</span>
                <span className="voice-hint">{playingA ? "Playing..." : "Click to play"}</span>
              </>
            )}
          </div>
        </button>

        {/* VS divider */}
        <div className="vs-divider">
          <span>VS</span>
        </div>

        {/* Voice B */}
        <button
          className={`voice-card voice-b ${playingB ? "playing" : ""} ${isReady ? "clickable" : ""}`}
          onClick={isReady ? togglePlayB : undefined}
          disabled={!isReady}
        >
          <div className="voice-progress" style={{ width: `${progressB}%` }} />
          <div className="voice-content">
            {isGenerating ? (
              <div className="generating">
                <div className="pulse-ring" />
                <span>Generating...</span>
              </div>
            ) : (
              <>
                <div className="play-icon">
                  {playingB ? (
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <rect x="6" y="4" width="4" height="16" rx="1" />
                      <rect x="14" y="4" width="4" height="16" rx="1" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="currentColor">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </div>
                <span className="voice-label">Voice B</span>
                <span className="voice-hint">{playingB ? "Playing..." : "Click to play"}</span>
              </>
            )}
          </div>
        </button>
      </div>

      {/* Voting buttons */}
      <div className="voting-section">
        <p className="voting-prompt">Which voice sounds better?</p>
        <div className="voting-buttons">
          <button
            className="vote-btn vote-a"
            onClick={() => matchup && submitVote(matchup.voiceA.id)}
            disabled={!isReady || isSubmitting}
          >
            <span className="vote-icon">←</span>
            Voice A
          </button>
          <button
            className="vote-btn vote-neutral"
            onClick={() => submitVote(null)}
            disabled={!isReady || isSubmitting}
          >
            Neutral
          </button>
          <button
            className="vote-btn vote-b"
            onClick={() => matchup && submitVote(matchup.voiceB.id)}
            disabled={!isReady || isSubmitting}
          >
            Voice B
            <span className="vote-icon">→</span>
          </button>
        </div>
        <button
          className="skip-btn"
          onClick={loadMatchup}
          disabled={isSubmitting || isGenerating}
        >
          Skip this matchup →
        </button>
      </div>
    </div>
  );
}


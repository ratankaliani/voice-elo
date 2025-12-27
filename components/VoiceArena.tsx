"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Matchup {
  voiceA: { id: string; voiceId: string; name: string };
  voiceB: { id: string; voiceId: string; name: string };
  script: {
    id: string;
    title: string;
    content: string;
    category?: string | null;
  };
}

type State = "loading" | "generating" | "ready" | "submitting";

export default function VoiceArena() {
  const [matchup, setMatchup] = useState<Matchup | null>(null);
  const [state, setState] = useState<State>("loading");
  const [error, setError] = useState<string | null>(null);
  const [audioA, setAudioA] = useState<string | null>(null);
  const [audioB, setAudioB] = useState<string | null>(null);
  const [playingA, setPlayingA] = useState(false);
  const [playingB, setPlayingB] = useState(false);
  const [progressA, setProgressA] = useState(0);
  const [progressB, setProgressB] = useState(0);

  const refA = useRef<HTMLAudioElement>(null);
  const refB = useRef<HTMLAudioElement>(null);

  const generateAudio = async (voiceId: string, scriptId: string) => {
    const res = await fetch("/api/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ voiceId, scriptId }),
    });
    if (!res.ok) throw new Error("Failed to generate audio");
    return URL.createObjectURL(await res.blob());
  };

  const loadMatchup = useCallback(async () => {
    setState("loading");
    setError(null);
    setAudioA(null);
    setAudioB(null);
    setPlayingA(false);
    setPlayingB(false);
    setProgressA(0);
    setProgressB(0);

    try {
      const res = await fetch("/api/matchup");
      if (!res.ok)
        throw new Error((await res.json()).error || "Failed to load");
      const data = await res.json();
      setMatchup(data);

      setState("generating");
      const [urlA, urlB] = await Promise.all([
        generateAudio(data.voiceA.id, data.script.id),
        generateAudio(data.voiceB.id, data.script.id),
      ]);
      setAudioA(urlA);
      setAudioB(urlB);
      setState("ready");
    } catch (e: any) {
      setError(e.message);
      setState("loading");
    }
  }, []);

  useEffect(() => {
    loadMatchup();
  }, [loadMatchup]);

  useEffect(() => {
    const a = refA.current,
      b = refB.current;
    const updateA = () =>
      a?.duration && setProgressA((a.currentTime / a.duration) * 100);
    const updateB = () =>
      b?.duration && setProgressB((b.currentTime / b.duration) * 100);
    a?.addEventListener("timeupdate", updateA);
    b?.addEventListener("timeupdate", updateB);
    return () => {
      a?.removeEventListener("timeupdate", updateA);
      b?.removeEventListener("timeupdate", updateB);
    };
  }, [audioA, audioB]);

  const play = (which: "A" | "B") => {
    const [ref, setPlaying, otherRef, setOther] =
      which === "A"
        ? [refA, setPlayingA, refB, setPlayingB]
        : [refB, setPlayingB, refA, setPlayingA];

    if (otherRef.current) {
      otherRef.current.pause();
      otherRef.current.currentTime = 0;
      setOther(false);
    }

    if (ref.current) {
      if (which === "A" ? playingA : playingB) {
        ref.current.pause();
        setPlaying(false);
      } else {
        ref.current.currentTime = 0;
        ref.current.play();
        setPlaying(true);
      }
    }
  };

  const vote = async (winnerId: string | null) => {
    if (!matchup) return;
    setState("submitting");
    try {
      await fetch("/api/comparisons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voice1Id: matchup.voiceA.id,
          voice2Id: matchup.voiceB.id,
          scriptId: matchup.script.id,
          winnerId: winnerId ?? "tie",
        }),
      });
      loadMatchup();
    } catch {
      setError("Failed to submit");
      setState("ready");
    }
  };

  if (state === "loading" && !error) {
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

  const ready = state === "ready";
  const generating = state === "generating";

  return (
    <div className="arena-container">
      <audio
        ref={refA}
        src={audioA || undefined}
        onEnded={() => {
          setPlayingA(false);
          setProgressA(0);
        }}
      />
      <audio
        ref={refB}
        src={audioB || undefined}
        onEnded={() => {
          setPlayingB(false);
          setProgressB(0);
        }}
      />

      {matchup && (
        <div className="script-card">
          <span className="script-category">
            {matchup.script.category || "Script"}
          </span>
          <p className="script-content">"{matchup.script.content}"</p>
        </div>
      )}

      <div className="voices-grid">
        <VoiceCard
          label="Voice A"
          variant="a"
          playing={playingA}
          progress={progressA}
          generating={generating}
          ready={ready}
          onClick={() => play("A")}
        />
        <div className="vs-divider">
          <span>VS</span>
        </div>
        <VoiceCard
          label="Voice B"
          variant="b"
          playing={playingB}
          progress={progressB}
          generating={generating}
          ready={ready}
          onClick={() => play("B")}
        />
      </div>

      <div className="voting-section">
        <p className="voting-prompt">Which voice sounds better?</p>
        <div className="voting-buttons">
          <button
            className="vote-btn vote-a"
            onClick={() => matchup && vote(matchup.voiceA.id)}
            disabled={!ready}
          >
            <span className="vote-icon">←</span> Voice A
          </button>
          <button
            className="vote-btn vote-neutral"
            onClick={() => vote(null)}
            disabled={!ready}
          >
            Neutral
          </button>
          <button
            className="vote-btn vote-b"
            onClick={() => matchup && vote(matchup.voiceB.id)}
            disabled={!ready}
          >
            Voice B <span className="vote-icon">→</span>
          </button>
        </div>
        <button
          className="skip-btn"
          onClick={loadMatchup}
          disabled={state === "submitting" || generating}
        >
          Skip this matchup →
        </button>
      </div>
    </div>
  );
}

function VoiceCard({
  label,
  variant,
  playing,
  progress,
  generating,
  ready,
  onClick,
}: {
  label: string;
  variant: "a" | "b";
  playing: boolean;
  progress: number;
  generating: boolean;
  ready: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`voice-card voice-${variant} ${playing ? "playing" : ""} ${
        ready ? "clickable" : ""
      }`}
      onClick={ready ? onClick : undefined}
      disabled={!ready}
    >
      <div className="voice-progress" style={{ width: `${progress}%` }} />
      <div className="voice-content">
        {generating ? (
          <div className="generating">
            <div className="pulse-ring" />
            <span>Generating...</span>
          </div>
        ) : (
          <>
            <div className="play-icon">
              {playing ? (
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
            <span className="voice-label">{label}</span>
            <span className="voice-hint">
              {playing ? "Playing..." : "Click to play"}
            </span>
          </>
        )}
      </div>
    </button>
  );
}

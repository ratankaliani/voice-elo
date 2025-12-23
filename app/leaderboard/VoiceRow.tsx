"use client";

import { useState, useRef } from "react";

interface VoiceRowProps {
  rank: number;
  voiceId: string;
  name: string;
  isActive: boolean;
  score: number;
}

export function VoiceRow({ rank, voiceId, name, isActive, score }: VoiceRowProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  const playSample = async () => {
    if (isLoading) return;

    // If already playing, stop
    if (isPlaying && audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/elevenlabs/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceId,
          text: `Hi, how are you? I'm ${name}!`,
        }),
      });

      if (!response.ok) throw new Error("Failed to generate audio");

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }

      const audio = new Audio(audioUrl);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("Error playing sample:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <tr
      onClick={playSample}
      style={{ cursor: "pointer" }}
      className={`voice-row ${isPlaying ? "playing" : ""} ${isLoading ? "loading" : ""}`}
    >
      <td style={{ fontWeight: 700, fontSize: rank <= 3 ? "1.25rem" : "0.875rem" }}>
        {getRankIcon(rank)}
      </td>
      <td>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span
            className="play-indicator"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: "24px",
              height: "24px",
              borderRadius: "50%",
              background: isPlaying ? "var(--accent)" : isLoading ? "var(--text-muted)" : "var(--bg-tertiary)",
              color: isPlaying || isLoading ? "white" : "var(--text-secondary)",
              fontSize: "10px",
              transition: "all 0.2s ease",
            }}
          >
            {isLoading ? (
              <span className="spinner">⟳</span>
            ) : isPlaying ? (
              "■"
            ) : (
              "▶"
            )}
          </span>
          <div>
            <div style={{ fontWeight: 600 }}>{name}</div>
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              {voiceId}
            </div>
          </div>
        </div>
      </td>
      <td>
        <span className={isActive ? "badge badge-success" : "badge"}>
          {isActive ? "Active" : "Inactive"}
        </span>
      </td>
      <td
        style={{
          textAlign: "right",
          fontWeight: 700,
          fontSize: "1.125rem",
          fontFamily: "'JetBrains Mono', monospace",
        }}
      >
        {score.toFixed(0)}
      </td>
    </tr>
  );
}


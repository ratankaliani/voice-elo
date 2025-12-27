"use client";

import { useState, useRef } from "react";

interface VoiceRowProps {
  rank: number;
  voiceId: string;
  name: string;
  isActive: boolean;
  score: number;
  provider?: string;
}

export function VoiceRow({
  rank,
  voiceId,
  name,
  isActive,
  score,
  provider = "elevenlabs",
}: VoiceRowProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleClick = async () => {
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
      // Use the appropriate endpoint based on provider
      const endpoint =
        provider === "cartesia" ? "/api/cartesia/tts" : "/api/elevenlabs/tts";

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceId,
          text: "Hello! This is a sample of my voice. I hope you enjoy listening to me speak.",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate audio");
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      // Clean up previous audio
      if (audioRef.current) {
        audioRef.current.pause();
        URL.revokeObjectURL(audioRef.current.src);
      }

      const audio = new Audio(url);
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
      };

      audio.onerror = () => {
        setIsPlaying(false);
        setIsLoading(false);
      };

      await audio.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("Error playing voice sample:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getMedalEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return "🥇";
      case 2:
        return "🥈";
      case 3:
        return "🥉";
      default:
        return null;
    }
  };

  const medal = getMedalEmoji(rank);

  return (
    <tr
      className={`voice-row ${isPlaying ? "playing" : ""} ${
        isLoading ? "loading" : ""
      }`}
      onClick={handleClick}
      style={{ cursor: "pointer" }}
    >
      <td
        style={{
          fontWeight: 600,
          color: rank <= 3 ? "var(--accent-a)" : "var(--text-primary)",
        }}
      >
        {medal ? `${medal} ${rank}` : rank}
      </td>
      <td>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span>{name}</span>
          {isLoading && <span className="spinner">⟳</span>}
          {isPlaying && <span style={{ color: "var(--accent-b)" }}>♪</span>}
          <span
            style={{
              fontSize: "0.65rem",
              padding: "2px 6px",
              borderRadius: "4px",
              background:
                provider === "cartesia"
                  ? "rgba(59, 130, 246, 0.15)"
                  : "rgba(147, 51, 234, 0.15)",
              color:
                provider === "cartesia"
                  ? "rgb(96, 165, 250)"
                  : "rgb(192, 132, 252)",
            }}
          >
            {provider === "cartesia" ? "Cartesia" : "11Labs"}
          </span>
        </div>
      </td>
      <td>
        <span className={`badge ${isActive ? "badge-success" : ""}`}>
          {isActive ? "Active" : "Inactive"}
        </span>
      </td>
      <td
        style={{
          textAlign: "right",
          fontFamily: "'JetBrains Mono', monospace",
          fontWeight: 600,
        }}
      >
        {Math.round(score)}
      </td>
    </tr>
  );
}

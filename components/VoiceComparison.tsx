"use client";

import { useState, useRef } from "react";

interface Voice {
  id: string;
  name: string;
  voiceId: string;
  description?: string | null;
}

interface Script {
  id: string;
  title: string;
  content: string;
  category?: string | null;
}

interface VoiceComparisonProps {
  voices: Voice[];
  scripts: Script[];
}

export default function VoiceComparison({ voices, scripts }: VoiceComparisonProps) {
  const [selectedScript, setSelectedScript] = useState<string>(
    scripts[0]?.id || ""
  );
  const [voice1Id, setVoice1Id] = useState<string>("");
  const [voice2Id, setVoice2Id] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Audio state
  const [audio1Url, setAudio1Url] = useState<string | null>(null);
  const [audio2Url, setAudio2Url] = useState<string | null>(null);
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [playing1, setPlaying1] = useState(false);
  const [playing2, setPlaying2] = useState(false);
  
  const audio1Ref = useRef<HTMLAudioElement>(null);
  const audio2Ref = useRef<HTMLAudioElement>(null);

  const currentScript = scripts.find((s) => s.id === selectedScript);
  const voice1 = voices.find((v) => v.id === voice1Id);
  const voice2 = voices.find((v) => v.id === voice2Id);

  const generateAudio = async (
    voiceId: string,
    elevenLabsVoiceId: string,
    text: string,
    setUrl: (url: string | null) => void,
    setLoading: (loading: boolean) => void
  ) => {
    setLoading(true);
    setUrl(null);
    
    try {
      const response = await fetch("/api/elevenlabs/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voiceId: elevenLabsVoiceId,
          text,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate audio");
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      setUrl(audioUrl);
    } catch (error: any) {
      console.error("Error generating audio:", error);
      alert(error.message || "Failed to generate audio. Check your 11Labs API key.");
    } finally {
      setLoading(false);
    }
  };

  const playAudio = (audioRef: React.RefObject<HTMLAudioElement>, setPlaying: (playing: boolean) => void) => {
    if (audioRef.current) {
      audioRef.current.play();
      setPlaying(true);
    }
  };

  const stopAudio = (audioRef: React.RefObject<HTMLAudioElement>, setPlaying: (playing: boolean) => void) => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setPlaying(false);
    }
  };

  const handleComparison = async (winnerId: string) => {
    if (!voice1Id || !voice2Id || !selectedScript) return;

    setIsSubmitting(true);
    try {
      const response = await fetch("/api/comparisons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          voice1Id,
          voice2Id,
          scriptId: selectedScript,
          winnerId,
        }),
      });

      if (response.ok) {
        // Reset selection for next comparison
        setVoice1Id("");
        setVoice2Id("");
        setAudio1Url(null);
        setAudio2Url(null);
        // Optionally reload the page to show updated scores
        window.location.reload();
      } else {
        alert("Failed to record comparison");
      }
    } catch (error) {
      console.error("Error recording comparison:", error);
      alert("Error recording comparison");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset audio when script or voice changes
  const handleScriptChange = (scriptId: string) => {
    setSelectedScript(scriptId);
    setVoice1Id("");
    setVoice2Id("");
    setAudio1Url(null);
    setAudio2Url(null);
  };

  const handleVoice1Change = (id: string) => {
    setVoice1Id(id);
    setAudio1Url(null);
  };

  const handleVoice2Change = (id: string) => {
    setVoice2Id(id);
    setAudio2Url(null);
  };

  return (
    <div className="space-y-6">
      {/* Hidden audio elements */}
      <audio
        ref={audio1Ref}
        src={audio1Url || undefined}
        onEnded={() => setPlaying1(false)}
      />
      <audio
        ref={audio2Ref}
        src={audio2Url || undefined}
        onEnded={() => setPlaying2(false)}
      />

      {/* Script Selection */}
      <div className="bg-white p-6 rounded-lg shadow">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Script
        </label>
        <select
          value={selectedScript}
          onChange={(e) => handleScriptChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          {scripts.map((script) => (
            <option key={script.id} value={script.id}>
              {script.title} {script.category && `(${script.category})`}
            </option>
          ))}
        </select>
        {currentScript && (
          <div className="mt-4 p-4 bg-gray-50 rounded-md">
            <p className="text-gray-700 whitespace-pre-wrap">
              {currentScript.content}
            </p>
          </div>
        )}
      </div>

      {/* Voice Selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Voice 1 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Voice A
          </label>
          <select
            value={voice1Id}
            onChange={(e) => handleVoice1Change(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 mb-4"
          >
            <option value="">Select a voice...</option>
            {voices
              .filter((v) => v.id !== voice2Id)
              .map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name}
                </option>
              ))}
          </select>
          {voice1 && currentScript && (
            <div className="p-4 bg-blue-50 rounded-md">
              <p className="font-medium text-blue-900 mb-3">{voice1.name}</p>
              
              {/* Audio controls */}
              <div className="flex gap-2">
                {!audio1Url ? (
                  <button
                    onClick={() =>
                      generateAudio(
                        voice1.id,
                        voice1.voiceId,
                        currentScript.content,
                        setAudio1Url,
                        setLoading1
                      )
                    }
                    disabled={loading1}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                  >
                    {loading1 ? "Generating..." : "🔊 Generate Audio"}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() =>
                        playing1
                          ? stopAudio(audio1Ref, setPlaying1)
                          : playAudio(audio1Ref, setPlaying1)
                      }
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      {playing1 ? "⏹️ Stop" : "▶️ Play"}
                    </button>
                    <button
                      onClick={() =>
                        generateAudio(
                          voice1.id,
                          voice1.voiceId,
                          currentScript.content,
                          setAudio1Url,
                          setLoading1
                        )
                      }
                      disabled={loading1}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50"
                    >
                      {loading1 ? "..." : "🔄"}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Voice 2 */}
        <div className="bg-white p-6 rounded-lg shadow">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Voice B
          </label>
          <select
            value={voice2Id}
            onChange={(e) => handleVoice2Change(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 mb-4"
          >
            <option value="">Select a voice...</option>
            {voices
              .filter((v) => v.id !== voice1Id)
              .map((voice) => (
                <option key={voice.id} value={voice.id}>
                  {voice.name}
                </option>
              ))}
          </select>
          {voice2 && currentScript && (
            <div className="p-4 bg-green-50 rounded-md">
              <p className="font-medium text-green-900 mb-3">{voice2.name}</p>
              
              {/* Audio controls */}
              <div className="flex gap-2">
                {!audio2Url ? (
                  <button
                    onClick={() =>
                      generateAudio(
                        voice2.id,
                        voice2.voiceId,
                        currentScript.content,
                        setAudio2Url,
                        setLoading2
                      )
                    }
                    disabled={loading2}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                  >
                    {loading2 ? "Generating..." : "🔊 Generate Audio"}
                  </button>
                ) : (
                  <>
                    <button
                      onClick={() =>
                        playing2
                          ? stopAudio(audio2Ref, setPlaying2)
                          : playAudio(audio2Ref, setPlaying2)
                      }
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                    >
                      {playing2 ? "⏹️ Stop" : "▶️ Play"}
                    </button>
                    <button
                      onClick={() =>
                        generateAudio(
                          voice2.id,
                          voice2.voiceId,
                          currentScript.content,
                          setAudio2Url,
                          setLoading2
                        )
                      }
                      disabled={loading2}
                      className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 disabled:opacity-50"
                    >
                      {loading2 ? "..." : "🔄"}
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Comparison Actions */}
      {voice1 && voice2 && audio1Url && audio2Url && (
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-600 mb-4 text-center">
            Which voice sounds better for this script?
          </p>
          <div className="flex gap-4 justify-center">
            <button
              onClick={() => handleComparison(voice1Id)}
              disabled={isSubmitting}
              className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Voice A Wins
            </button>
            <button
              onClick={() => handleComparison(voice2Id)}
              disabled={isSubmitting}
              className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Voice B Wins
            </button>
            <button
              onClick={() => handleComparison("tie")}
              disabled={isSubmitting}
              className="px-6 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              Tie
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

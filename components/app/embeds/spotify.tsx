"use client";

import { useRef, useState, useEffect } from "react";

interface SpotifyEmbedController {
  addListener: (event: string, callback: (e: any) => void) => void;
  removeListener: (event: string) => void;
  play: () => void;
  pause: () => void;
  loadUri: (uri: string) => void;
}

interface SpotifyIframeApi {
  createController: (
    element: HTMLElement | null,
    options: { width: string; height: string; uri: string },
    callback: (controller: SpotifyEmbedController) => void
  ) => void;
}

declare global {
  interface Window {
    onSpotifyIframeApiReady: (IFrameAPI: SpotifyIframeApi) => void;
    SpotifyIframeApi?: SpotifyIframeApi;
  }
}

export default function SpotifyEmbed({ uri }: { uri: string }) {
  const embedRef = useRef<HTMLDivElement>(null);
  const spotifyEmbedControllerRef = useRef<SpotifyEmbedController | null>(null);
  const [iFrameAPI, setIFrameAPI] = useState<SpotifyIframeApi | undefined>(undefined);
  const [playerLoaded, setPlayerLoaded] = useState(false);
  const initializingRef = useRef(false);

  // Load Spotify API script only once globally
  useEffect(() => {
    // Check if script is already loaded
    const existingScript = document.querySelector('script[src="https://open.spotify.com/embed/iframe-api/v1"]');

    if (existingScript) {
      // If script exists and API is ready, use it immediately
      if (window.SpotifyIframeApi) {
        setIFrameAPI(window.SpotifyIframeApi);
      }
      return;
    }

    const script = document.createElement("script");
    script.src = "https://open.spotify.com/embed/iframe-api/v1";
    script.async = true;
    document.body.appendChild(script);

    // Don't remove the script on cleanup - it should persist
  }, []);

  useEffect(() => {
    if (iFrameAPI) {
      return;
    }

    window.onSpotifyIframeApiReady = (SpotifyIframeApi: SpotifyIframeApi) => {
      window.SpotifyIframeApi = SpotifyIframeApi;
      setIFrameAPI(SpotifyIframeApi);
    };
  }, [iFrameAPI]);

  useEffect(() => {
    if (iFrameAPI === undefined || initializingRef.current) {
      return;
    }

    // Reset player loaded state when component mounts
    setPlayerLoaded(false);
    initializingRef.current = true;

    iFrameAPI.createController(
      embedRef.current,
      {
        width: "100%",
        height: "160",
        uri: uri,
      },
      (spotifyEmbedController: SpotifyEmbedController) => {
        spotifyEmbedController.addListener("ready", () => {
          setPlayerLoaded(true);
          initializingRef.current = false;
        });

        const handlePlaybackUpdate = (e: any) => {
          const { position, duration, isBuffering, isPaused, playingURI } =
            e.data;
          console.log(
            `Playback State updates:
              position - ${position},
              duration - ${duration},
              isBuffering - ${isBuffering},
              isPaused - ${isPaused},
              playingURI - ${playingURI},
              duration - ${duration}`
          );
        };

        spotifyEmbedController.addListener(
          "playback_update",
          handlePlaybackUpdate
        );

        spotifyEmbedController.addListener("playback_started", (e: any) => {
          const { playingURI } = e.data;
          console.log(`The playback has started for: ${playingURI}`);
        });

        spotifyEmbedControllerRef.current = spotifyEmbedController;
      }
    );

    return () => {
      // Clean up the controller when component unmounts
      if (spotifyEmbedControllerRef.current) {
        spotifyEmbedControllerRef.current.removeListener("playback_update");
        spotifyEmbedControllerRef.current.removeListener("playback_started");
        spotifyEmbedControllerRef.current.removeListener("ready");
      }
      spotifyEmbedControllerRef.current = null;
      setPlayerLoaded(false);
      initializingRef.current = false;
    };
  }, [iFrameAPI, uri]);

  const onPauseClick = () => {
    if (spotifyEmbedControllerRef.current) {
      spotifyEmbedControllerRef.current.pause();
    }
  };

  const onPlayClick = () => {
    if (spotifyEmbedControllerRef.current) {
      spotifyEmbedControllerRef.current.play();
    }
  };

  return (
    <div className="w-96">
      <div ref={embedRef} />
    </div>
  );
}

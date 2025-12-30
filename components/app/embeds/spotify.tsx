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
    spotifyControllerQueue?: Array<() => void>;
    spotifyControllerInitializing?: boolean;
    spotifyApiReadyCallbacks?: Array<(api: SpotifyIframeApi) => void>;
  }
}

// Global queue to serialize controller creation
const processQueue = () => {
  if (window.spotifyControllerInitializing || !window.spotifyControllerQueue?.length) {
    return;
  }

  window.spotifyControllerInitializing = true;
  const next = window.spotifyControllerQueue.shift();
  if (next) {
    next();
  }
};

export default function SpotifyEmbed({ uri }: { uri: string }) {
  const embedRef = useRef<HTMLDivElement>(null);
  const spotifyEmbedControllerRef = useRef<SpotifyEmbedController | null>(null);
  const [iFrameAPI, setIFrameAPI] = useState<SpotifyIframeApi | undefined>(undefined);
  const [playerLoaded, setPlayerLoaded] = useState(false);
  const queuedRef = useRef(false);

  // Initialize global queue
  useEffect(() => {
    if (!window.spotifyControllerQueue) {
      window.spotifyControllerQueue = [];
      window.spotifyControllerInitializing = false;
    }
    if (!window.spotifyApiReadyCallbacks) {
      window.spotifyApiReadyCallbacks = [];
    }
  }, []);

  // Load Spotify API script only once globally
  useEffect(() => {
    const existingScript = document.querySelector('script[src="https://open.spotify.com/embed/iframe-api/v1"]');

    if (existingScript) {
      if (window.SpotifyIframeApi) {
        setIFrameAPI(window.SpotifyIframeApi);
      }
      return;
    }

    const script = document.createElement("script");
    script.src = "https://open.spotify.com/embed/iframe-api/v1";
    script.async = true;
    document.body.appendChild(script);
  }, []);

  useEffect(() => {
    if (iFrameAPI) {
      return;
    }

    // Set up the global callback once
    if (!window.onSpotifyIframeApiReady) {
      window.onSpotifyIframeApiReady = (SpotifyIframeApi: SpotifyIframeApi) => {
        window.SpotifyIframeApi = SpotifyIframeApi;
        // Call all registered callbacks
        window.spotifyApiReadyCallbacks?.forEach(callback => callback(SpotifyIframeApi));
        // Clear the callbacks array
        window.spotifyApiReadyCallbacks = [];
      };
    }

    // Register this component's callback
    const callback = (api: SpotifyIframeApi) => {
      setIFrameAPI(api);
    };
    window.spotifyApiReadyCallbacks?.push(callback);

    // Cleanup: remove this callback if component unmounts before API is ready
    return () => {
      if (window.spotifyApiReadyCallbacks) {
        const index = window.spotifyApiReadyCallbacks.indexOf(callback);
        if (index > -1) {
          window.spotifyApiReadyCallbacks.splice(index, 1);
        }
      }
    };
  }, [iFrameAPI]);

  useEffect(() => {
    if (iFrameAPI === undefined) {
      return;
    }

    if (queuedRef.current) {
      return;
    }

    setPlayerLoaded(false);
    queuedRef.current = true;

    const createController = () => {
      if (!embedRef.current) {
        window.spotifyControllerInitializing = false;
        processQueue();
        return;
      }

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
            window.spotifyControllerInitializing = false;
            processQueue(); // Process next in queue
          });

          const handlePlaybackUpdate = (e: any) => {
            const { position, duration, isBuffering, isPaused, playingURI } = e.data;
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

          spotifyEmbedController.addListener("playback_update", handlePlaybackUpdate);
          spotifyEmbedController.addListener("playback_started", (e: any) => {
            const { playingURI } = e.data;
            console.log(`The playback has started for: ${playingURI}`);
          });

          spotifyEmbedControllerRef.current = spotifyEmbedController;
        }
      );
    };

    window.spotifyControllerQueue?.push(createController);
    processQueue();

    return () => {
      if (spotifyEmbedControllerRef.current) {
        spotifyEmbedControllerRef.current.removeListener("playback_update");
        spotifyEmbedControllerRef.current.removeListener("playback_started");
        spotifyEmbedControllerRef.current.removeListener("ready");
      }
      spotifyEmbedControllerRef.current = null;
      setPlayerLoaded(false);
      queuedRef.current = false;
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

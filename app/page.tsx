"use client"

import { useCallback, useEffect, useRef, useState, type ChangeEvent } from "react";
import { Button } from "./components/ui/button";
import { useViewer } from "./providers/FrameContextProvider";
import useAnimationFrames from "@/hooks/useAnimationFrames";
import html2canvas from "html2canvas";
import GIF from "gif.js";
import { BaseError, useAccount, useChainId, useConnect, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { wotdayAbi, wotdayAddress } from "@/lib/wotday";
import { base } from "viem/chains";
import utcDateTime from "@/lib/utcDateTime";
import sdk from "@farcaster/frame-sdk";
import { config } from "@/lib/config";
import { Label } from "./components/ui/label";
import { Input } from "./components/ui/input";

export default function Home() {
  const [wordsText, setWordsText] = useState<string>("");
  const [isCastSuccess, setIsCastSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGIFLoading, setIsGIFLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [showMintSuccess, setShowMintSuccess] = useState(false);
  const [isCastLoading, setIsCastLoading] = useState(false);

  const { pfpUrl, username, fid, added } = useViewer();
  const { containerRef, rendererRef, particlesRef } = useAnimationFrames({
    pfpUrl: pfpUrl as string,
  });

  const quoteCardRef = useRef<HTMLDivElement>(null);

  const handleWordsTextChange = (e: ChangeEvent<HTMLInputElement>) => {
    setWordsText(e.target.value);
  };

  const chainId = useChainId();
  const { connect } = useConnect()
  const { isConnected } = useAccount();
  const { data: wordsHash, error: wordsError, isPending: isWordsPending, writeContract: wordsWrite } = useWriteContract();

  const { data: mintPrice } = useReadContract({
    address: wotdayAddress as `0x${string}`,
    abi: wotdayAbi,
    chainId: base.id,
    functionName: "mintPrice",
  });

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: wordsHash,
  });

  // Resize Three.js renderer dynamically
  useEffect(() => {
    const handleResize = () => {
      if (rendererRef.current && containerRef.current) {
        const { offsetWidth, offsetHeight } = containerRef.current;
        rendererRef.current.setSize(offsetWidth, offsetHeight);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize(); // Trigger on mount

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [rendererRef, containerRef]);

  // Basescan
  const linkToBaseScan = useCallback((hash?: string) => {
    if (hash) {
      sdk.actions.openUrl(`https://basescan.org/tx/${hash}`);
    }
  }, []);

  // Subscribe to Frames
  useEffect(() => {
    if (!added) {
      sdk.actions.addFrame()
    }
  }, [added])

  useEffect(() => {
    if (isConfirmed) {
      setShowMintSuccess(true);
    }
  }, [isConfirmed]);

  useEffect(() => {
    if (wordsError) {
      setShowError(true);
    }
  }, [wordsError]);


  const sendWords = async (wordsText: string, embedUrl: string) => {
    if (!wordsText) {
      setError("Words text is required.");
      return;
    }
    setError(null);

    try {
      const message = { wordsText, embedUrl }

      const response = await fetch("/api/create-words", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(message),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to send words.");
      }

      setIsCastSuccess(true);
    } catch (error) {
      setIsCastSuccess(false);
      setError(`Failed to send words. Please try again: ${error}`);
    }
  };

  useEffect(() => {
    if (isConfirmed && isCastSuccess) {
      setWordsText("");
      setIsCastSuccess(false);
    }
  }, [isCastSuccess, isConfirmed]);

  const saveGifImageBlob = async (): Promise<Blob> => {
    if (!quoteCardRef.current || !containerRef.current || !wordsText) {
      return Promise.reject("Missing required elements");
    }

    setIsGIFLoading(true);

    const gif = new GIF({
      workers: 2,
      quality: 10,
      workerScript: "./js/gif.worker.js", // Adjust path if needed
    });

    try {
      const frames = 20; // Number of frames for animation
      const duration = 200; // Delay between frames in milliseconds
      const squareSize = 350; // Fixed square dimension for the GIF output

      for (let i = 0; i < frames; i++) {
        // Rotate particles in the Three.js scene
        if (particlesRef.current) {
          particlesRef.current.rotation.y += 0.01; // Rotate particles
        }

        // Capture Three.js scene to a square canvas
        const threeCanvas = document.createElement("canvas");
        threeCanvas.width = squareSize;
        threeCanvas.height = squareSize;
        const threeContext = threeCanvas.getContext("2d");

        if (threeContext && rendererRef.current) {
          const { offsetWidth, offsetHeight } = containerRef.current!;
          const scale = Math.max(squareSize / offsetWidth, squareSize / offsetHeight); // Fit Three.js scene to square
          const xOffset = (offsetWidth * scale - squareSize) / 2;
          const yOffset = (offsetHeight * scale - squareSize) / 2;

          threeContext.drawImage(
            rendererRef.current.domElement,
            -xOffset,
            -yOffset,
            offsetWidth * scale,
            offsetHeight * scale
          );
        }

        // Capture quote card as a canvas
        const quoteCardCanvas = await html2canvas(quoteCardRef.current, {
          useCORS: true,
          backgroundColor: null, // Transparent background
        });

        // Create the combined canvas
        const combinedCanvas = document.createElement("canvas");
        combinedCanvas.width = squareSize;
        combinedCanvas.height = squareSize;
        const combinedContext = combinedCanvas.getContext("2d");

        if (combinedContext) {
          // Draw the Three.js scene on the square canvas
          combinedContext.drawImage(threeCanvas, 0, 0, squareSize, squareSize);

          // Scale and center the quote card on the square canvas
          const quoteScale = Math.min(
            squareSize / quoteCardCanvas.width,
            squareSize / quoteCardCanvas.height
          ); // Scale to fit inside the square
          const cardWidth = quoteCardCanvas.width * quoteScale;
          const cardHeight = quoteCardCanvas.height * quoteScale;

          const cardX = (squareSize - cardWidth) / 2; // Center horizontally
          const cardY = (squareSize - cardHeight) / 2; // Center vertically

          combinedContext.drawImage(
            quoteCardCanvas,
            cardX,
            cardY,
            cardWidth,
            cardHeight
          );
        }

        // Add the combined frame to the GIF
        gif.addFrame(combinedCanvas, { delay: duration });
      }

      // Render and return the GIF Blob
      return new Promise((resolve) => {
        gif.on("finished", (blob: Blob) => {
          resolve(blob);
        });

        gif.render();
      });
    } catch (error) {
      console.error("Error generating GIF:", error);
      setIsGIFLoading(false);
      return Promise.reject(error);
    }
  };

  const saveGifImageHash = async () => {
    try {
      const blob = await saveGifImageBlob();

      if (blob) {
        // Wrap the Blob with a MIME type (image/gif)
        const gifBlob = new Blob([blob], { type: "image/gif" });

        // Get a timestamp for the filename
        const utcDateTimeString = utcDateTime.getUTCDateTime();
        const formData = new FormData();
        formData.append("file", gifBlob, `wordsoftheday-${utcDateTimeString}.gif`);

        // Make the API request to Pinata
        const response = await fetch("/api/pinata-upload", {
          method: "POST",
          body: formData,
        });

        const data = await response.json();
        if (response.ok) {
          return data.ipfsHash; // Return the IPFS hash
        } else {
          console.error("Something went wrong:", data);
        }
      }

    } catch (err) {
      console.error("Error uploading file:", err);
    }
  };


  const handleMint = async () => {

    try {
      const ipfsImageHash = await saveGifImageHash();

      setIsGIFLoading(false);

      if (ipfsImageHash && wordsText) {
        // Call the mint contract
        wordsWrite({
          abi: wotdayAbi,
          chainId: base.id,
          address: wotdayAddress as `0x${string}`,
          functionName: "mint",
          value: mintPrice,
          args: [wordsText, `ipfs://${ipfsImageHash}`, pfpUrl as string, username as string, String(fid)],
        });

      } else {
        console.error("Failed to mint animation to base");
      }

      setIsCastLoading(true)

      await new Promise((resolve) => setTimeout(resolve, 2000)) // 2 seconds delay
      await sendWords(wordsText, `https://gateway.pinata.cloud/ipfs/${ipfsImageHash}`)

      setIsCastLoading(false)

    } catch (error) {
      console.error("Error during minting or sharing:", (error as Error).message);
    }
  };

  return (
    <main className="relative w-full min-h-screen flex flex-col justify-center items-center space-y-3 bg-[#1a1a1a] text-white">

      {/* Three.js container */}
      <div
        ref={containerRef}
        className="absolute inset-0 w-full h-full z-0"
      />

      {/* Quote Card */}
      {wordsText && (
        <div
          ref={quoteCardRef}
          className="absolute inset-0 mx-auto p-4 z-10 w-full max-w-[90%] md:max-w-[384px] max-h-[384px] rounded-xl flex justify-center items-center overflow-hidden"
        >
          <div className="relative bg-[#230b36fa] backdrop-blur-[10px] text-slate-300 p-6 rounded-2xl shadow-lg text-center">
            <p className="text-sm font-semibold mb-4">{wordsText}</p>
            <p className="italic text-xs text-gray-400">@{username}</p>
          </div>
        </div>
      )}

      {/* Transaction Success */}
      {showMintSuccess && (
        <div
          onClick={() => setShowMintSuccess(false)}
          className="absolute inset-0 mx-auto flex items-center justify-center p-4 z-10 w-full max-w-[90%] md:max-w-[384px] max-h-[384px] rounded-xl"
        >
          <div className="relative bg-[#230b36cc] bg-opacity-25 backdrop-blur-[10px] text-slate-300 p-6 rounded-2xl shadow-lg text-center">
            <p className="text-center text-white p-4">🎉Mint Success🎉</p>
            <button
              className="w-full p-3 rounded-xl bg-gradient-to-r from-[#2f1b3a] to-[#4f2d61] shadow-lg disabled:cursor-not-allowed"
              onClick={() => linkToBaseScan(wordsHash)}
            >
              Proof
            </button>
          </div>
        </div>
      )}

      {/* Transaction Error */}
      {showError && wordsError && (
        <div
          onClick={() => setShowError(false)}
          className="absolute inset-0 mx-auto flex items-center justify-center p-4 z-10 w-full max-w-[90%] md:max-w-[384px] max-h-[384px] rounded-xl"
        >
          <div className="relative bg-[#230b36cc] bg-opacity-25 backdrop-blur-[10px] text-slate-300 p-6 rounded-2xl shadow-lg text-center">
            <p className="text-center text-white p-4">
              Error: {(wordsError as BaseError).shortMessage || wordsError.message}
            </p>
          </div>
        </div>
      )}

      {/* Form Section */}
      <div className="fixed bottom-12 z-50 w-full max-w-[90%] md:max-w-[384px] mx-auto p-2">
        {error && <p className="text-red-500 p-4 text-center text-sm">{error}</p>}
        {wordsText.length > 160 && (
          <p className="text-red-500 p-4 text-center text-sm">Word must be 160 characters or less</p>
        )}
        <div className="relative flex bg-[#181414] rounded-full flex-row shadow-lg">
          <Label htmlFor="wordsText" className="block text-sm font-medium" />
          <Input
            id="wordsText"
            value={wordsText}
            disabled={!isConnected}
            onChange={handleWordsTextChange}
            className="p-4 rounded-l-full"
            placeholder="What's your words?"
          />
          {isConnected && chainId === base.id ? (
            <Button
              onClick={handleMint}
              disabled={
                !isConnected ||
                isGIFLoading ||
                isWordsPending ||
                isConfirming ||
                chainId !== base.id ||
                !wordsText ||
                wordsText.length > 160
              }
              className="w-full p-4 bg-gradient-to-r from-[#36155f] to-[#542173] rounded-r-full"
            >
              {isGIFLoading
                ? "Creating GIF..."
                : isWordsPending
                  ? "Confirming..."
                  : isConfirming
                    ? "Waiting..."
                    : isCastLoading
                      ? "Casting..."
                      : "Mint Words"}
            </Button>
          ) : (
            <Button
              className="w-full p-4 bg-gradient-to-r from-[#36155f] to-[#542173] rounded-r-full"
              onClick={() => connect({ connector: config.connectors[0] })}
            >
              Sign In
            </Button>
          )}
        </div>
      </div>
    </main>

  )
}


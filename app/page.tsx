"use client"

import { useCallback, useEffect, useState, type ChangeEvent } from "react";
import { Button } from "./components/ui/button";
import { useViewer } from "./providers/FrameContextProvider";
import useAnimationFrames from "@/hooks/useAnimationFrames";
import { BaseError, useAccount, useChainId, useConnect, useReadContract, useWaitForTransactionReceipt, useWriteContract } from "wagmi";
import { wotdayAbi, wotdayAddress } from "@/lib/wotday";
import { base } from "viem/chains";
import sdk from "@farcaster/frame-sdk";
import { config } from "@/lib/config";
import { Label } from "./components/ui/label";
import { Textarea } from "./components/ui/textarea";

export default function Home() {
  const [wordsText, setWordsText] = useState<string>("");
  const [isCastSuccess, setIsCastSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const [showMintSuccess, setShowMintSuccess] = useState(false);
  const [isCastLoading, setIsCastLoading] = useState(false);

  const { pfpUrl, username, fid, added } = useViewer();
  const { containerRef } = useAnimationFrames({
    pfpUrl: pfpUrl as string,
  });

  const handleWordsTextChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
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
      // Formatting the message
      const formattedText = `$WORDS of the Day!\n\n"${wordsText}"\n\nMint words, go viral, get rewards\n\n[wotday.xyz]`;
      const message = { wordsText: formattedText, embedUrl }

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

  const handleMint = async () => {

    try {
      // Call the mint contract
      wordsWrite({
        abi: wotdayAbi,
        chainId: base.id,
        address: wotdayAddress as `0x${string}`,
        functionName: "mint",
        value: mintPrice,
        args: [wordsText, "ipfs://bafkreibpfoxm2b22agpyxwhppm2lt2lvfxmwcxqkcmssnyjlhbtlapqvk4", pfpUrl as string, username as string, String(fid)],
      });

      setIsCastLoading(true)

      await new Promise((resolve) => setTimeout(resolve, 2000)) // 2 seconds delay
      await sendWords(wordsText, `https://wotday.xyz`)

      setIsCastLoading(false)

    } catch (error) {
      console.error("Error during minting or sharing:", (error as Error).message);
    }
  };

  return (
    <main className="relative flex justify-center items-center w-full min-h-screen">

      {/* Three.js container */}
      <div
        ref={containerRef}
        className="absolute inset-0 z-0"
      />

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
        <div className="relative flex bg-[#181414] rounded-2xl p-4 flex-col space-y-3 shadow-lg">
          <Label htmlFor="wordsText" className="block text-sm font-medium" />
          <Textarea
            id="wordsText"
            value={wordsText}
            disabled={!isConnected}
            onChange={handleWordsTextChange}
            className="p-4 bg-[#1d1c1c] text-sm rounded-xl"
            placeholder="What's your words?"
            rows={4}
          />
          {isConnected && chainId === base.id ? (
            <Button
              onClick={handleMint}
              disabled={
                !isConnected ||
                isWordsPending ||
                isConfirming ||
                chainId !== base.id ||
                !wordsText ||
                wordsText.length > 160
              }
              className="w-full p-4 bg-gradient-to-r from-[#36155f] to-[#542173] rounded-xl"
            >
              {isWordsPending
                ? "Confirming..."
                : isConfirming
                  ? "Waiting..."
                  : isCastLoading
                    ? "Casting..."
                    : "Mint Words"}
            </Button>
          ) : (
            <Button
              className="w-full p-4 bg-gradient-to-r from-[#36155f] to-[#542173] rounded-xl"
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

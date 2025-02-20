"use client";

import { useReadContract } from "wagmi";
import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { wotdayAbi, wotdayAddress } from "@/lib/wotday";
import { base } from "viem/chains";

// Helper to decode Base64 tokenURI and extract the animation_url
const decodeTokenURI = (base64Uri: string) => {
  try {
    const json = JSON.parse(atob(base64Uri.split(",")[1]));
    return {
      animation_url: json.animation_url || "",
    };
  } catch (error) {
    console.error("Error decoding Base64 tokenURI:", error);
    return { animation_url: "" };
  }
};

export default function WotDayWeb() {
  const [animationURIs, setAnimationURIs] = useState("");
  const [tokenId, setTokenId] = useState<number>(1);
  const [maxTokenId, setMaxTokenId] = useState<number>(1);

  const { data: tokenURIData } = useReadContract({
    address: wotdayAddress as `0x${string}`,
    abi: wotdayAbi,
    chainId: base.id,
    functionName: "tokenURI",
    args: [BigInt(tokenId)],
  });

  const { data: totalSupply } = useReadContract({
    address: wotdayAddress as `0x${string}`,
    abi: wotdayAbi,
    chainId: base.id,
    functionName: "totalSupply",
  });

  useEffect(() => {
    if (totalSupply) {
      setMaxTokenId(Number(totalSupply));
    }
  }, [totalSupply]);

  useEffect(() => {
    if (tokenURIData) {
      const { animation_url } = decodeTokenURI(tokenURIData);
      setAnimationURIs(animation_url);
    }
  }, [tokenURIData]);

  const handlePrev = () => {
    setTokenId((prev) => (prev > 1 ? prev - 1 : prev));
  };

  const handleNext = () => {
    setTokenId((prev) => (prev < maxTokenId ? prev + 1 : prev));
  };

  return (
    <main className="w-full bg-[#1d1429e3] min-h-screen bg-[radial-gradient(#290f51_1px,transparent_1px)] [background-size:16px_16px] flex flex-col items-center justify-center">
      {/* Words of the Day detail */}
      <div className="relative w-full h-full flex items-center justify-center">
        {animationURIs ? (
          <iframe
            src={animationURIs}
            allow="clipboard-write"
            className="w-full h-screen"
            allowFullScreen
          ></iframe>
        ) : (
          <div className="absolute inset-0 flex max-w-[300px] mx-auto justify-center items-center text-gray-500 text-center">
            No Words of the Day minted yet!
          </div>
        )}
      </div>

      {/* Navigation Arrows and Link */}
      <div className="absolute bottom-8 flex justify-between w-full px-4 items-center">
        {/* Left Arrow */}
        <button
          onClick={handlePrev}
          className="bg-gray-700 hover:bg-gray-600 text-white rounded-full p-2"
          disabled={tokenId <= 1}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        {/* Link to Original Animation */}
        {animationURIs && (
          <a
            href={animationURIs}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white bg-gray-700 hover:bg-gray-600 rounded-full p-2 flex items-center space-x-2"
          >
            <ExternalLink className="w-5 h-5" />
            <span>Decentralized Version</span>
          </a>
        )}

        {/* Right Arrow */}
        <button
          onClick={handleNext}
          className="bg-gray-700 hover:bg-gray-600 text-white rounded-full p-2"
          disabled={tokenId >= maxTokenId}
        >
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>
    </main>
  );
}

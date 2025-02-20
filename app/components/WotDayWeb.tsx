"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ExternalLink } from "lucide-react";
import { wotdayAbi, wotdayAddress } from "@/lib/wotday";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import Loading from "./svg/Loading";

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
  const [animationURIs, setAnimationURIs] = useState<string>("");
  const [tokenId, setTokenId] = useState<number>(1);
  const [maxTokenId, setMaxTokenId] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const publicClient = createPublicClient({
    chain: base,
    transport: http(),
  });

  // Fetch the total supply from the contract
  const fetchTotalSupply = async () => {
    try {
      const totalSupply = await publicClient.readContract({
        address: wotdayAddress as `0x${string}`,
        abi: wotdayAbi,
        functionName: "totalSupply",
      });

      setMaxTokenId(Number(totalSupply));
    } catch (error) {
      console.error("Error fetching total supply:", error);
    }
  };

  // Fetch the animation URL for the current tokenId
  const fetchAnimationURL = async (tokenId: number) => {
    try {
      setIsLoading(true);
      const tokenURI = await publicClient.readContract({
        address: wotdayAddress as `0x${string}`,
        abi: wotdayAbi,
        functionName: "tokenURI",
        args: [BigInt(tokenId)],
      });
      // Decode the tokenURI to extract the animation_url
      const { animation_url } = decodeTokenURI(tokenURI);
      setAnimationURIs(animation_url);
    } catch (error) {
      console.error("Error fetching animation URL:", error);
      setAnimationURIs("");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch total supply and the first token's animation URL on component mount
  useEffect(() => {
    fetchTotalSupply();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch animation URL whenever tokenId changes
  useEffect(() => {
    fetchAnimationURL(tokenId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenId]);

  // Handlers for navigating between tokens
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
        {isLoading ? (
          <div className="absolute inset-0 flex max-w-[300px] mx-auto justify-center items-center text-gray-500 text-center">
            <div className="absolute animate-spin rounded-full h-32 w-32 border-t-4 border-b-4 border-purple-500"></div>
            <Loading className="rounded-full h-28 w-28" />
          </div>
        ) : animationURIs ? (
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
            className="text-white bg-gray-700 hover:bg-gray-600 rounded-full px-4 py-2 flex items-center space-x-2"
          >
            <ExternalLink className="w-5 h-5" />
            <span>View Original</span>
          </a>
        )}

        {/* Right Arrow */}
        <button
          onClick={handleNext}
          className="bg-gray-700 disabled:hidden hover:bg-gray-600 text-white rounded-full p-2"
          disabled={tokenId >= maxTokenId}
        >
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>
    </main>
  );
}

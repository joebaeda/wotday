"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, ExternalLink, Search } from "lucide-react";
import { wotdayAbi, wotdayAddress } from "@/lib/wotday";
import { createPublicClient, http } from "viem";
import { base } from "viem/chains";
import Loading from "./svg/Loading";

// Helper to decode Base64 tokenURI and extract the animation_url
const decodeTokenURI = (base64Uri: string) => {
  try {
    const json = JSON.parse(atob(base64Uri.split(",")[1]));
    return {
      words: json.words || '',
      animation_url: json.animation_url || "",
      author: json.attributes?.find(
        (attr: { trait_type: string }) => attr.trait_type === 'Author'
      )?.value || '',
      authorFid: json.attributes?.find(
        (attr: { trait_type: string }) => attr.trait_type === 'Farcaster ID'
      )?.value || '',
    };
  } catch (error) {
    console.error("Error decoding Base64 tokenURI:", error);
    return { words: "", animation_url: "", author: "", authorFid: "" };
  }
};

export default function WotDay() {
  const [animationURIs, setAnimationURIs] = useState<string>("");
  const [wordsAuthor, setWordsAuthor] = useState<string>("");
  const [authorPFP, setAuthorPFP] = useState<string>("");
  const [tokenId, setTokenId] = useState<number>(1);
  const [maxTokenId, setMaxTokenId] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSearchLoading, setIsSearchLoading] = useState<boolean>(false);

  // Search-related states
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<
    { tokenId: number; words: string; authorFid: string; }[]
  >([]);
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);

  // Fetch Farcaster profile picture
  useEffect(() => {
    if (searchResults.length > 0 && searchResults[0].authorFid) {
      async function fetchProfilePicture() {
        try {
          const res = await fetch(`/api/${searchResults[0].authorFid}`);
          if (!res.ok) {
            throw new Error(`Failed to fetch user data: ${res.statusText}`);
          }
          const userData = await res.json();
          setAuthorPFP(userData.pfp);
        } catch (err) {
          console.error("Error fetching user PFP:", err);
          setAuthorPFP(""); // Reset if fetch fails
        }
      }
      fetchProfilePicture();
    }
  }, [searchResults]); // Runs when searchResults update

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

  const handleSearch = async () => {
    setIsSearchOpen(true);
    setIsSearchLoading(true);

    // Normalize the query: ensure it starts with "@"
    const normalizedQuery = searchQuery.startsWith("@")
      ? searchQuery.toLowerCase()
      : `@${searchQuery.toLowerCase()}`;

    const results: { tokenId: number; words: string; authorFid: string; }[] = [];

    for (let id = 1; id <= maxTokenId; id++) {
      try {
        const tokenURI = await publicClient.readContract({
          address: wotdayAddress as `0x${string}`,
          abi: wotdayAbi,
          functionName: "tokenURI",
          args: [BigInt(id)],
        });

        const { words, author, authorFid } = decodeTokenURI(tokenURI);

        if (author.toLowerCase().includes(normalizedQuery)) {
          results.push({ tokenId: id, words, authorFid });
        }
      } catch (error) {
        console.error(`Error fetching tokenURI for token ${id}:`, error);
      }
    }
    setWordsAuthor(normalizedQuery);
    setSearchResults(results);
    setIsSearchLoading(false);
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
      {/* Top Navigation Arrows and Link */}
      <div className="fixed z-10 top-0 flex bg-[#1a0924] justify-between w-full p-4 items-center">
        {/* Left Arrow */}
        <button
          onClick={handlePrev}
          className="text-white p-2"
          disabled={tokenId <= 1}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        {/* Search Form */}
        <div className="relative flex items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="By Farcaster Username"
            className="relative w-full p-4 focus:outline-none rounded-full bg-gray-800 text-white"
          />
          <button
            onClick={handleSearch}
            className="absolute text-white right-2 flex items-center z-20"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>

        {/* Right Arrow */}
        <button
          onClick={handleNext}
          className="disabled:hidden text-white p-2"
          disabled={tokenId >= maxTokenId}
        >
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>

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

      {/* Bottom Navigation Arrows and Link */}
      <div className="fixed bottom-0 bg-[#1a0924] flex justify-between w-full p-4 items-center">
        {/* Left Arrow */}
        <button
          onClick={handlePrev}
          className="text-white p-2"
          disabled={tokenId <= 1}
        >
          <ArrowLeft className="w-6 h-6" />
        </button>

        {/* Link to Original Animation and Link to Opensea */}
        <div className="flex flex-row bg-gray-800 rounded-full justify-center items-center space-x-0">
          {animationURIs && (
            <a
              href={animationURIs}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full p-4 text-white hover:bg-gray-600 hover:rounded-l-full flex items-center space-x-2"
            >
              <ExternalLink className="w-5 h-5" />
              <span>Origin</span>
            </a>
          )}

          {animationURIs && (
            <a
              href={`https://opensea.io/item/base/0xb3f984a254fcb627ea04420837d37cee37d09ce8/${tokenId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full p-4 text-white hover:bg-gray-600 hover:rounded-r-full flex items-center space-x-2"
            >
              <ExternalLink className="w-5 h-5" />
              <span>Collect</span>
            </a>
          )}
        </div>

        {/* Right Arrow */}
        <button
          onClick={handleNext}
          className="disabled:hidden text-white p-2"
          disabled={tokenId >= maxTokenId}
        >
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>

      {/* Search Results Popup */}
      {isSearchOpen && (
        <div className="absolute p-4 md:p-0 w-full h-full top-0 left-0 backdrop-blur-md flex items-center justify-center z-20">
          <div className="relative p-4 bg-[#221a25] rounded-2xl shadow-lg w-full mx-auto md:max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex flex-row my-3 justify-between items-center">

              {/* Title */}
              <h2 className="text-xl p-2 font-semibold text-white">
                Words by <span className="text-purple-400">{wordsAuthor || "Author"}</span>
              </h2>

              {/* Close Button */}
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-4 rounded-full bg-gray-600 hover:bg-gray-500"
              >
                Close
              </button>

            </div>

            {/* Loading Effect */}
            {isSearchLoading ? (
              <div className="flex justify-center items-center py-10">
                <div className="relative">
                  <div className="absolute animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-purple-500"></div>
                  <Loading className="rounded-full h-14 w-14" />
                </div>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {searchResults.map(({ tokenId, words }) => (
                  <div
                    key={tokenId}
                    className="relative flex flex-row space-x-3 justify-between items-center bg-[#35193f] p-4 rounded-xl shadow-md hover:scale-105 transition-transform overflow-hidden"
                  >
                    {/* Background Image (Author PFP) */}
                    <div
                      className="absolute inset-0 w-40 h-40 rounded-2xl bg-cover bg-center rotate-[-15deg] opacity-30"
                      style={{ backgroundImage: `url(${authorPFP || "/wotday-logo.jpeg"})` }}
                    ></div>

                    {/* Main Content */}
                    <p className="text-white text-sm z-10">{words} - {wordsAuthor}</p>

                    {/* Navigation Button */}
                    <button
                      onClick={() => {
                        setTokenId(tokenId);
                        setIsSearchOpen(false);
                      }}
                      className="text-white p-2 z-10"
                    >
                      <ArrowRight className="w-6 h-6" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-white text-center">No results found for &quot;{searchQuery}&quot;</p>
            )}
          </div>
        </div>
      )}



    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
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

interface WordsByUserProps {
    userAddress: string;
}

export default function WordsByUser({ userAddress }: WordsByUserProps) {
    const [animationURIs, setAnimationURIs] = useState<string[]>([]);
    const [currentIndex, setCurrentIndex] = useState<number>(0);
    const [isLoading, setIsLoading] = useState<boolean>(true);

    const publicClient = createPublicClient({
        chain: base,
        transport: http(),
    });

    useEffect(() => {
        const fetchUserTokens = async () => {
            try {
                setIsLoading(true);

                // Fetch total supply (if available)
                const totalSupply = await publicClient.readContract({
                    address: wotdayAddress as `0x${string}`,
                    abi: wotdayAbi,
                    functionName: "totalSupply",
                });
                const totalSupplyNum = Number(totalSupply);

                // Find tokens owned by user
                const ownedTokenURIs: string[] = [];
                for (let tokenId = 1; tokenId <= totalSupplyNum; tokenId++) {
                    try {
                        const owner = await publicClient.readContract({
                            address: wotdayAddress as `0x${string}`,
                            abi: wotdayAbi,
                            functionName: "ownerOf",
                            args: [BigInt(tokenId)],
                        });

                        if (owner.toLowerCase() === userAddress.toLowerCase()) {
                            const tokenURI = await publicClient.readContract({
                                address: wotdayAddress as `0x${string}`,
                                abi: wotdayAbi,
                                functionName: "tokenURI",
                                args: [BigInt(tokenId)],
                            });

                            ownedTokenURIs.push(decodeTokenURI(tokenURI).animation_url);
                        }
                    } catch (error) {
                        console.error(`Error checking owner for token ${tokenId}:`, error);
                    }
                }

                setAnimationURIs(ownedTokenURIs);
            } catch (error) {
                console.error("Error fetching user tokens:", error);
            } finally {
                setIsLoading(false);
            }
        };

        if (userAddress) fetchUserTokens();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userAddress]);

    return (
        <div className="absolute z-10">
            <div className="relative w-full flex items-center justify-center">
                {isLoading ? (
                    <div className="absolute inset-0 flex justify-center items-center">
                        <Loading />
                    </div>
                ) : animationURIs.length > 0 ? (
                    <iframe
                        src={animationURIs[currentIndex]}
                        allow="clipboard-write"
                        className="w-full h-screen"
                        allowFullScreen
                    ></iframe>
                ) : (
                    <div className="absolute inset-0 flex justify-center items-center text-gray-500">
                        No Words of the Day minted yet!
                    </div>
                )}
            </div>

            {/* Pagination Controls */}
            {animationURIs.length > 1 && (
                <div className="fixed z-30 inset-0 flex justify-between w-full p-4 items-center">
                    <button
                        onClick={() => setCurrentIndex((prev) => Math.max(prev - 1, 0))}
                        className="text-white p-2"
                        disabled={currentIndex === 0}
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <button
                        onClick={() =>
                            setCurrentIndex((prev) => Math.min(prev + 1, animationURIs.length - 1))
                        }
                        className="text-white p-2"
                        disabled={currentIndex === animationURIs.length - 1}
                    >
                        <ArrowRight className="w-6 h-6" />
                    </button>
                </div>
            )}
        </div>
    );
}

"use client";

import { useReadContract } from "wagmi";
import { use, useCallback, useEffect, useState } from "react";
import sdk from '@farcaster/frame-sdk';
import { ArrowBigLeft } from "lucide-react";
import { wotdayAbi, wotdayAddress } from "@/lib/wotday";

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


export default function TokenDetails({
    params,
}: {
    params: Promise<{ tokenId: string }>
}) {
    const { tokenId } = use(params)
    const [animationURIs, setAnimationURIs] = useState<string>("");
    const [authorFID, setAuthorFID] = useState<number>();
    const [authorName, setAuthorName] = useState<string>("");

    const { data: tokenURIData } = useReadContract({
        address: wotdayAddress as `0x${string}`,
        abi: wotdayAbi,
        functionName: "tokenURI",
        args: [BigInt(tokenId)],
    });

    const viewAuthorProfile = useCallback((fid?: number) => {
        if (fid) {
            sdk.actions.viewProfile({ fid });
        }
    }, [])

    useEffect(() => {
        if (tokenURIData) {
            const { animation_url, authorFid, author } = decodeTokenURI(tokenURIData);
            setAnimationURIs(animation_url);
            setAuthorFID(authorFid);
            setAuthorName(author);
        }
    }, [tokenURIData]);

    const closeFrame = () => {
        sdk.actions.close()
    };

    return (
        <main className="sm:min-h-screen bg-gray-50 min-h-[695px] bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px]">

            {/* Header section */}
            <div className="w-full bg-[#4f2d61] p-3 rounded-b-2xl flex flex-row justify-between">

                {/* Back */}
                <button
                    onClick={closeFrame}
                    className="disabled:opacity-50"
                >
                    <ArrowBigLeft className="w-10 h-10 text-gray-200" />
                </button>

                {/* Profile */}
                <button onClick={() => viewAuthorProfile(authorFID)} className="flex text-white flex-row justify-between items-center gap-2">
                    By {authorName}
                </button>

            </div>

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
        </main>
    );
}

"use client";

import { useReadContract } from "wagmi";
import { use, useCallback, useEffect, useState } from "react";
import sdk from '@farcaster/frame-sdk';
import { ArrowBigLeft } from "lucide-react";
import { wotdayAbi, wotdayAddress } from "@/lib/wotday";
import { base } from "viem/chains";

// Helper to decode Base64 tokenURI and extract the text and author
const decodeTokenURI = (base64Uri: string) => {
    try {
        const json = JSON.parse(atob(base64Uri.split(',')[1]));
        return {
            image: json.image || '',
            animation_url: json.animation_url || '',
            author: json.attributes?.find(
                (attr: { trait_type: string }) => attr.trait_type === 'Author'
            )?.value || '',
        };
    } catch (error) {
        console.error('Error decoding Base64 tokenURI:', error);
        return { image: '', animation_url: '', author: '' };
    }
};


export default function WordsDetails({
    params,
}: {
    params: Promise<{ tokenId: string }>
}) {
    const { tokenId } = use(params)
    const [animationURIs, setAnimationURIs] = useState("");
    const [imageURIs, setImageURIs] = useState("");
    const [authorName, setAuthorName] = useState("");
    const [authorFID, setAuthorFID] = useState<number>();

    const { data: tokenURIData } = useReadContract({
        address: wotdayAddress as `0x${string}`,
        abi: wotdayAbi,
        chainId: base.id,
        functionName: "tokenURI",
        args: [BigInt(tokenId || "1")],
    });

    const linkToMarket = useCallback((tokenId: string) => {
        if (tokenId) {
            sdk.actions.openUrl(`https://opensea.io/item/base/${wotdayAddress}/${tokenId}`);
        }
    }, []);

    const linkToGIFImage = useCallback((gifUrl: string) => {
        if (gifUrl) {
            sdk.actions.openUrl(`${gifUrl.replace('ipfs://', 'https://gateway.pinata.cloud/ipfs/')}`);
        }
    }, []);

    useEffect(() => {
        if (authorName) {
            async function getAuthorFID() {
                try {
                    const response = await fetch(`/api/user-fid-by?fname=${authorName}`);
                    const data = await response.json();
                    setAuthorFID(data.fid || null);
                } catch {
                    return null;
                }
            }
            getAuthorFID()
        }
    })

    const authorProfile = useCallback(() => {
        if (authorName) {
            sdk.actions.viewProfile({ fid: authorFID as number })
        }
    }, [authorFID, authorName])

    useEffect(() => {
        if (tokenURIData) {
            const { image, animation_url, author } = decodeTokenURI(tokenURIData);
            setAnimationURIs(animation_url);
            setImageURIs(image);
            setAuthorName(author);
        }
    }, [tokenURIData]);

    const closeFrame = () => {
        sdk.actions.close()
    };

    return (
        <main className="w-full bg-[#1d1429e3] min-h-screen bg-[radial-gradient(#290f51_1px,transparent_1px)] [background-size:16px_16px]">

            {/* Header section */}
            <div className="w-full bg-[#17101f] p-3 rounded-b-2xl flex flex-row justify-between">

                {/* Back */}
                <button
                    onClick={closeFrame}
                    className="disabled:opacity-50"
                >
                    <ArrowBigLeft className="w-10 h-10 text-gray-200" />
                </button>

                {/* Profile */}
                <button onClick={authorProfile} className="flex bg-none text-white justify-center items-center">
                    <p className="text-lg">Words By <span className="font-extrabold text-xl text-pink-900">{authorName}</span></p>
                </button>

            </div>

            {/* Words of the Day detail */}
            <div className="w-full p-4 flex flex-col justify-center items-center mx-auto max-w-[400px] space-y-5">
                {animationURIs && imageURIs ? (
                    <>
                        <iframe
                            src={animationURIs}
                            allow="clipboard-write"
                            width="360px"
                            height="360px"
                            allowFullScreen
                            className="w-full max-w-[360px] max-h-[360px] bg-white rounded-2xl mx-auto"
                        ></iframe>


                        <button
                            className="w-full py-4 bg-[#342047] text-white text-lg rounded-2xl font-semibold hover:bg-[#502f6e] transition"
                            onClick={() => linkToMarket(tokenId)}
                        >
                            Collect
                        </button>

                        <button
                            className="w-full py-4 bg-[#342047] text-white text-lg rounded-2xl font-semibold hover:bg-[#502f6e] transition"
                            onClick={() => linkToGIFImage(imageURIs)}
                        >
                            Download GIF
                        </button>

                    </>
                ) : (
                    <div className="fixed inset-0 flex max-w-[300px] mx-auto justify-center items-center text-gray-500 text-center col-span-3">
                        No Words of the Day minted yet. Add your first one!
                    </div>
                )}
            </div>
        </main>
    );
}

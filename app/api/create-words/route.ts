import { NextRequest, NextResponse } from "next/server";
import {
    Message,
    NobleEd25519Signer,
    FarcasterNetwork,
    makeCastAdd,
    CastType,
} from "@farcaster/core";
import { hexToBytes } from "@noble/hashes/utils";

const appFid = process.env.NEXT_PUBLIC_APP_FID;
const account = process.env.APP_PRIVATE_KEY || "";

export async function POST(request: NextRequest) {
    try {
        const { wordsText, embedUrl } = await request.json();

        if (!wordsText) {
            return NextResponse.json({ error: "Invalid input data" }, { status: 400 });
        }

        // Set up the signer
        const privateKeyBytes = hexToBytes(account);
        const ed25519Signer = new NobleEd25519Signer(privateKeyBytes);

        const dataOptions = {
            fid: Number(appFid),
            network: FarcasterNetwork.MAINNET,
        };

        // Construct the cast
        const castBody = {
            text: wordsText,
            embeds: [{url: embedUrl}],
            embedsDeprecated: [],
            mentions: [],
            mentionsPositions: [],
            type: CastType.CAST,
        };
        

        const castAddReq = await makeCastAdd(castBody, dataOptions, ed25519Signer);

        if (castAddReq.isErr()) {
            console.error("Error in makeCastAdd:", castAddReq.error.message);
            return NextResponse.json({ error: "Failed to construct cast" }, { status: 400 });
        }

        const castAdd = castAddReq.value;
        const messageBytes = Buffer.from(Message.encode(castAdd).finish());

        const castRequest = await fetch("https://hub.pinata.cloud/v1/submitMessage", {
            method: "POST",
            headers: { "Content-Type": "application/octet-stream" },
            body: messageBytes,
        });

        if (!castRequest.ok) {
            console.error("Failed to submit cast:", castRequest.status, await castRequest.text());
            return NextResponse.json({ error: "Hub submission failed" }, { status: 500 });
        }

        const castResult = await castRequest.json();
        return NextResponse.json({ message: castResult }, { status: 200 });
    } catch (error: unknown) {
        console.error("Error submitting cast:", (error as Error).message);
        return NextResponse.json({ error: "Failed to submit message" }, { status: 500 });
    }
}

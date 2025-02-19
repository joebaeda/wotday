import { NextResponse } from 'next/server';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('fname');

    if (!username) {
        return NextResponse.json(
            { error: 'Username query parameter is required' },
            { status: 400 }
        );
    }

    const apiUrl = `https://fnames.farcaster.xyz/transfers/current?name=${username}`;

    try {
        const response = await fetch(apiUrl);
        if (!response.ok) {
            return NextResponse.json(
                { error: 'Failed to fetch data from the API' },
                { status: response.status }
            );
        }

        const data = await response.json();
        const fid = data?.transfer?.to;

        if (!fid) {
            return NextResponse.json(
                { error: 'FID not found in the API response' },
                { status: 404 }
            );
        }

        return NextResponse.json({ fid });
    } catch (error) {
        return NextResponse.json(
            { error: error },
            { status: 500 }
        );
    }
}

import { wotdayAbi, wotdayAddress } from '@/lib/wotday';
import { ImageResponse } from 'next/og';
import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

export const runtime = 'edge';

// Helper to decode Base64 tokenURI and extract the text and author
const decodeTokenURI = (base64Uri: string) => {
  try {
    const json = JSON.parse(atob(base64Uri.split(',')[1]));
    return {
      words: json.words || '',
      author: json.attributes?.find(
        (attr: { trait_type: string }) => attr.trait_type === 'Author'
      )?.value || '',
      authorFid: json.attributes?.find(
        (attr: { trait_type: string }) => attr.trait_type === 'Farcaster ID'
      )?.value || '',
    };
  } catch (error) {
    console.error('Error decoding Base64 tokenURI:', error);
    return { words: '', author: '', authorFid: '' };
  }
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tokenId = searchParams.get('tokenId');

  if (!tokenId) {
    return new ImageResponse(
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%',
          backgroundImage: 'url(https://wotday.xyz/og-image.jpg)',
          objectFit: 'cover',
          backgroundColor: '#f4f4f5',
          fontSize: 24,
          color: '#333',
        }}
      >
      </div>,
      { width: 1200, height: 600 }
    );
  }

  const publicClient = createPublicClient({
    chain: base,
    transport: http(),
  });

  try {
    const tokenURI: string = await publicClient.readContract({
      address: wotdayAddress as `0x${string}`,
      abi: wotdayAbi,
      functionName: 'tokenURI',
      args: [BigInt(tokenId)],
    });

    const { words, author, authorFid } = decodeTokenURI(tokenURI);

    if (!words && !author) {
      throw new Error('Invalid tokenURI format');
    }

    const response = await fetch(`https://hub.pinata.cloud/v1/userDataByFid?fid=${authorFid}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch user data: ${response.statusText}`)
    }

    const userData = await response.json()

    // Initialize extracted data fields
    //let name = ""
    //let fname = ""
    //let bio = ""
    let pfp = ""

    // Extract relevant fields
    for (const message of userData.messages) {
      const { type, value } = message.data.userDataBody
      //if (type === "USER_DATA_TYPE_DISPLAY") name = value
      //if (type === "USER_DATA_TYPE_USERNAME") fname = value
      //if (type === "USER_DATA_TYPE_BIO") bio = value
      if (type === "USER_DATA_TYPE_PFP") pfp = value
    }

    return new ImageResponse(
      <div
        style={{
          display: 'flex',
          position: 'relative',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: '#f1f1f1',
          backgroundSize: '30px 30px',
          background: 'radial-gradient(#e8e1b0 10%, transparent 10%)',
          fontFamily: 'Arial, sans-serif',
          color: '#333',
          padding: '30px',
        }}
      >
        <div style={{
          position: 'absolute',
          backgroundImage: `url(${pfp || 'https://wotday.xyz/wotday-logo.jpeg'})`,
          inset: 0,
          width: '300px',
          height: '300px',
          borderRadius: '20px',
          objectFit: 'cover',
          alignItems: 'center',
          transform: 'rotate(15deg)',
          opacity: 0.3
        }}></div>
        <div
          style={{
            display: 'flex', // Explicit flex to fix error
            position: 'relative',
            flexDirection: 'column', // Stack the quote and author
            justifyContent: 'center',
            alignItems: 'center',
            borderRadius: '15px',
            padding: '40px',
            maxWidth: '70%',
            textAlign: 'center',
            backdropFilter: 'blur(10px)',
          }}
        >
          <p
            style={{
              fontSize: '24px',
              position: 'relative',
              fontWeight: 'bold',
              margin: 0,
              lineHeight: 1.5,
              letterSpacing: '1px',
              textShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
            }}
          >
            &quot;{words}&quot;
          </p>
          <p
            style={{
              fontSize: '20px',
              position: 'relative',
              marginTop: '20px',
              fontStyle: 'italic',
              letterSpacing: '1px',
            }}
          >
            {author ? `- ${author} -` : '- Unknown Author -'}
          </p>
        </div>
      </div>,
      { width: 1200, height: 600 }
    );
  } catch (error) {
    console.error('Error generating image:', error);
    return new ImageResponse(
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%',
          backgroundImage: 'url(https://wotday.xyz/og-image.jpg)',
          objectFit: 'cover',
          backgroundColor: '#f8d7da',
          fontSize: 24,
          color: '#842029',
        }}
      >
      </div>,
      { width: 1200, height: 600 }
    );
  }
}

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
    };
  } catch (error) {
    console.error('Error decoding Base64 tokenURI:', error);
    return { words: '', author: '' };
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

    const { words, author } = decodeTokenURI(tokenURI);

    if (!words && !author) {
      throw new Error('Invalid tokenURI format');
    }

    return new ImageResponse(
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          width: '100%',
          height: '100%',
          backgroundColor: '#f1f1f1',
          backgroundSize: '30px 30px',
          background: 'radial-gradient(#e8e1b0 10%, transparent 10%)',
          fontFamily: 'Arial, sans-serif',
          color: '#fff',
          padding: '30px',
        }}
      >
        <div
          style={{
            display: 'flex', // Explicit flex to fix error
            flexDirection: 'column', // Stack the quote and author
            justifyContent: 'center',
            alignItems: 'center',
            background: 'rgba(0, 0, 0, 0.5)',
            borderRadius: '15px',
            padding: '40px',
            maxWidth: '70%',
            textAlign: 'center',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <p
            style={{
              fontSize: '48px',
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
              fontSize: '24px',
              marginTop: '20px',
              fontStyle: 'italic',
              color: '#f1f1f1',
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

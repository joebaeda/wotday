import "../globals.css";
import { Geist_Mono } from "next/font/google";
import Provider from "../providers/Provider";
import { Metadata } from "next";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appUrl = "https://wotday.xyz";
export const revalidate = 300;

export async function generateMetadata({
    params,
}: {
    params: Promise<{ tokenId: string }>
}): Promise<Metadata> {
    const { tokenId } = await params;

    try {
        // Dynamically set the og-image based on the tokenId
        const ogImageUrl = `${appUrl}/api/og-image?tokenId=${tokenId}`;

        return {
            title: "WotDay | Words of the Day",
            description:
                "A platform exclusively for Farcaster users to share inspiring words, spark creativity, and connect through daily inspiration. Submit your word and inspire the Farcaster community today!",
            openGraph: {
                title: `Wotday | Words of the Day ${tokenId}`,
                description:
                    "A platform exclusively for Farcaster users to share inspiring words, spark creativity, and connect through daily inspiration. Submit your word and inspire the Farcaster community today!",
                url: `${appUrl}/${tokenId}`,
                type: "website",
                images: [
                    {
                        url: ogImageUrl, // Use the dynamically generated og-image URL
                        width: 1200,
                        height: 600,
                        alt: `Words of the Day ${tokenId}`,
                    },
                ],
            },
            twitter: {
                card: "summary_large_image",
                title: `Wotday | Words of the Day ${tokenId}`,
                description:
                    "A platform exclusively for Farcaster users to share inspiring words, spark creativity, and connect through daily inspiration. Submit your word and inspire the Farcaster community today!",
                images: [ogImageUrl], // Use the dynamically generated og-image URL
            },
            icons: {
                icon: "/favicon.ico",
            },
            other: {
                "fc:frame": JSON.stringify({
                    version: "next",
                    imageUrl: ogImageUrl, // Use the dynamically generated og-image URL
                    button: {
                        title: "What's Words Today?",
                        action: {
                          type: "launch_frame",
                          name: "WotDay",
                          url: appUrl,
                          splashImageUrl: `${appUrl}/splash.png`,
                          splashBackgroundColor: "#c4d6dc",
                        },
                      },
                }),
            },
        };
    } catch (error) {
        console.error('Error generating metadata:', error);
        return {
            title: 'Wotday | Words of the Day',
            description: 'Failed to load token data',
        };
    }
}

export default function TokenDetailLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en">
            <body className={`${geistMono.variable} antialiased`}>
                <Provider>{children}</Provider>
            </body>
        </html>
    );
}

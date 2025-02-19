import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "../../globals.css";
import Provider from "../../providers/Provider";

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
        // Dynamically set the og-image based on the Token ID
        const ogImageUrl = `${appUrl}/api/og-image?tokenId=${tokenId}`;

        return {
            title: `Words of the Day #${tokenId}`,
            description: `Check out collection of inspiring words today to spark your creativity so you can inspire the people around you`,
            openGraph: {
                title: `Words of the Day #${tokenId}`,
                description: `Check out collection of inspiring words today to spark your creativity so you can inspire the people around you`,
                url: `${appUrl}/words/${tokenId}`,
                type: "website",
                images: [
                    {
                        url: ogImageUrl, // Use the dynamically generated og-image URL
                        width: 1200,
                        height: 600,
                        alt: `Words of the Day #${tokenId}`,
                    },
                ],
            },
            twitter: {
                card: "summary_large_image",
                title: `Words of the Day #${tokenId}`,
                description: `Check out collection of inspiring words today to spark your creativity so you can inspire the people around you`,
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
                        title: `Check it Out`,
                        action: {
                            type: "launch_frame",
                            name: "WotDay",
                            url: `${appUrl}/words/${tokenId}`,
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
            title: "WotDay | Words of the Day",
            description: 'Failed to load token data',
        };
    }
}

export default function WordsDetailsLayout({
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

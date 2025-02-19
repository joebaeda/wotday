import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import Provider from "./providers/Provider";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const appUrl = "https://wotday.xyz";

const frame = {
  version: "next",
  imageUrl: `${appUrl}/og-image.jpg`,
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
};

export const revalidate = 300;

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "WotDay | Words of the Day",
    description: "A platform exclusively for Farcaster users to share inspiring words, spark creativity, and connect through daily inspiration. Submit your word and inspire the Farcaster community today!",
    openGraph: {
      title: "WotDay | Words of the Day",
      description: "A platform exclusively for Farcaster users to share inspiring words, spark creativity, and connect through daily inspiration. Submit your word and inspire the Farcaster community today!",
      url: appUrl,
      type: 'website',
      images: [
        {
          url: `${appUrl}/og-image.jpg`,
          width: 1200,
          height: 600,
          alt: 'Submit your word and inspire the Farcaster community today!',
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: "WotDay | Words of the Day",
      description: "A platform exclusively for Farcaster users to share inspiring words, spark creativity, and connect through daily inspiration. Submit your word and inspire the Farcaster community today!",
      images: [`${appUrl}/og-image.jpg`],
    },
    icons: {
      icon: '/favicon.ico',
    },
    other: {
      "fc:frame": JSON.stringify(frame),
    },
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistMono.variable} antialiased`}
      >
        <Provider>
          {children}
        </Provider>
      </body>
    </html>
  );
}

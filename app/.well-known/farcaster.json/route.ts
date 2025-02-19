export async function GET() {

  const config = {
    accountAssociation: {
      header: "eyJmaWQiOjk4OTQ4MSwidHlwZSI6ImN1c3RvZHkiLCJrZXkiOiIweEMwRGUzOTNFNTVjM0I3NDQ5Q2RjQjNiRDM5OWMzMDMyNmI3OTQyNzUifQ",
      payload: "eyJkb21haW4iOiJ3b3RkYXkueHl6In0",
      signature: "MHg2NjMyZmM1ZGVjOGIxNTAyZDY3NmQzYzRjM2E0Y2E3NzhmMzYxZTI0YzVlYTE1NjY4ZWE3M2EwOTdkNjFiZjU3NTZkNjRmZWRmYWQ2ODQyMjM1OTVjNWU2YThmZjZmYzE5MWExYTE4ZGM5NmU4ZmI3ZGVlMmQxZTdkMGYwZTg5OTFi"
    },
    frame: {
      version: "1",
      name: "WotDay",
      iconUrl: "https://wotday.xyz/wotday-logo.jpeg",
      homeUrl: "https://wotday.xyz",
      imageUrl: "https://wotday.xyz/og-image.jpg",
      buttonTitle: "What's Words Today?",
      splashImageUrl: "https://wotday.xyz/splash.png",
      splashBackgroundColor: "#c4d6dc",
      webhookUrl: "https://wotday.xyz/api/webhook"
    },
  };

  return Response.json(config);
}
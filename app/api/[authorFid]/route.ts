import { type NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const authorFid = req.nextUrl.pathname.split("/").pop()

    if (!authorFid) {
      return NextResponse.json({ error: "FID is required" }, { status: 400 })
    }

    const response = await fetch(`https://hub.pinata.cloud/v1/userDataByFid?fid=${authorFid}`)
    if (!response.ok) {
      throw new Error(`Failed to fetch user data: ${response.statusText}`)
    }

    const userData = await response.json()

    // Initialize extracted data fields
    let name = ""
    let fname = ""
    let bio = ""
    let pfp = ""

    // Extract relevant fields
    for (const message of userData.messages) {
      const { type, value } = message.data.userDataBody
      if (type === "USER_DATA_TYPE_DISPLAY") name = value
      if (type === "USER_DATA_TYPE_USERNAME") fname = value
      if (type === "USER_DATA_TYPE_BIO") bio = value
      if (type === "USER_DATA_TYPE_PFP") pfp = value
    }

    return NextResponse.json({ name, fname, bio, pfp })
  } catch (error) {
    console.error("Error in API route:", error)
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 })
  }
}


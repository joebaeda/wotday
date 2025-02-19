"use client"

import useAnimationWeb from "@/hooks/useAnimationWeb";

export default function WotDayWeb() {

    const { containerRef } = useAnimationWeb({
        textureUrl: "https://gateway.pinata.cloud/ipfs/bafkreibpfoxm2b22agpyxwhppm2lt2lvfxmwcxqkcmssnyjlhbtlapqvk4",
    });


    return (
        <div className="relative w-full min-h-screen flex flex-col justify-center items-center space-y-3">

            {/* Three.js container as background */}
            <div
                ref={containerRef}
                className="absolute inset-0"
                style={{ width: "100%", height: "100%" }} // Make the container full-screen for background
            />

        </div>

    );
}

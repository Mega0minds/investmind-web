/**
 * Auth-only panel: image only. No black background, no overlay, text, or icon.
 */
export function AuthHero({ image = "/assets/signup.png" }: { image?: string }) {
  return (
    <div
      className="h-screen w-full bg-white bg-center bg-no-repeat"
      style={{
        backgroundImage: `url(${image})`,
        backgroundPosition: "center",
        backgroundSize: "75%",
      }}
    />
  );
}

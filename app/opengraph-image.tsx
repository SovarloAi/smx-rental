import { ImageResponse } from "next/og";
import { readFile } from "fs/promises";
import { join } from "path";

export const alt = "SMX Rental — stretchtent verhuur in Limburg";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Branded Open Graph-afbeelding (1200×630) voor delen op WhatsApp/social. */
export default async function Image() {
  const photo = await readFile(
    join(process.cwd(), "public/images/tent-feest.jpg")
  );
  const photoSrc = `data:image/jpeg;base64,${photo.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          position: "relative",
          display: "flex",
          width: "100%",
          height: "100%",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoSrc}
          width={1200}
          height={630}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
          alt=""
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background:
              "linear-gradient(to top, rgba(10,10,10,0.82) 0%, rgba(10,10,10,0.25) 50%, rgba(10,10,10,0.05) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 64,
            bottom: 60,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              fontSize: 88,
              fontWeight: 700,
              color: "#ffffff",
              letterSpacing: "-0.02em",
            }}
          >
            SMX Rental
          </div>
          <div
            style={{
              fontSize: 38,
              color: "#EADFC8",
              marginTop: 10,
            }}
          >
            Luxe stretchtent verhuur · Limburg
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}

import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "iThinkly",
    short_name: "iThinkly",
    start_url: "/",
    display: "standalone",
    icons: [
      {
        src: "/appicon.jpeg",
        type: "image/jpeg",
      },
    ],
  };
}

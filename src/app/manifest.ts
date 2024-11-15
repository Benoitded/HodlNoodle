import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "HodlNoodle",
    short_name: "HodlNoodle",
    description:
      "HodlNoodle is an app to share with your crypto friends the best spots to eat in Bangkok!",
    start_url: "/",
    display: "standalone",
    background_color: "#FFF1E0",
    theme_color: "#FFF1E0",
    icons: [
      {
        src: "/logo-icon.png",
        sizes: "100x100",
        type: "image/png",
      },
    ],
  };
}

import type { IncomingMessage, ServerResponse } from "node:http";

const CURATED_GENRES = [
  { id: "pop", name: "Pop" },
  { id: "rock", name: "Rock" },
  { id: "hip-hop", name: "Hip-Hop / Rap" },
  { id: "electronic", name: "Electronic / Dance" },
  { id: "r-and-b", name: "R&B / Soul" },
  { id: "indie", name: "Indie & Alternative" },
  { id: "bollywood", name: "Bollywood & Indian" },
  { id: "jazz", name: "Jazz & Blues" },
  { id: "classical", name: "Classical" },
  { id: "chill", name: "Chill & Lo-Fi" },
  { id: "k-pop", name: "K-Pop" },
  { id: "latin", name: "Latin & Reggaeton" },
  { id: "metal", name: "Metal" },
  { id: "acoustic", name: "Acoustic & Folk" },
];

export default async function handler(_req: IncomingMessage, res: ServerResponse) {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
  res.end(JSON.stringify({ genres: CURATED_GENRES }));
}

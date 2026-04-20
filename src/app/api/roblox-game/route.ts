import { NextResponse } from "next/server";

const PLACE_ID = "8540168650";
const ROBLOX_GAME_URL = "https://www.roblox.com/games/8540168650/Stand-Upright-Rebooted";
const CACHE_SECONDS = 45;

export const revalidate = 45;

type RobloxUniverseResponse = {
  universeId?: number;
};

type RobloxGameInfo = {
  id: number;
  rootPlaceId: number;
  name: string;
  description: string;
  playing: number;
  visits: number;
  maxPlayers: number;
  updated: string;
  favoritedCount?: number;
  creator?: {
    name?: string;
    type?: string;
  };
};

type RobloxGameInfoResponse = {
  data?: RobloxGameInfo[];
};

type RobloxThumbnailResponse = {
  data?: Array<{
    state: string;
    imageUrl?: string;
  }>;
};

async function fetchJson<T>(url: string) {
  const response = await fetch(url, {
    next: { revalidate: CACHE_SECONDS },
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Roblox request failed with ${response.status}`);
  }

  return response.json() as Promise<T>;
}

export async function GET() {
  try {
    const universe = await fetchJson<RobloxUniverseResponse>(
      `https://apis.roblox.com/universes/v1/places/${PLACE_ID}/universe`,
    );

    if (!universe.universeId) {
      return NextResponse.json({ error: "Universe ID was not returned by Roblox." }, { status: 502 });
    }

    const [gameInfo, thumbnail] = await Promise.all([
      fetchJson<RobloxGameInfoResponse>(`https://games.roblox.com/v1/games?universeIds=${universe.universeId}`),
      fetchJson<RobloxThumbnailResponse>(
        `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universe.universeId}&size=512x512&format=Png&isCircular=false`,
      ),
    ]);

    const game = gameInfo.data?.[0];

    if (!game) {
      return NextResponse.json({ error: "Game info was not returned by Roblox." }, { status: 502 });
    }

    return NextResponse.json(
      {
        universeId: universe.universeId,
        placeId: PLACE_ID,
        robloxUrl: ROBLOX_GAME_URL,
        name: game.name,
        description: game.description,
        playing: game.playing,
        visits: game.visits,
        favorites: game.favoritedCount ?? 0,
        maxPlayers: game.maxPlayers,
        updated: game.updated,
        creatorName: game.creator?.name ?? "Zai Studios",
        thumbnailUrl: thumbnail.data?.find((item) => item.state === "Completed" && item.imageUrl)?.imageUrl ?? null,
        fetchedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": `s-maxage=${CACHE_SECONDS}, stale-while-revalidate=30`,
        },
      },
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unable to load Roblox game data." },
      { status: 500 },
    );
  }
}

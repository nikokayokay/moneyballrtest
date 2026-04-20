import { NextResponse } from "next/server";

const CACHE_SECONDS = 45;
const games = [
  { placeId: "8540168650", slug: "Stand-Upright-Rebooted" },
  { placeId: "119144727737197", slug: "More-Aura" },
  { placeId: "9447079542", slug: "Project-Mugetsu" },
];

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

async function loadGame({ placeId, slug }: (typeof games)[number]) {
  const universe = await fetchJson<RobloxUniverseResponse>(
    `https://apis.roblox.com/universes/v1/places/${placeId}/universe`,
  );

  if (!universe.universeId) {
    throw new Error(`Universe ID was not returned for place ${placeId}.`);
  }

  const [gameInfo, thumbnail] = await Promise.all([
    fetchJson<RobloxGameInfoResponse>(`https://games.roblox.com/v1/games?universeIds=${universe.universeId}`),
    fetchJson<RobloxThumbnailResponse>(
      `https://thumbnails.roblox.com/v1/games/icons?universeIds=${universe.universeId}&size=512x512&format=Png&isCircular=false`,
    ),
  ]);

  const game = gameInfo.data?.[0];

  if (!game) {
    throw new Error(`Game info was not returned for place ${placeId}.`);
  }

  return {
    universeId: universe.universeId,
    placeId,
    robloxUrl: `https://www.roblox.com/games/${placeId}/${slug}`,
    name: game.name,
    description: game.description,
    playing: game.playing,
    visits: game.visits,
    favorites: game.favoritedCount ?? 0,
    maxPlayers: game.maxPlayers,
    updated: game.updated,
    creatorName: game.creator?.name ?? "Zai Studios",
    thumbnailUrl: thumbnail.data?.find((item) => item.state === "Completed" && item.imageUrl)?.imageUrl ?? null,
  };
}

export async function GET() {
  try {
    const loadedGames = await Promise.all(games.map(loadGame));

    return NextResponse.json(
      {
        games: loadedGames,
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
      { error: error instanceof Error ? error.message : "Unable to load Roblox games." },
      { status: 500 },
    );
  }
}

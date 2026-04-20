import { useParams } from "react-router-dom";
import { ProfileSkeleton } from "@/src/components/profile-skeleton";
import { PlayerProfile } from "@/src/components/PlayerProfile";
import { usePlayerProfile } from "@/src/hooks/use-player-profile";

export function PlayerPage() {
  const params = useParams();
  const playerId = Number(params.playerId);
  const profileQuery = usePlayerProfile(playerId);

  return (
    <main className="mx-auto w-full max-w-[min(96rem,100%)] px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
      {profileQuery.isLoading ? <ProfileSkeleton /> : null}
      {profileQuery.isError ? (
        <div className="rounded-[28px] border border-rose-400/20 bg-rose-400/10 p-6 text-sm text-rose-100">
          Unable to load this player profile right now.
        </div>
      ) : null}
      {profileQuery.data ? <PlayerProfile profile={profileQuery.data} /> : null}
    </main>
  );
}

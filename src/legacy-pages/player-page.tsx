import { useParams } from "react-router-dom";
import { useEffect } from "react";
import { PageShell } from "@/src/components/layout/PageShell";
import { ProfileSkeleton } from "@/src/components/profile-skeleton";
import { PlayerProfile } from "@/src/components/PlayerProfile";
import { usePlayerProfile } from "@/src/hooks/use-player-profile";
import { useRecentViews } from "@/src/hooks/useRecentViews";

export function PlayerPage() {
  const params = useParams();
  const playerId = Number(params.playerId);
  const profileQuery = usePlayerProfile(playerId);
  const recent = useRecentViews();

  useEffect(() => {
    if (profileQuery.data) {
      recent.track({
        id: profileQuery.data.identity.playerId,
        label: profileQuery.data.identity.fullName,
        team: profileQuery.data.identity.team,
      });
    }
  }, [profileQuery.data]);

  return (
    <PageShell>
      {profileQuery.isLoading ? <ProfileSkeleton /> : null}
      {profileQuery.isError ? (
        <div className="border border-rose-400/20 bg-rose-400/10 p-6 text-sm text-rose-100">
          Live data temporarily unavailable. Last known player data will reappear automatically when the source responds.
        </div>
      ) : null}
      {profileQuery.data ? <PlayerProfile profile={profileQuery.data} /> : null}
    </PageShell>
  );
}

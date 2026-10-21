import { useEffect } from "react";
import { useRoomStore } from "../stores/roomStore";
import { RoomPanel } from "../components/RoomPanel";
import { toast } from "../stores/ui";
import { PageHeader } from "../components/Page";
import { BroadcastIcon } from "@phosphor-icons/react";

export default function Rooms() {
  const roomApi = useRoomStore((s) => s.roomApi);
  const inRoom = Boolean(roomApi?.inRoom);

  useEffect(() => {
    document.title = "Rooms & Live Chat - CReEPUSIK";
  }, []);

  useEffect(() => {
    if (inRoom) {
      window.scrollTo({ top: 0, left: 0 });
      const mainEl = document.querySelector("main");
      if (mainEl) mainEl.scrollTop = 0;
    }
  }, [inRoom]);

  if (!roomApi) {
    return (
      <div className="flex h-[70vh] flex-col items-center justify-center p-6 text-center">
        <div className="size-16 rounded-2xl bg-surface-2 border border-line grid place-items-center mb-4">
          <BroadcastIcon size={32} className="text-accent animate-pulse" />
        </div>
        <h2 className="text-lg font-bold text-fg">Connecting to Realtime Hub...</h2>
        <p className="mt-1.5 text-xs text-fg-3 max-w-xs">
          Synchronizing channels and live presence sessions
        </p>
      </div>
    );
  }

  // When inside an active room session:
  // Use dedicated top safe area clearance so the room top bar fits cleanly below the phone notification section.
  if (inRoom) {
    return (
      <div className="h-full max-h-full flex flex-col min-h-0 overflow-hidden safe-top-room">
        <RoomPanel
          open={true}
          onClose={() => {}}
          room={roomApi}
          onToast={(m) => toast(m, "info")}
          inline={true}
        />
      </div>
    );
  }

  // Lobby View (when not in a room):
  return (
    <div className="h-full max-h-full flex flex-col min-h-0 overflow-y-auto scroll-area">
      <PageHeader title="Live Rooms & Chat" />
      <div className="flex-1 min-h-0 w-full max-w-5xl mx-auto px-2 sm:px-4 pb-28 md:pb-8">
        <RoomPanel
          open={true}
          onClose={() => {}}
          room={roomApi}
          onToast={(m) => toast(m, "info")}
          inline={true}
        />
      </div>
    </div>
  );
}

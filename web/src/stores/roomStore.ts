import { create } from 'zustand';
import type { RoomApi } from '../hooks/useRoom';

interface RoomStoreState {
  roomApi: RoomApi | null;
  setRoomApi: (api: RoomApi | null) => void;
}

export const useRoomStore = create<RoomStoreState>((set) => ({
  roomApi: null,
  setRoomApi: (roomApi) => set({ roomApi }),
}));

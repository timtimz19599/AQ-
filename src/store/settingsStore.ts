import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { assignColor, PRESET_COLORS } from '@/utils/colorUtils';

// SHA-256 of "alphaquants2025"
const DEFAULT_ADMIN_HASH = 'eddc5f3560ebc1b04c38612f6d427acc7ec0e87285174c72c4181fefe8443efd';

// Bump this version whenever DEFAULT_ADMIN_HASH changes — forces a reset of stored hash
const SETTINGS_VERSION = 3;

interface SettingsState {
  adminPasswordHash: string;
  teacherColorMap: Record<string, string>;
  setAdminPasswordHash: (hash: string) => void;
  getTeacherColor: (username: string) => string;
  ensureTeacherColor: (username: string) => void;
  getAllColors: () => string[];
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      adminPasswordHash: DEFAULT_ADMIN_HASH,
      teacherColorMap: {},

      setAdminPasswordHash: (hash) => set({ adminPasswordHash: hash }),

      getTeacherColor: (username) => {
        const { teacherColorMap } = get();
        return teacherColorMap[username] ?? PRESET_COLORS[0];
      },

      ensureTeacherColor: (username) => {
        const { teacherColorMap } = get();
        if (!teacherColorMap[username]) {
          const color = assignColor(username, teacherColorMap);
          set({ teacherColorMap: { ...teacherColorMap, [username]: color } });
        }
      },

      getAllColors: () => PRESET_COLORS,
    }),
    {
      name: 'aq_settings',
      version: SETTINGS_VERSION,
      // On version mismatch: reset adminPasswordHash to current default, keep teacherColorMap
      migrate: (stored, _version) => {
        const prev = stored as Partial<SettingsState>;
        return {
          adminPasswordHash: DEFAULT_ADMIN_HASH,
          teacherColorMap: prev.teacherColorMap ?? {},
        };
      },
    }
  )
);

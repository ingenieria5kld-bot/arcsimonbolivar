import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { RoundData, StaffLists, UserSG } from '../types';

const ROUNDS_FILE = 'rondas_local.json';
const STAFF_FILE = 'staff_local.json';

export const storageService = {
    async saveRounds(rounds: RoundData[]): Promise<void> {
        try {
            await Filesystem.writeFile({
                path: ROUNDS_FILE,
                data: JSON.stringify(rounds),
                directory: Directory.Documents,
                encoding: Encoding.UTF8,
            });
        } catch (e) {
            console.error('Error saving rounds locally:', e);
        }
    },

    async loadRounds(): Promise<RoundData[]> {
        try {
            const result = await Filesystem.readFile({
                path: ROUNDS_FILE,
                directory: Directory.Documents,
                encoding: Encoding.UTF8,
            });
            return JSON.parse(result.data as string);
        } catch (e) {
            console.log('No local rounds found, starting empty.');
            return [];
        }
    },

    async saveStaff(staff: StaffLists): Promise<void> {
        try {
            await Filesystem.writeFile({
                path: STAFF_FILE,
                data: JSON.stringify(staff),
                directory: Directory.Documents,
                encoding: Encoding.UTF8,
            });
        } catch (e) {
            console.error('Error saving staff locally:', e);
        }
    },

    async loadStaff(): Promise<StaffLists> {
        try {
            const result = await Filesystem.readFile({
                path: STAFF_FILE,
                directory: Directory.Documents,
                encoding: Encoding.UTF8,
            });
            return JSON.parse(result.data as string);
        } catch (e) {
            console.log('No local staff found, using defaults.');
            return { sg: [], sgi: [], ogi: [] };
        }
    },

    mergeExternalData(currentRounds: RoundData[], currentStaff: StaffLists, externalRounds: RoundData[], externalStaff: StaffLists) {
        // 1. Merge Rounds
        const roundsMap = new Map<string, RoundData>();

        // Add current rounds
        currentRounds.forEach(r => roundsMap.set(r.UNIQUE_KEY, r));

        // Merge external rounds
        externalRounds.forEach(ext => {
            const existing = roundsMap.get(ext.UNIQUE_KEY);
            if (!existing) {
                roundsMap.set(ext.UNIQUE_KEY, ext);
            } else {
                // Resolve conflict by timestamp
                const timeExisting = new Date(existing.TIMESTAMP_GUARDADO).getTime();
                const timeExternal = new Date(ext.TIMESTAMP_GUARDADO).getTime();
                if (timeExternal > timeExisting) {
                    roundsMap.set(ext.UNIQUE_KEY, ext);
                }
            }
        });

        const mergedRounds = Array.from(roundsMap.values());

        // 2. Merge Staff
        // Merge SG Users (unique by grade + name)
        const sgMap = new Map<string, UserSG>();
        currentStaff.sg.forEach(u => sgMap.set(`${u.grade}_${u.name}`, u));
        externalStaff.sg.forEach(u => sgMap.set(`${u.grade}_${u.name}`, u));

        // Merge string lists
        const sgiSet = new Set([...currentStaff.sgi, ...externalStaff.sgi]);
        const ogiSet = new Set([...currentStaff.ogi, ...externalStaff.ogi]);

        const mergedStaff: StaffLists = {
            sg: Array.from(sgMap.values()),
            sgi: Array.from(sgiSet),
            ogi: Array.from(ogiSet)
        };

        return { mergedRounds, mergedStaff };
    }
};

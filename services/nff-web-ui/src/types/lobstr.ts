export interface LobstrWindowSchedule {
  id: number;
  windowTime: string;
  name: string;
  isActive: boolean;
  timeZone: string;
  lookbackHours: number;
  lobstrScheduleIds: string[];
  createdAt: string;
  updatedAt: string;
}

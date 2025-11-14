import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import {
  WindowScheduleDefinition,
  WindowScheduleRecord,
  WindowScheduleWithRelations,
} from '../types/lobstr.interface';

@Injectable()
export class WindowScheduleService {
  private readonly logger = new Logger(WindowScheduleService.name);

  private readonly defaultDefinitions: WindowScheduleDefinition[] = [
    {
      windowTime: '03:00',
      name: 'Window 03:00',
      lobstrScheduleIds: ['0076cf3d754945c3b4678ab4f194d11e'],
      timeZone: 'Asia/Jerusalem',
      lookbackHours: 4,
    },
    {
      windowTime: '11:00',
      name: 'Window 11:00',
      lobstrScheduleIds: ['07969187584c488dbff99d3f7561117e'],
      timeZone: 'Asia/Jerusalem',
      lookbackHours: 4,
    },
    {
      windowTime: '14:00',
      name: 'Window 14:00',
      lobstrScheduleIds: ['bf0f6372e8654468a1107cbb6139f3d6'],
      timeZone: 'Asia/Jerusalem',
      lookbackHours: 4,
    },
    {
      windowTime: '15:33',
      name: 'Window 15:33',
      lobstrScheduleIds: ['48ff88986397436a97dd66acc274e7ab'],
      timeZone: 'Asia/Jerusalem',
      lookbackHours: 4,
    },
  ];

  constructor(private readonly prisma: PrismaService) {}

  async getWindowTimes(): Promise<string[]> {
    await this.ensureAllWindowsInitialized();
    return this.defaultDefinitions.map((definition) => definition.windowTime);
  }

  async getWindowSchedule(windowTime: string): Promise<WindowScheduleRecord> {
    const existing = await this.windowScheduleClient.findUnique({
      where: { windowTime },
      include: {
        lobstrSchedules: {
          select: {
            scheduleId: true,
            isActive: true,
          },
        },
      },
    });

    if (existing) {
      return this.mapWindowSchedule(existing);
    }

    const defaults = this.defaultDefinitions.find(
      (definition) => definition.windowTime === windowTime,
    );

    const created: WindowScheduleWithRelations =
      await this.windowScheduleClient.create({
        data: {
          windowTime,
          name: defaults?.name ?? `Window ${windowTime}`,
          timezone: defaults?.timeZone ?? 'Asia/Jerusalem',
          lookbackHours: defaults?.lookbackHours ?? 4,
        },
        include: {
          lobstrSchedules: {
            select: {
              scheduleId: true,
              isActive: true,
            },
          },
        },
      });

    this.logger.log(`Created window schedule for ${windowTime}`);

    if (defaults?.lobstrScheduleIds?.length) {
      await Promise.all(
        defaults.lobstrScheduleIds.map((scheduleId) => {
          const fallbackTimeZone =
            typeof created.timezone === 'string'
              ? created.timezone
              : 'Asia/Jerusalem';
          const timeZone =
            defaults && typeof defaults.timeZone === 'string'
              ? defaults.timeZone
              : fallbackTimeZone;
          const safeTimeZone = `${timeZone}`;
          return this.linkScheduleToWindow(
            created.id,
            scheduleId,
            safeTimeZone,
          );
        }),
      );
    }

    return this.getWindowSchedule(windowTime);
  }

  async getAllWindowSchedules(): Promise<WindowScheduleRecord[]> {
    await this.ensureAllWindowsInitialized();
    const schedules = await this.windowScheduleClient.findMany({
      include: {
        lobstrSchedules: {
          select: {
            scheduleId: true,
            isActive: true,
          },
        },
      },
      orderBy: {
        windowTime: 'asc',
      },
    });

    return schedules.map((schedule) => this.mapWindowSchedule(schedule));
  }

  async isWindowActive(windowTime: string): Promise<boolean> {
    const windowSchedule = await this.getWindowSchedule(windowTime);
    return windowSchedule.isActive;
  }

  async getActiveLobstrScheduleId(windowTime: string): Promise<string | null> {
    const windowSchedule = await this.getWindowSchedule(windowTime);
    if (!windowSchedule.lobstrScheduleIds.length) {
      this.logger.warn(
        `Window ${windowTime} has no Lobstr schedule IDs configured`,
      );
      return null;
    }

    const schedules = await this.lobstrScheduleClient.findMany({
      where: {
        scheduleId: {
          in: windowSchedule.lobstrScheduleIds,
        },
      },
      select: {
        scheduleId: true,
        isActive: true,
      },
    });

    for (const scheduleId of windowSchedule.lobstrScheduleIds) {
      const schedule = schedules.find((s) => s.scheduleId === scheduleId);
      if (!schedule) {
        continue;
      }
      if (schedule.isActive) {
        return schedule.scheduleId;
      }
    }

    this.logger.warn(
      `No active Lobstr schedules found for window ${windowTime}. Falling back to first configured schedule`,
    );

    return windowSchedule.lobstrScheduleIds[0] ?? null;
  }

  async getWindowTimeByScheduleId(scheduleId: string): Promise<string | null> {
    const schedule = await this.lobstrScheduleClient.findUnique({
      where: { scheduleId },
      select: {
        windowSchedule: {
          select: {
            windowTime: true,
          },
        },
      },
    });

    return schedule?.windowSchedule?.windowTime ?? null;
  }

  async addScheduleToWindow(windowTime: string, scheduleId: string) {
    const windowSchedule = await this.getWindowSchedule(windowTime);

    if (windowSchedule.lobstrScheduleIds.includes(scheduleId)) {
      return;
    }

    const timeZone: string = windowSchedule.timeZone;
    await this.linkScheduleToWindow(windowSchedule.id, scheduleId, timeZone);

    this.logger.log(
      `Added Lobstr schedule ${scheduleId} to window ${windowTime}`,
    );
  }

  async setWindowScheduleStatus(
    windowScheduleId: number,
    isActive: boolean,
  ): Promise<WindowScheduleRecord> {
    const existing = await this.windowScheduleClient.findUnique({
      where: { id: windowScheduleId },
      include: {
        lobstrSchedules: {
          select: {
            scheduleId: true,
            isActive: true,
          },
        },
      },
    });

    if (!existing) {
      throw new NotFoundException(
        `Window schedule ${windowScheduleId} not found`,
      );
    }

    const updated = await this.windowScheduleClient.update({
      where: { id: windowScheduleId },
      data: { isActive },
      include: {
        lobstrSchedules: {
          select: {
            scheduleId: true,
            isActive: true,
          },
        },
      },
    });

    return this.mapWindowSchedule(updated);
  }

  private async ensureAllWindowsInitialized() {
    await Promise.all(
      this.defaultDefinitions.map((definition) =>
        this.getWindowSchedule(definition.windowTime),
      ),
    );
  }

  private async linkScheduleToWindow(
    windowId: number,
    scheduleId: string,
    timeZone: string,
  ) {
    await this.lobstrScheduleClient.upsert({
      where: { scheduleId },
      update: {
        windowScheduleId: windowId,
      },
      create: {
        scheduleId,
        name: `Schedule ${scheduleId}`,
        timezone: timeZone,
        windowScheduleId: windowId,
      },
    });
  }

  private mapWindowSchedule(
    record: WindowScheduleWithRelations,
  ): WindowScheduleRecord {
    return {
      id: record.id,
      windowTime: record.windowTime,
      name: record.name,
      isActive: record.isActive,
      timeZone: record.timezone,
      lookbackHours: record.lookbackHours,
      lobstrScheduleIds: record.lobstrSchedules.map(
        (schedule) => schedule.scheduleId,
      ),
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private get windowScheduleClient() {
    return (this.prisma as any).windowSchedule as {
      findUnique: (args: any) => Promise<WindowScheduleWithRelations | null>;
      findMany: (args: any) => Promise<WindowScheduleWithRelations[]>;
      create: (args: any) => Promise<WindowScheduleWithRelations>;
      update: (args: any) => Promise<WindowScheduleWithRelations>;
    };
  }

  private get lobstrScheduleClient() {
    return (this.prisma as any).lobstrSchedule as {
      findMany: (
        args: any,
      ) => Promise<{ scheduleId: string; isActive: boolean }[]>;
      findUnique: (args: any) => Promise<{
        windowSchedule?: { windowTime: string } | null;
      } | null>;
      upsert: (args: any) => Promise<void>;
    };
  }
}

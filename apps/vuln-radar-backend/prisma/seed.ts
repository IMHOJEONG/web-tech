import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../generated/prisma/index.js';
import { resolveDirectDatabaseUrl } from '../src/infra/prisma/direct-connection';
import {
  alertSeeds,
  advisorySeeds,
  epssScoreSeeds,
  vulnerabilitySeeds,
  watchMatchSeeds,
  watchlistEntrySeeds,
} from '../src/shared/data/radar-seed-data';

const adapter = new PrismaPg({
  connectionString: resolveDirectDatabaseUrl(),
});
const prisma = new PrismaClient({
  adapter,
});

async function main() {
  for (const entry of watchlistEntrySeeds) {
    await prisma.watchlistEntry.upsert({
      where: {
        type_value: {
          type: entry.type,
          value: entry.value,
        },
      },
      update: {
        enabled: entry.enabled,
      },
      create: entry,
    });
  }

  for (const vulnerability of vulnerabilitySeeds) {
    await prisma.vulnerability.upsert({
      where: {
        cveId: vulnerability.cveId,
      },
      update: vulnerability,
      create: vulnerability,
    });
  }

  for (const advisory of advisorySeeds) {
    await prisma.advisory.upsert({
      where: {
        vulnerabilityCveId_source_externalId: {
          vulnerabilityCveId: advisory.vulnerabilityCveId,
          source: advisory.source,
          externalId: advisory.externalId,
        },
      },
      update: advisory,
      create: advisory,
    });
  }

  for (const epssScore of epssScoreSeeds) {
    await prisma.epssScore.upsert({
      where: {
        vulnerabilityCveId_observedAt: {
          vulnerabilityCveId: epssScore.vulnerabilityCveId,
          observedAt: epssScore.observedAt,
        },
      },
      update: epssScore,
      create: epssScore,
    });
  }

  for (const watchMatch of watchMatchSeeds) {
    const watchlistEntry = await prisma.watchlistEntry.findUniqueOrThrow({
      where: {
        type_value: {
          type: watchMatch.watchlistType,
          value: watchMatch.watchlistValue,
        },
      },
    });

    await prisma.watchMatch.upsert({
      where: {
        vulnerabilityCveId_watchlistEntryId: {
          vulnerabilityCveId: watchMatch.vulnerabilityCveId,
          watchlistEntryId: watchlistEntry.id,
        },
      },
      update: {
        matchedValue: watchMatch.matchedValue,
      },
      create: {
        vulnerabilityCveId: watchMatch.vulnerabilityCveId,
        watchlistEntryId: watchlistEntry.id,
        matchedValue: watchMatch.matchedValue,
      },
    });
  }

  for (const alert of alertSeeds) {
    await prisma.alert.upsert({
      where: {
        vulnerabilityCveId_channel_title: {
          vulnerabilityCveId: alert.vulnerabilityCveId,
          channel: alert.channel,
          title: alert.title,
        },
      },
      update: {
        status: alert.status,
        sentAt: alert.sentAt,
        priority: alert.priority,
      },
      create: alert,
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

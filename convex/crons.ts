/**
 * Scheduled Jobs (Cron Jobs)
 * 
 * Defines periodic tasks that run on a schedule.
 * 
 * Story 2.1:
 * Task 5.6: Hourly cleanup of expired pending actions
 */

import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

/**
 * Clean expired pending actions every hour
 * Prevents database bloat from abandoned confirmations
 */
crons.interval(
  "clean expired pending actions",
  { hours: 1 },
  internal.pendingActions.cleanExpiredInternal.cleanExpiredInternal
);

export default crons;

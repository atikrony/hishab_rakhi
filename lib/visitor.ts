import path from 'path';
import {
  getDataStorageDirectory,
  safeReadJson,
  safeWriteJson,
  getMemoryStore,
} from './storage';

export interface DailyVisitorRecord {
  date: string; // YYYY-MM-DD
  visits: number;
  uniques: number;
}

export interface VisitorAnalyticsData {
  totalVisits: number;
  uniqueVisitors: number;
  todayVisits: number;
  lastVisitDate: string;
  uniqueVisitorIds: string[];
  history: DailyVisitorRecord[];
  recentVisits: Array<{
    id: string;
    path: string;
    timestamp: string;
    userAgent?: string;
  }>;
}

const defaultAnalytics: VisitorAnalyticsData = {
  totalVisits: 0,
  uniqueVisitors: 0,
  todayVisits: 0,
  lastVisitDate: new Date().toISOString().split('T')[0],
  uniqueVisitorIds: [],
  history: [],
  recentVisits: [],
};

const VISITOR_FILE = 'visitors.json';

// In-memory cache handle
const globalVisitorStore = globalThis as unknown as {
  __HR_VISITOR_ANALYTICS__?: VisitorAnalyticsData;
};

export function getVisitorAnalytics(): VisitorAnalyticsData {
  if (globalVisitorStore.__HR_VISITOR_ANALYTICS__) {
    return globalVisitorStore.__HR_VISITOR_ANALYTICS__;
  }

  const primaryPath = path.join(getDataStorageDirectory(), VISITOR_FILE);
  const diskData = safeReadJson<VisitorAnalyticsData>(primaryPath, path.join('data', VISITOR_FILE));

  if (diskData) {
    globalVisitorStore.__HR_VISITOR_ANALYTICS__ = diskData;
    return diskData;
  }

  const initial = JSON.parse(JSON.stringify(defaultAnalytics));
  globalVisitorStore.__HR_VISITOR_ANALYTICS__ = initial;
  return initial;
}

export function saveVisitorAnalytics(data: VisitorAnalyticsData): void {
  globalVisitorStore.__HR_VISITOR_ANALYTICS__ = data;
  const primaryPath = path.join(getDataStorageDirectory(), VISITOR_FILE);
  safeWriteJson(primaryPath, data);
}

export function recordVisit(params: {
  path?: string;
  visitorId?: string;
  userAgent?: string;
}): VisitorAnalyticsData {
  const analytics = getVisitorAnalytics();
  const today = new Date().toISOString().split('T')[0];

  analytics.totalVisits = (analytics.totalVisits || 0) + 1;

  // Track daily reset or rollover
  if (analytics.lastVisitDate !== today) {
    analytics.lastVisitDate = today;
    analytics.todayVisits = 1;
  } else {
    analytics.todayVisits = (analytics.todayVisits || 0) + 1;
  }

  // Track Unique Visitor
  const vid = params.visitorId || 'anon';
  if (!analytics.uniqueVisitorIds) {
    analytics.uniqueVisitorIds = [];
  }

  const isNewVisitor = !analytics.uniqueVisitorIds.includes(vid);
  if (isNewVisitor) {
    // Keep max 5,000 IDs to avoid unbounded memory/file bloat
    if (analytics.uniqueVisitorIds.length >= 5000) {
      analytics.uniqueVisitorIds.shift();
    }
    analytics.uniqueVisitorIds.push(vid);
    analytics.uniqueVisitors = (analytics.uniqueVisitors || 0) + 1;
  }

  // Update Daily History
  if (!Array.isArray(analytics.history)) {
    analytics.history = [];
  }
  let dayRecord = analytics.history.find((h) => h.date === today);
  if (!dayRecord) {
    dayRecord = { date: today, visits: 1, uniques: isNewVisitor ? 1 : 0 };
    analytics.history.push(dayRecord);
    // Keep last 30 days
    if (analytics.history.length > 30) {
      analytics.history.shift();
    }
  } else {
    dayRecord.visits += 1;
    if (isNewVisitor) {
      dayRecord.uniques += 1;
    }
  }

  // Update Recent Visits Log (keep last 20)
  if (!Array.isArray(analytics.recentVisits)) {
    analytics.recentVisits = [];
  }
  analytics.recentVisits.unshift({
    id: `v_${Date.now()}`,
    path: params.path || '/',
    timestamp: new Date().toISOString(),
    userAgent: params.userAgent?.substring(0, 150),
  });
  if (analytics.recentVisits.length > 20) {
    analytics.recentVisits.pop();
  }

  saveVisitorAnalytics(analytics);
  return analytics;
}


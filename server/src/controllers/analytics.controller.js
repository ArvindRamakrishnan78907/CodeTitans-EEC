import { queryAll, queryOne } from '../models/db.js';
import config from '../config/index.js';

/**
 * Get analytics for a specific short URL
 */
export function getAnalytics(req, res) {
  try {
    const { shortCode } = req.params;
    const { range = '7d' } = req.query;

    const url = queryOne(
      `SELECT id, short_code, original_url, created_at, click_count
       FROM urls WHERE short_code = ? AND is_active = 1`,
      [shortCode]
    );

    if (!url) {
      return res.status(404).json({ error: 'URL not found' });
    }

    const rangeMap = { '24h': 1, '7d': 7, '30d': 30, '90d': 90, 'all': 3650 };
    const days = rangeMap[range] || 7;
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);
    const sinceDateStr = sinceDate.toISOString();

    const clicksOverTime = queryAll(
      `SELECT DATE(clicked_at) as date, COUNT(*) as clicks
       FROM clicks WHERE url_id = ? AND clicked_at >= ?
       GROUP BY DATE(clicked_at) ORDER BY date ASC`,
      [url.id, sinceDateStr]
    );

    const topReferrers = queryAll(
      `SELECT referrer, COUNT(*) as count
       FROM clicks WHERE url_id = ? AND clicked_at >= ?
       GROUP BY referrer ORDER BY count DESC LIMIT 10`,
      [url.id, sinceDateStr]
    );

    const browsers = queryAll(
      `SELECT browser, COUNT(*) as count
       FROM clicks WHERE url_id = ? AND clicked_at >= ?
       GROUP BY browser ORDER BY count DESC LIMIT 10`,
      [url.id, sinceDateStr]
    );

    const operatingSystems = queryAll(
      `SELECT os, COUNT(*) as count
       FROM clicks WHERE url_id = ? AND clicked_at >= ?
       GROUP BY os ORDER BY count DESC LIMIT 10`,
      [url.id, sinceDateStr]
    );

    const devices = queryAll(
      `SELECT device_type, COUNT(*) as count
       FROM clicks WHERE url_id = ? AND clicked_at >= ?
       GROUP BY device_type ORDER BY count DESC`,
      [url.id, sinceDateStr]
    );

    const uniqueVisitors = queryOne(
      `SELECT COUNT(DISTINCT ip_hash) as count
       FROM clicks WHERE url_id = ? AND clicked_at >= ?`,
      [url.id, sinceDateStr]
    );

    const totalInRange = queryOne(
      `SELECT COUNT(*) as count
       FROM clicks WHERE url_id = ? AND clicked_at >= ?`,
      [url.id, sinceDateStr]
    );

    const recentClicks = queryAll(
      `SELECT clicked_at, referrer, browser, os, device_type, country, ip_hash
       FROM clicks WHERE url_id = ? ORDER BY clicked_at DESC LIMIT 10`,
      [url.id]
    );

    const countries = queryAll(
      `SELECT country, COUNT(*) as count
       FROM clicks WHERE url_id = ? AND clicked_at >= ?
       GROUP BY country ORDER BY count DESC LIMIT 10`,
      [url.id, sinceDateStr]
    );

    res.json({
      url: { ...url, shortUrl: `${config.clientUrl}/${url.short_code}` },
      range,
      totalClicks: url.click_count,
      clicksInRange: totalInRange.count,
      uniqueVisitors: uniqueVisitors.count,
      clicksOverTime,
      topReferrers,
      browsers,
      operatingSystems,
      devices,
      recentClicks,
      countries
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

/**
 * Get overall dashboard stats
 */
export function getDashboardStats(req, res) {
  try {
    const totalUrls = queryOne('SELECT COUNT(*) as count FROM urls WHERE is_active = 1');
    const totalClicks = queryOne('SELECT COALESCE(SUM(click_count), 0) as count FROM urls');
    const todayClicks = queryOne(
      `SELECT COUNT(*) as count FROM clicks WHERE DATE(clicked_at) = DATE('now')`
    );

    const recentUrls = queryAll(
      `SELECT short_code, original_url, click_count, created_at
       FROM urls WHERE is_active = 1 ORDER BY created_at DESC LIMIT 5`
    );

    const topUrls = queryAll(
      `SELECT short_code, original_url, click_count
       FROM urls WHERE is_active = 1 ORDER BY click_count DESC LIMIT 5`
    );

    res.json({
      totalUrls: totalUrls.count,
      totalClicks: totalClicks.count,
      todayClicks: todayClicks.count,
      recentUrls: recentUrls.map(u => ({
        ...u,
        shortUrl: `${config.clientUrl}/${u.short_code}`
      })),
      topUrls: topUrls.map(u => ({
        ...u,
        shortUrl: `${config.clientUrl}/${u.short_code}`
      }))
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

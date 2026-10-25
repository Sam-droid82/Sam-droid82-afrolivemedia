import { Router } from 'express';

const router = Router();

function getPool(req) {
  return req.app.locals.db;
}

router.get('/health', async (req, res) => {
  const db = getPool(req);
  if (!db) {
    return res.status(200).json({ status: 'ok', service: 'afrolivestream-api', database: 'not_configured' });
  }
  try {
    await db.query('SELECT 1');
    return res.json({ status: 'ok', service: 'afrolivestream-api', database: 'connected' });
  } catch {
    return res.status(503).json({ status: 'degraded', service: 'afrolivestream-api', database: 'unavailable' });
  }
});

// Only published items are exposed through public catalogue endpoints.
router.get('/catalog', async (req, res, next) => {
  const db = getPool(req);
  if (!db) return res.status(503).json({ error: 'catalog_unavailable', message: 'Database is not configured yet.' });

  try {
    const { category, type, q, limit = '24', offset = '0' } = req.query;
    const safeLimit = Math.min(Math.max(Number.parseInt(limit, 10) || 24, 1), 100);
    const safeOffset = Math.max(Number.parseInt(offset, 10) || 0, 0);
    const values = [];
    const where = ["status = 'published'", 'deleted_at IS NULL'];

    if (category) {
      values.push(String(category).slice(0, 80));
      where.push(`category = $${values.length}`);
    }
    if (type) {
      values.push(String(type).slice(0, 40));
      where.push(`content_type = $${values.length}`);
    }
    if (q) {
      values.push(`%${String(q).slice(0, 120).replace(/[\\%_]/g, '\\$&')}%`);
      where.push(`(title ILIKE $${values.length} OR description ILIKE $${values.length})`);
    }

    values.push(safeLimit, safeOffset);
    const sql = `SELECT id, slug, title, description, category, content_type, artwork_url, duration_seconds, is_featured, published_at
      FROM content_items WHERE ${where.join(' AND ')}
      ORDER BY is_featured DESC, published_at DESC NULLS LAST, title ASC
      LIMIT $${values.length - 1} OFFSET $${values.length}`;
    const result = await db.query(sql, values);
    res.json({ items: result.rows, pagination: { limit: safeLimit, offset: safeOffset, returned: result.rowCount } });
  } catch (error) {
    next(error);
  }
});

router.get('/catalog/:slug', async (req, res, next) => {
  const db = getPool(req);
  if (!db) return res.status(503).json({ error: 'catalog_unavailable', message: 'Database is not configured yet.' });
  try {
    const result = await db.query(
      `SELECT id, slug, title, description, category, content_type, artwork_url, duration_seconds, is_featured, published_at
       FROM content_items WHERE slug = $1 AND status = 'published' AND deleted_at IS NULL LIMIT 1`,
      [String(req.params.slug).slice(0, 160)]
    );
    if (!result.rowCount) return res.status(404).json({ error: 'not_found', message: 'Published content was not found.' });
    res.json({ item: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.get('/channels', async (req, res, next) => {
  const db = getPool(req);
  if (!db) return res.status(503).json({ error: 'channels_unavailable', message: 'Database is not configured yet.' });
  try {
    const result = await db.query(
      `SELECT id, slug, name, description, channel_type, logo_url, schedule_url
       FROM channels WHERE is_active = TRUE ORDER BY sort_order ASC, name ASC`
    );
    // Stream URLs are intentionally not returned until rights and publication controls are implemented.
    res.json({ channels: result.rows });
  } catch (error) {
    next(error);
  }
});

export default router;

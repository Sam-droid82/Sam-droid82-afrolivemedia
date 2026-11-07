import { Router } from 'express';
import { requireAdmin } from './auth.js';
const router = Router();
function requireAllowedOrigin(req, res, next) {
  const allowedOrigins = (process.env.CORS_ORIGINS || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean);

  const origin = req.get('origin');

  if (!origin || !allowedOrigins.includes(origin)) {
    return res.status(403).json({ error: 'origin_not_allowed' });
  }

  next();
}
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

router.post(
  '/admin/content',
  requireAllowedOrigin,
  requireAdmin,
  async (req, res, next) => {
    const db = getPool(req);

if (!db) {
  return res.status(503).json({
    error: 'database_unavailable',
    message: 'The database connection is unavailable.'
  });
}
    const { title, contentType, description, posterUrl, videoUrl } = req.body || {};

    if (!title || !contentType) {
      return res.status(400).json({
        error: 'missing_required_fields',
        message: 'Title and content type are required.'
      });
    }
const normalizedType = String(contentType).trim().toLowerCase();

const allowedTypes = ['movie', 'series', 'documentary'];

if (!allowedTypes.includes(normalizedType)) {
  return res.status(400).json({
    error: 'invalid_content_type',
    message: 'Content type must be Movie, Series, or Documentary.'
  });
}
    const cleanTitle = typeof title === 'string' ? title.trim() : '';

if (cleanTitle.length === 0 || cleanTitle.length > 240) {
  return res.status(400).json({
    error: 'invalid_title',
    message: 'Movie title must contain between 1 and 240 characters.'
  });
}
    const cleanDescription =
  typeof description === 'string' ? description.trim() : '';

if (cleanDescription.length > 5000) {
  return res.status(400).json({
    error: 'invalid_description',
    message: 'Description must not exceed 5000 characters.'
  });
}
    const cleanPosterUrl =
  typeof posterUrl === 'string' ? posterUrl.trim() : '';

if (cleanPosterUrl) {
  try {
    const parsedPosterUrl = new URL(cleanPosterUrl);

    if (!['http:', 'https:'].includes(parsedPosterUrl.protocol)) {
      throw new Error('Invalid URL protocol');
    }
  } catch {
    return res.status(400).json({
      error: 'invalid_poster_url',
      message: 'Please enter a valid HTTP or HTTPS poster image URL.'
    });
  }
}
    const cleanVideoUrl =
  typeof videoUrl === 'string' ? videoUrl.trim() : '';

if (cleanVideoUrl) {
  try {
    const parsedVideoUrl = new URL(cleanVideoUrl);

    if (!['http:', 'https:'].includes(parsedVideoUrl.protocol)) {
      throw new Error('Invalid URL protocol');
    }
  } catch {
    return res.status(400).json({
      error: 'invalid_video_url',
      message: 'Please enter a valid HTTP or HTTPS video URL.'
    });
  }
}
    const slug = (
  cleanTitle
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 100) || 'content'
) + '-' + crypto.randomUUID().slice(0, 8);
    try {
    const result = await db.query(
  `INSERT INTO content_items (
    slug,
    title,
    description,
    category,
    content_type,
    artwork_url,
    video_url,
    status,
    rights_status
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, 'draft', 'pending_review')
  RETURNING id, slug, title, content_type, status`,
  [
    slug,
    cleanTitle,
    cleanDescription,
    'entertainment',
    normalizedType,
    cleanPosterUrl || null,
    cleanVideoUrl || null
  ]
);
    return res.status(201).json({
  success: true,
  message: 'Content saved successfully as a draft.',
  content: result.rows[0]
});

} catch (error) {
  return next(error);
}
}
);
router.get('/admin/content', requireAdmin, async (req, res, next) => {
  const db = getPool(req);

  if (!db) {
    return res.status(503).json({
      error: 'database_unavailable',
      message: 'The database connection is unavailable.'
    });
  }

  try {
    const result = await db.query(
      `SELECT
        id,
        slug,
        title,
        description,
        category,
        content_type,
        artwork_url,
        video_url,
        status,
        rights_status,
        created_at
      FROM content_items
      WHERE deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT 100`
    );

    return res.status(200).json({
      success: true,
      content: result.rows
    });
  } catch (error) {
    return next(error);
  }
});
router.patch(
  '/admin/content/:id',
  requireAllowedOrigin,
  requireAdmin,
  async (req, res, next) => {
    const { id } = req.params;

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

if (!uuidPattern.test(id)) {
  return res.status(400).json({
    error: 'invalid_movie_id',
    message: 'A valid movie ID is required.'
  });
}
    const { title } = req.body || {};

if (title !== undefined) {
  if (typeof title !== 'string' ||
      title.trim().length === 0 ||
      title.trim().length > 240) {
    return res.status(400).json({
      error: 'invalid_title',
      message: 'Movie title must contain between 1 and 240 characters.'
    });
  }
}
    const { contentType } = req.body || {};

if (contentType !== undefined) {
  if (
    typeof contentType !== 'string' ||
    !['movie', 'series', 'documentary'].includes(
      contentType.trim().toLowerCase()
    )
  ) {
    return res.status(400).json({
      error: 'invalid_content_type',
      message: 'Content type must be Movie, Series, or Documentary.'
    });
  }
}
    const { description } = req.body || {};

if (description !== undefined) {
  if (
    typeof description !== 'string' ||
    description.trim().length > 5000
  ) {
    return res.status(400).json({
      error: 'invalid_description',
      message: 'Description must not exceed 5000 characters.'
    });
  }
}
    const { posterUrl } = req.body || {};

if (posterUrl !== undefined) {
  if (typeof posterUrl !== 'string') {
    return res.status(400).json({
      error: 'invalid_poster_url',
      message: 'Poster URL must be a valid string.'
    });
  }

  if (posterUrl.trim()) {
    try {
      const parsedPosterUrl = new URL(posterUrl.trim());

      if (!['http:', 'https:'].includes(parsedPosterUrl.protocol)) {
        throw new Error('Invalid URL protocol');
      }
    } catch {
      return res.status(400).json({
        error: 'invalid_poster_url',
        message: 'Please enter a valid HTTP or HTTPS poster URL.'
      });
    }
  }
}
    const { videoUrl } = req.body || {};

if (videoUrl !== undefined) {
  if (typeof videoUrl !== 'string') {
    return res.status(400).json({
      error: 'invalid_video_url',
      message: 'Video URL must be a valid string.'
    });
  }

  if (videoUrl.trim()) {
    try {
      const parsedVideoUrl = new URL(videoUrl.trim());

      if (!['http:', 'https:'].includes(parsedVideoUrl.protocol)) {
        throw new Error('Invalid URL protocol');
      }
    } catch {
      return res.status(400).json({
        error: 'invalid_video_url',
        message: 'Please enter a valid HTTP or HTTPS video URL.'
      });
    }
  }
}
    const db = getPool(req);

    if (!db) {
      return res.status(503).json({
        error: 'database_unavailable',
        message: 'The database connection is unavailable.'
      });
    }
const updates = [];
const values = [];

function addUpdate(column, value) {
  values.push(value);
  updates.push(`${column} = $${values.length}`);
}

if (title !== undefined) {
  addUpdate('title', title.trim());
}

if (contentType !== undefined) {
  addUpdate('content_type', contentType.trim().toLowerCase());
}

if (description !== undefined) {
  addUpdate('description', description.trim());
}

if (posterUrl !== undefined) {
  addUpdate('artwork_url', posterUrl.trim() || null);
}

if (videoUrl !== undefined) {
  addUpdate('video_url', videoUrl.trim() || null);
}
    if (updates.length === 0) {
  return res.status(400).json({
    error: 'no_changes_provided',
    message: 'Please provide at least one field to update.'
  });
}
    values.push(id);

const updateQuery = `
  UPDATE content_items
  SET ${updates.join(', ')},
      updated_at = NOW()
  WHERE id = $${values.length}
    AND deleted_at IS NULL
  RETURNING
    id,
    title,
    description,
    content_type,
    artwork_url,
    video_url,
    status,
    rights_status,
    updated_at
`;
    try {
  const result = await db.query(updateQuery, values);

  if (result.rows.length === 0) {
    return res.status(404).json({
      error: 'movie_not_found',
      message: 'Movie not found or has been deleted.'
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Movie updated successfully.',
    content: result.rows[0]
  });
} catch (error) {
  return next(error);
}
  }
);

router.delete(
  '/admin/content/:id',
  requireAllowedOrigin,
  requireAdmin,
  async (req, res, next) => {
    const { id } = req.params;
const db = getPool(req);
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)
    ) {
      return res.status(400).json({
        error: 'invalid_content_id',
        message: 'Invalid movie ID.'
      });
    }

    try {
      const result = await db.query(
        `UPDATE content_items
         SET deleted_at = NOW(),
             updated_at = NOW()
         WHERE id = $1
           AND deleted_at IS NULL
         RETURNING id, title`,
        [id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: 'content_not_found',
          message: 'Movie not found.'
        });
      }

      return res.status(200).json({
        success: true,
        message: 'Movie deleted successfully.',
        content: result.rows[0]
      });
    } catch (error) {
      return next(error);
    }
  }
);
router.patch(
  '/admin/content/:id/publish',
  requireAllowedOrigin,
  requireAdmin,
  async (req, res, next) => {
    const { id } = req.params;
    const db = getPool(req);

    if (!db) {
      return res.status(503).json({
        error: 'database_unavailable',
        message: 'The database connection is unavailable.'
      });
    }
    const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

if (!uuidPattern.test(id)) {
  return res.status(400).json({
    error: 'invalid_movie_id',
    message: 'A valid movie ID is required.'
  });
}
    try {
  const result = await db.query(
    `SELECT id, title, status, rights_status
     FROM content_items
     WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({
      error: 'movie_not_found',
      message: 'Movie not found.'
    });
  }

  const movie = result.rows[0];

  if (movie.rights_status !== 'approved') {
    return res.status(403).json({
      error: 'rights_not_approved',
      message: 'This movie cannot be published until its distribution rights are approved.'
    });
  }
      const publishedResult = await db.query(
  `UPDATE content_items
   SET status = 'published',
       updated_at = NOW()
   WHERE id = $1
     AND deleted_at IS NULL
     AND rights_status = 'approved'
   RETURNING id, title, status, rights_status`,
  [id]
);

if (publishedResult.rows.length === 0) {
  return res.status(409).json({
    error: 'publishing_conditions_not_met',
    message: 'Movie could not be published. Check its distribution rights.'
  });
}

return res.status(200).json({
  success: true,
  message: 'Movie published successfully.',
  content: publishedResult.rows[0]
});
} catch (error) {
  return next(error);
}
  }
);
// Distribution Rights Approval
router.patch(
  '/admin/content/:id/approve-rights',
  requireAllowedOrigin,
  requireAdmin,
  async (req, res, next) => {
    const { id } = req.params;
    const db = getPool(req);
    // Rights approval must use a single database transaction.
// The review decision, movie rights status, and audit log
// must either all succeed or all be rolled back.
// Do not enable approval until these safeguards are implemented.
    const reviewerId = req.admin?.id;
const reviewerEmail = req.admin?.email;

if (!reviewerId || !reviewerEmail) {
  return res.status(403).json({
    error: 'reviewer_identity_missing',
    message: 'An authenticated administrator identity is required.'
  });
  
const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

if (!uuidPattern.test(id)) {
  return res.status(400).json({
    error: 'invalid_movie_id',
    message: 'A valid movie ID is required.'
  });
}
    if (!db) {
      return res.status(503).json({
        error: 'database_unavailable',
        message: 'The database connection is unavailable.'
      });
    }
  // Future approval transaction will use db.connect()
// with BEGIN, COMMIT, ROLLBACK, and client.release().
// Keep the current database lookups read-only until
// the complete approval and audit workflow is implemented.
 let client;
  let transactionStarted = false;
try {
  client = await db.connect();
  const movieResult = await db.query(
    `SELECT id, title, status, rights_status
     FROM content_items
     WHERE id = $1 AND deleted_at IS NULL`,
    [id]
  );

  if (movieResult.rows.length === 0) {
    return res.status(404).json({
      error: 'movie_not_found',
      message: 'Movie not found.'
    });
  }
const rightsResult = await db.query(
  `SELECT id, content_id, review_status,
          rights_holder_name, license_reference,
          evidence_url, license_start_date,
          license_expiry_date
   FROM content_rights_reviews
   WHERE content_id = $1
   ORDER BY created_at DESC
   LIMIT 1`,
  [id]
);

if (rightsResult.rows.length === 0) {
  return res.status(409).json({
    error: 'rights_review_missing',
    message: 'No distribution rights review has been submitted for this movie.'
  });
}
 const rightsReview = rightsResult.rows[0];

if (
  !rightsReview.rights_holder_name?.trim() ||
  !rightsReview.license_reference?.trim() ||
  !rightsReview.evidence_url?.trim()
) {
  return res.status(409).json({
    error: 'rights_evidence_incomplete',
    message: 'Rights holder, license reference, and supporting evidence are required.'
  });
}
 const today = new Date();
today.setUTCHours(0, 0, 0, 0);

const licenseStart = rightsReview.license_start_date
  ? new Date(rightsReview.license_start_date)
  : null;

const licenseExpiry = rightsReview.license_expiry_date
  ? new Date(rightsReview.license_expiry_date)
  : null;

if (
  !licenseStart ||
  !licenseExpiry ||
  Number.isNaN(licenseStart.getTime()) ||
  Number.isNaN(licenseExpiry.getTime()) ||
  licenseStart > today ||
  licenseExpiry < today ||
  licenseExpiry < licenseStart
) {
  return res.status(409).json({
    error: 'invalid_license_dates',
    message: 'The distribution licence must have valid start and expiry dates covering today.'
  });
} 
} catch (error) {
  if (client && transactionStarted) {
    try {
      await client.query('ROLLBACK');
      transactionStarted = false;
    } catch (rollbackError) {
      console.error('Rights approval rollback failed:', rollbackError);
    }
  }

  return next(error);
} finally {
  if (client) {
    client.release(transactionStarted);
  }
}
    return res.status(501).json({
      error: 'rights_approval_not_implemented',
      message: 'Rights approval requires verified evidence and an audit trail.'
    });
  }
);

export default router;


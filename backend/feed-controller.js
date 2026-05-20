/**
 * Feed logs controller
 * Handles recording feed logs and analyzing feed efficiency
 */

import { query, getAll } from './config-database.js';

/**
 * GET /api/feed-logs
 * List all feed logs with pagination
 */
export const getFeedLogs = async (req, res) => {
  try {
    const result = await query(
      `SELECT f.id, f.animal_id, a.tag_number, f.feed_type, f.quantity_kg, f.date_fed, f.cost_per_kg, f.total_cost, f.notes, f.created_at
       FROM feed_logs f
       JOIN animals a ON f.animal_id = a.id
       WHERE a.created_by = $1
       ORDER BY f.date_fed DESC, f.created_at DESC
       LIMIT 100`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get feed logs error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

/**
 * POST /api/feed-logs
 * Log a feed entry
 */
export const createFeedLog = async (req, res) => {
  const { animal_id, feed_type, quantity_kg, date_fed, cost_per_kg } = req.body;
  const userId = req.user.id;

  if (!animal_id || !feed_type || !quantity_kg || !cost_per_kg) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Animal ID, feed type, quantity in kg, and cost per kg are required',
    });
  }

  try {
    const qty = parseFloat(quantity_kg);
    const cost = parseFloat(cost_per_kg);
    const total_cost = qty * cost;

    const result = await query(
      `INSERT INTO feed_logs (animal_id, feed_type, quantity_kg, date_fed, cost_per_kg, total_cost, recorded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, animal_id, feed_type, quantity_kg, date_fed, cost_per_kg, total_cost`,
      [animal_id, feed_type, qty, date_fed || new Date().toISOString().split('T')[0], cost, total_cost, userId]
    );

    res.status(201).json({
      message: 'Feed entry recorded successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Create feed log error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

/**
 * GET /api/feed-logs/efficiency
 * Aggregate feed efficiency analysis metrics
 */
export const getFeedEfficiency = async (req, res) => {
  try {
    const result = await query(
      `SELECT 
         a.id as animal_id,
         a.tag_number,
         fl.feed_type,
         SUM(fl.quantity_kg) as total_qty_kg,
         SUM(fl.total_cost) as total_cost,
         COALESCE(w_last.weight_kg - w_first.weight_kg, 0) as weight_gain_kg
       FROM animals a
       JOIN feed_logs fl ON a.id = fl.animal_id
       LEFT JOIN LATERAL (
         SELECT weight_kg FROM weight_records WHERE animal_id = a.id ORDER BY recorded_date ASC LIMIT 1
       ) w_first ON true
       LEFT JOIN LATERAL (
         SELECT weight_kg FROM weight_records WHERE animal_id = a.id ORDER BY recorded_date DESC LIMIT 1
       ) w_last ON true
       WHERE a.status = 'active' AND a.created_by = $1
       GROUP BY a.id, a.tag_number, fl.feed_type, w_last.weight_kg, w_first.weight_kg
       ORDER BY weight_gain_kg DESC`,
      [req.user.id]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Get feed efficiency error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

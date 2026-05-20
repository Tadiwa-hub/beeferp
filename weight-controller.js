/**
 * Weight Records Controller
 * Handles weight tracking and ADG calculations
 */

import { query, getOne, getAll } from './config-database.js';

/**
 * GET /api/weight-records/:animalId
 * Get weight history for an animal
 */
export const getWeightRecords = async (req, res) => {
  const { animalId } = req.params;
  const days = Math.min(365, Math.max(1, parseInt(req.query.days) || 30));

  try {
    const records = await getAll(
      `SELECT id, animal_id, recorded_date, weight_kg, recorded_by, notes, created_at
       FROM weight_records
       WHERE animal_id = $1 
         AND recorded_date >= CURRENT_DATE - INTERVAL '1 day' * $2
       ORDER BY recorded_date ASC`,
      [animalId, days]
    );

    res.json({
      data: records,
      animal_id: animalId,
      period_days: days,
    });
  } catch (error) {
    console.error('Get weight records error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * POST /api/weight-records
 * Add single weight record
 */
export const createWeightRecord = async (req, res) => {
  const { animal_id, recorded_date, weight_kg, notes } = req.body;
  const userId = req.user.id;

  if (!animal_id || !weight_kg) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Animal ID and weight are required',
    });
  }

  try {
    // Verify animal exists
    const animal = await getOne('SELECT id FROM animals WHERE id = $1', [animal_id]);
    if (!animal) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Animal not found',
      });
    }

    // Create weight record
    const result = await query(
      `INSERT INTO weight_records (animal_id, recorded_date, weight_kg, recorded_by, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, animal_id, recorded_date, weight_kg, recorded_by, notes, created_at`,
      [animal_id, recorded_date || new Date().toISOString().split('T')[0], weight_kg, userId, notes || null]
    );

    const record = result.rows[0];

    // Update animal's current weight
    await query(
      'UPDATE animals SET current_weight = $1, updated_at = NOW() WHERE id = $2',
      [weight_kg, animal_id]
    );

    res.status(201).json({
      message: 'Weight recorded successfully',
      data: record,
    });
  } catch (error) {
    console.error('Create weight record error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * POST /api/weight-records/bulk
 * Add multiple weight records at once (for bulk daily weighing)
 */
export const createBulkWeightRecords = async (req, res) => {
  const { records } = req.body;
  const userId = req.user.id;

  if (!Array.isArray(records) || records.length === 0) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Records array is required and must not be empty',
    });
  }

  try {
    const createdRecords = [];
    const recordDate = new Date().toISOString().split('T')[0];

    for (const record of records) {
      const { animal_id, weight_kg, notes } = record;

      if (!animal_id || !weight_kg) {
        return res.status(400).json({
          error: 'Validation Error',
          message: `Invalid record: animal_id and weight_kg required`,
        });
      }

      // Verify animal exists
      const animal = await getOne('SELECT id FROM animals WHERE id = $1', [animal_id]);
      if (!animal) {
        return res.status(404).json({
          error: 'Not Found',
          message: `Animal ${animal_id} not found`,
        });
      }

      // Create weight record
      const result = await query(
        `INSERT INTO weight_records (animal_id, recorded_date, weight_kg, recorded_by, notes)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, animal_id, recorded_date, weight_kg, created_at`,
        [animal_id, recordDate, weight_kg, userId, notes || null]
      );

      createdRecords.push(result.rows[0]);

      // Update animal's current weight
      await query(
        'UPDATE animals SET current_weight = $1, updated_at = NOW() WHERE id = $2',
        [weight_kg, animal_id]
      );
    }

    res.status(201).json({
      message: `${createdRecords.length} weight records created successfully`,
      data: createdRecords,
    });
  } catch (error) {
    console.error('Bulk weight records error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * GET /api/weight-records/:animalId/adg
 * Calculate Average Daily Gain for an animal
 */
export const calculateADG = async (req, res) => {
  const { animalId } = req.params;
  const days = Math.min(365, Math.max(1, parseInt(req.query.days) || 7));

  try {
    const result = await query(
      `SELECT 
         a.id,
         a.tag_number,
         w_first.weight_kg as weight_start,
         w_last.weight_kg as weight_current,
         ROUND((w_last.weight_kg - w_first.weight_kg) / $2::numeric, 2) as adg,
         ROUND((w_last.weight_kg - w_first.weight_kg)::numeric, 2) as total_gain,
         w_first.recorded_date as date_start,
         w_last.recorded_date as date_end
       FROM animals a
       LEFT JOIN LATERAL (
         SELECT weight_kg, recorded_date 
         FROM weight_records 
         WHERE animal_id = a.id 
           AND recorded_date >= CURRENT_DATE - INTERVAL '1 day' * $2
         ORDER BY recorded_date ASC 
         LIMIT 1
       ) w_first ON true
       LEFT JOIN LATERAL (
         SELECT weight_kg, recorded_date 
         FROM weight_records 
         WHERE animal_id = a.id 
           AND recorded_date >= CURRENT_DATE - INTERVAL '1 day' * $2
         ORDER BY recorded_date DESC 
         LIMIT 1
       ) w_last ON true
       WHERE a.id = $1`,
      [animalId, days]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Animal or weight data not found',
      });
    }

    const adgData = result.rows[0];

    res.json({
      ...adgData,
      period_days: days,
    });
  } catch (error) {
    console.error('Calculate ADG error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * GET /api/weight-records/animals/all-adg
 * Get ADG for all active animals
 */
export const getAllADG = async (req, res) => {
  const days = Math.min(365, Math.max(1, parseInt(req.query.days) || 7));

  try {
    const result = await getAll(
      `SELECT 
         a.id,
         a.tag_number,
         a.current_weight,
         a.target_weight,
         w_first.weight_kg as weight_start,
         w_last.weight_kg as weight_current,
         ROUND((w_last.weight_kg - w_first.weight_kg) / $1::numeric, 2) as adg,
         ROUND((w_last.weight_kg - w_first.weight_kg)::numeric, 2) as total_gain
       FROM animals a
       LEFT JOIN LATERAL (
         SELECT weight_kg 
         FROM weight_records 
         WHERE animal_id = a.id 
           AND recorded_date >= CURRENT_DATE - INTERVAL '1 day' * $1
         ORDER BY recorded_date ASC 
         LIMIT 1
       ) w_first ON true
       LEFT JOIN LATERAL (
         SELECT weight_kg 
         FROM weight_records 
         WHERE animal_id = a.id 
           AND recorded_date >= CURRENT_DATE - INTERVAL '1 day' * $1
         ORDER BY recorded_date DESC 
         LIMIT 1
       ) w_last ON true
       WHERE a.status = 'active'
       ORDER BY adg DESC`,
      [days]
    );

    res.json({
      data: result,
      period_days: days,
      total_animals: result.length,
    });
  } catch (error) {
    console.error('Get all ADG error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * GET /api/weight-records/weight-loss-alerts
 * Get animals with weight loss (alert system)
 */
export const getWeightLossAlerts = async (req, res) => {
  try {
    const result = await getAll(
      `SELECT 
         a.id,
         a.tag_number,
         w_prev.weight_kg as previous_weight,
         w_last.weight_kg as current_weight,
         ROUND((w_last.weight_kg - w_prev.weight_kg)::numeric, 2) as weight_change,
         w_prev.recorded_date as previous_date,
         w_last.recorded_date as current_date
       FROM animals a
       LEFT JOIN LATERAL (
         SELECT weight_kg, recorded_date 
         FROM weight_records 
         WHERE animal_id = a.id 
         ORDER BY recorded_date DESC 
         LIMIT 2 OFFSET 1
       ) w_prev ON true
       LEFT JOIN LATERAL (
         SELECT weight_kg, recorded_date 
         FROM weight_records 
         WHERE animal_id = a.id 
         ORDER BY recorded_date DESC 
         LIMIT 1
       ) w_last ON true
       WHERE a.status = 'active'
         AND w_last.weight_kg < w_prev.weight_kg
       ORDER BY (w_last.weight_kg - w_prev.weight_kg) ASC`
    );

    res.json({
      data: result,
      total_alerts: result.length,
    });
  } catch (error) {
    console.error('Weight loss alerts error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

export default {
  getWeightRecords,
  createWeightRecord,
  createBulkWeightRecords,
  calculateADG,
  getAllADG,
  getWeightLossAlerts,
};

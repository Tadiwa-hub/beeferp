/**
 * Veterinary records controller
 * Handles recording health log and immunization/vaccination events
 */

import { query } from './config-database.js';

/**
 * GET /api/vet-records
 * List all vet records
 */
export const getVetRecords = async (req, res) => {
  try {
    const result = await query(
      `SELECT v.id, v.animal_id, a.tag_number, v.vaccination_name, v.date_administered, v.next_due_date, v.vet_notes, v.cost, v.created_at
       FROM vet_records v
       JOIN animals a ON v.animal_id = a.id
       WHERE a.created_by = $1 AND a.status = 'active'
       ORDER BY v.date_administered DESC, v.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Get vet records error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

/**
 * POST /api/vet-records
 * Create a new vet record / vaccination event
 */
export const createVetRecord = async (req, res) => {
  const { animal_id, vaccination_name, date_administered, next_due_date, vet_notes, cost } = req.body;
  const userId = req.user.id;

  if (!animal_id || !vaccination_name || !date_administered) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Animal ID, vaccination name, and administration date are required',
    });
  }

  try {
    const result = await query(
      `INSERT INTO vet_records (animal_id, vaccination_name, date_administered, next_due_date, vet_notes, cost, recorded_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, animal_id, vaccination_name, date_administered, next_due_date, vet_notes, cost`,
      [
        animal_id,
        vaccination_name,
        date_administered,
        next_due_date || null,
        vet_notes || '',
        cost ? parseFloat(cost) : 0,
        userId
      ]
    );

    res.status(201).json({
      message: 'Veterinary entry recorded successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Create vet record error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

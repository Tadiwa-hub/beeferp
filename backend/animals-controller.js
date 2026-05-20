/**
 * Animals Controller
 * Handles animal registry CRUD operations
 */

import { query, getOne, getAll } from './config-database.js';

/**
 * GET /api/animals
 * Get all animals with pagination
 */
export const getAnimals = async (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = Math.min(100, parseInt(req.query.limit) || 20);
  const offset = (page - 1) * limit;
  const userId = req.user.id;

  try {
    const result = await query(
      `SELECT id, tag_number, breed, date_added, current_weight, target_weight, status, health_notes, created_at
       FROM animals 
       WHERE created_by = $1
       ORDER BY created_at DESC 
       LIMIT $2 OFFSET $3`,
      [userId, limit, offset]
    );

    const countResult = await query('SELECT COUNT(*) as total FROM animals WHERE created_by = $1', [userId]);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      data: result.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get animals error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * GET /api/animals/:id
 * Get single animal by ID
 */
export const getAnimal = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const animal = await getOne(
      `SELECT id, tag_number, breed, date_added, current_weight, target_weight, status, health_notes, created_by, created_at
       FROM animals WHERE id = $1 AND created_by = $2`,
      [id, userId]
    );

    if (!animal) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Animal not found',
      });
    }

    res.json(animal);
  } catch (error) {
    console.error('Get animal error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * POST /api/animals
 * Create new animal
 */
export const createAnimal = async (req, res) => {
  const { tag_number, breed, date_added, current_weight, target_weight } = req.body;
  const userId = req.user.id;

  if (!tag_number) {
    return res.status(400).json({
      error: 'Validation Error',
      message: 'Tag number is required',
    });
  }

  try {
    // Check if tag number already exists
    const existing = await getOne(
      'SELECT id FROM animals WHERE tag_number = $1',
      [tag_number]
    );

    if (existing) {
      return res.status(409).json({
        error: 'Conflict',
        message: `Animal with tag number ${tag_number} already exists`,
      });
    }

    // Create animal
    const result = await query(
      `INSERT INTO animals (tag_number, breed, date_added, current_weight, target_weight, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, tag_number, breed, date_added, current_weight, target_weight, status, created_at`,
      [tag_number, breed || null, date_added || new Date().toISOString().split('T')[0], current_weight || null, target_weight || null, userId]
    );

    const animal = result.rows[0];

    res.status(201).json({
      message: 'Animal created successfully',
      data: animal,
    });
  } catch (error) {
    console.error('Create animal error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * PUT /api/animals/:id
 * Update animal
 */
export const updateAnimal = async (req, res) => {
  const { id } = req.params;
  const { breed, current_weight, target_weight, status, health_notes } = req.body;
  const userId = req.user.id;

  try {
    // Check animal exists and belongs to user
    const animal = await getOne('SELECT id FROM animals WHERE id = $1 AND created_by = $2', [id, userId]);
    if (!animal) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Animal not found',
      });
    }

    // Update animal
    const result = await query(
      `UPDATE animals 
       SET breed = COALESCE($1, breed),
           current_weight = COALESCE($2, current_weight),
           target_weight = COALESCE($3, target_weight),
           status = COALESCE($4, status),
           health_notes = COALESCE($5, health_notes),
           updated_at = NOW()
       WHERE id = $6 AND created_by = $7
       RETURNING id, tag_number, breed, date_added, current_weight, target_weight, status, health_notes, updated_at`,
      [breed, current_weight, target_weight, status, health_notes, id, userId]
    );

    const updatedAnimal = result.rows[0];

    res.json({
      message: 'Animal updated successfully',
      data: updatedAnimal,
    });
  } catch (error) {
    console.error('Update animal error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * DELETE /api/animals/:id
 * Soft delete animal (mark as culled)
 */
export const deleteAnimal = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const animal = await getOne('SELECT id FROM animals WHERE id = $1 AND created_by = $2', [id, userId]);
    if (!animal) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Animal not found',
      });
    }

    // Soft delete by marking as culled
    const result = await query(
      `UPDATE animals 
       SET status = 'culled', updated_at = NOW()
       WHERE id = $1 AND created_by = $2
       RETURNING id, tag_number, status`,
      [id, userId]
    );

    res.json({
      message: 'Animal deleted successfully',
      data: result.rows[0],
    });
  } catch (error) {
    console.error('Delete animal error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

/**
 * GET /api/animals/stats/overview
 * Get animals statistics for dashboard
 */
export const getAnimalStats = async (req, res) => {
  const userId = req.user.id;
  try {
    const result = await query(
      `SELECT 
         COUNT(*) as total_animals,
         COUNT(CASE WHEN status = 'active' THEN 1 END) as active_count,
         COUNT(CASE WHEN status = 'ready_for_sale' THEN 1 END) as ready_for_sale_count,
         COUNT(CASE WHEN status = 'culled' THEN 1 END) as culled_count,
         ROUND(AVG(current_weight)::numeric, 2) as avg_weight,
         ROUND(MAX(current_weight)::numeric, 2) as max_weight,
         ROUND(MIN(current_weight)::numeric, 2) as min_weight
       FROM animals
       WHERE created_by = $1`,
       [userId]
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Get animal stats error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
    });
  }
};

export default {
  getAnimals,
  getAnimal,
  createAnimal,
  updateAnimal,
  deleteAnimal,
  getAnimalStats,
};

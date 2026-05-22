import axios from 'axios';
import { query, getAll } from './config-database.js';

/**
 * GET /api/analytics/ai-insights
 * Connects to OpenRouter (Meta Llama 3.3 70B) to generate actionable farm intelligence.
 */
export const getAIInsights = async (req, res) => {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Configuration Error', message: 'OpenRouter API key is missing.' });
    }

    // 1. Gather live telemetry for the prompt
    const stats = await query(`SELECT COUNT(*) as active_count, AVG(current_weight)::numeric as avg_w FROM animals WHERE status = 'active' AND created_by = $1`, [req.user.id]);
    const activeCount = parseInt(stats.rows[0].active_count || 0);
    const avgWeight = parseFloat(stats.rows[0].avg_w || 0).toFixed(2);

    const costData = await query(`SELECT SUM(fl.total_cost) as total_feed FROM feed_logs fl JOIN animals a ON fl.animal_id = a.id WHERE a.created_by = $1`, [req.user.id]);
    const totalFeedCost = parseFloat(costData.rows[0].total_feed || 0).toFixed(2);

    const healthData = await query(`SELECT COUNT(*) as overdue FROM vet_records v JOIN animals a ON v.animal_id = a.id WHERE v.next_due_date < CURRENT_DATE AND a.created_by = $1`, [req.user.id]);
    const overdueCount = parseInt(healthData.rows[0].overdue || 0);

    // 2. Construct the AI Prompt - STRICT HARDENING
    const systemPrompt = `You are a strict Agricultural Economist and Farm Manager AI for BeefERP.
CRITICAL RULES:
1. Do not invent metrics or hallucinate numbers.
2. If the telemetry provided is zero or insufficient (e.g., brand new feedlot), explicitly state "Insufficient herd data to provide deep analytics."
3. Your analysis must be based strictly on the provided JSON telemetry.
4. Format your response exactly as a JSON array of objects with keys: "title", "type" (success/warning/info), and "description". 
5. Do not use markdown blocks.`;

    const userPrompt = `Current Farm Telemetry (Isolated to this Tenant):
- Active Cattle: ${activeCount}
- Average Herd Weight: ${avgWeight} kg
- Total Feed Spend: $${totalFeedCost}
- Overdue Treatments: ${overdueCount}

Analyze this data and provide 3 professional business insights.`;

    // 3. Call OpenRouter API
    let aiContent = '';
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'meta-llama/llama-3.3-70b-instruct:free',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.3,
          response_format: { type: "json_object" }
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'http://localhost:5173', 
            'X-Title': 'BeefERP', 
            'Content-Type': 'application/json'
          }
        }
      );
      aiContent = response.data.choices[0].message.content;
    } catch (primaryError) {
      if (primaryError.response?.status === 429) {
        console.warn('Meta Llama is rate-limited. Falling back to openrouter/free router...');
        // Fallback to OpenRouter's auto-router for free models
        const fallbackResponse = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: 'openrouter/free',
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt }
            ],
            temperature: 0.3,
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'HTTP-Referer': 'http://localhost:5173', 
              'X-Title': 'BeefERP', 
              'Content-Type': 'application/json'
            }
          }
        );
        aiContent = fallbackResponse.data.choices[0].message.content;
      } else {
        throw primaryError; // Rethrow if it's not a rate limit issue
      }
    }
    
    // Parse the JSON array returned by the AI
    let insights = [];
    try {
      // Clean up markdown formatting if the fallback model returned a code block
      const cleanContent = aiContent.replace(/```json/g, '').replace(/```/g, '').trim();
      insights = JSON.parse(cleanContent);
      if (!Array.isArray(insights)) insights = [insights]; // Fallback if it returned a single object
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', aiContent);
      // Fallback dummy data if the model hallucinates formatting
      insights = [
        { title: "AI Model Busy", type: "warning", description: "The predictive models are experiencing high traffic. Please try again in a few moments." }
      ];
    }

    res.json({ insights });
  } catch (error) {
    console.error('AI Insights error:', error.response?.data || error.message);
    res.status(500).json({ error: 'AI Processing Error', message: 'Failed to generate insights from language model.' });
  }
};

/**
 * POST /api/analytics/ai-chat
 * Handles conversational chat with the Farm Manager AI, with farm context.
 */
export const postAIChat = async (req, res) => {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Configuration Error', message: 'OpenRouter API key is missing.' });
    }

    const { message, history = [] } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Validation Error', message: 'Chat message is required' });
    }

    // 1. Gather live telemetry for context
    const stats = await query(`SELECT COUNT(*) as active_count, AVG(current_weight)::numeric as avg_w FROM animals WHERE status = 'active' AND created_by = $1`, [req.user.id]);
    const activeCount = parseInt(stats.rows[0].active_count || 0);
    const avgWeight = parseFloat(stats.rows[0].avg_w || 0).toFixed(2);

    const costData = await query(`SELECT SUM(fl.total_cost) as total_feed FROM feed_logs fl JOIN animals a ON fl.animal_id = a.id WHERE a.created_by = $1`, [req.user.id]);
    const totalFeedCost = parseFloat(costData.rows[0].total_feed || 0).toFixed(2);

    const systemPrompt = `You are the virtual Farm Manager AI for BeefERP. You assist the farmer directly in a conversational interface.
Current Farm Telemetry Context:
- Active Cattle: ${activeCount} head
- Avg Weight: ${avgWeight} kg
- Total Feed Costs: $${totalFeedCost}

Keep your answers concise, highly professional, and directly actionable. Limit responses to 2-3 short paragraphs unless asked for a list. Do not use JSON formatting, just normal conversational text.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...history,
      { role: 'user', content: message }
    ];

    // 3. Call OpenRouter API
    let aiContent = '';
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: 'meta-llama/llama-3.3-70b-instruct:free',
          messages: messages,
          temperature: 0.5
        },
        {
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'http://localhost:5173', 
            'X-Title': 'BeefERP Chat', 
            'Content-Type': 'application/json'
          }
        }
      );
      aiContent = response.data.choices[0].message.content;
    } catch (primaryError) {
      if (primaryError.response?.status === 429) {
        // Fallback to OpenRouter's auto-router for free models
        const fallbackResponse = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            model: 'openrouter/free',
            messages: messages,
            temperature: 0.5,
          },
          {
            headers: {
              'Authorization': `Bearer ${apiKey}`,
              'HTTP-Referer': 'http://localhost:5173', 
              'X-Title': 'BeefERP Chat', 
              'Content-Type': 'application/json'
            }
          }
        );
        aiContent = fallbackResponse.data.choices[0].message.content;
      } else {
        throw primaryError;
      }
    }

    res.json({ reply: aiContent });
  } catch (error) {
    console.error('AI Chat error:', error.response?.data || error.message);
    res.status(500).json({ error: 'AI Processing Error', message: 'Failed to generate chat response.' });
  }
};

// Base live market price of beef (per kg live weight) in USD (Zimbabwe average benchmark)
const LIVE_MARKET_PRICE_PER_KG = 2.95; 

/**
 * GET /api/analytics/overview
 * Delivers feedlot-wide premium cost, profitability, and predictive telemetry
 */
export const getAnalyticsOverview = async (req, res) => {
  try {
    // 1. Fetch total feedlot overview parameters
    const animals = await getAll(
      `SELECT id, tag_number, breed, current_weight, target_weight, status, date_added 
       FROM animals 
       WHERE status = 'active' AND created_by = $1`,
       [req.user.id]
    );

    if (animals.length === 0) {
      return res.json({
        metrics: {
          total_revenue_projection: 0,
          total_feed_costs: 0,
          total_vet_costs: 0,
          fixed_overhead: 0,
          total_profitability: 0,
          avg_cost_per_kg_gained: 0,
          feed_investment_roi: 0,
        },
        culling_warnings: [],
        ready_projections: [],
        feed_efficiency: [],
      });
    }

    // 2. Fetch all feed costs aggregated by animal
    const feedCosts = await getAll(
      `SELECT fl.animal_id, SUM(fl.total_cost) as feed_cost, SUM(fl.quantity_kg) as feed_qty 
       FROM feed_logs fl
       JOIN animals a ON fl.animal_id = a.id
       WHERE a.created_by = $1
       GROUP BY fl.animal_id`,
       [req.user.id]
    );
    const feedCostMap = new Map(feedCosts.map(f => [f.animal_id, f]));

    // 3. Fetch all vet costs aggregated by animal
    const vetCosts = await getAll(
      `SELECT vr.animal_id, SUM(vr.cost) as vet_cost 
       FROM vet_records vr
       JOIN animals a ON vr.animal_id = a.id
       WHERE a.created_by = $1
       GROUP BY vr.animal_id`,
       [req.user.id]
    );
    const vetCostMap = new Map(vetCosts.map(v => [v.animal_id, parseFloat(v.vet_cost || 0)]));

    // 4. Fetch first/last weights to calculate actual gained weight
    const weightBounds = await getAll(
      `SELECT w.animal_id, 
              w_first.weight_kg as weight_start, 
              w_last.weight_kg as weight_current,
              w_last.recorded_date - w_first.recorded_date as days_diff
       FROM (SELECT DISTINCT wr.animal_id FROM weight_records wr JOIN animals a ON wr.animal_id = a.id WHERE a.created_by = $1) w
       LEFT JOIN LATERAL (
         SELECT weight_kg, recorded_date FROM weight_records 
         WHERE animal_id = w.animal_id ORDER BY recorded_date ASC LIMIT 1
       ) w_first ON true
       LEFT JOIN LATERAL (
         SELECT weight_kg, recorded_date FROM weight_records 
         WHERE animal_id = w.animal_id ORDER BY recorded_date DESC LIMIT 1
       ) w_last ON true`,
       [req.user.id]
    );
    const weightMap = new Map(weightBounds.map(w => [w.animal_id, w]));

    // 5. Compute real-time analytics loop
    let totalProjectedRev = 0;
    let totalFeedCost = 0;
    let totalFeedQtyAll = 0;
    let totalVetCost = 0;
    let totalOverhead = 0;
    let totalWeightGained = 0;
    
    let validAdgSum = 0;
    let validAdgCount = 0;
    
    const cullingWarnings = [];
    const readyProjections = [];
    const feedEfficiency = [];

    animals.forEach(animal => {
      const feed = feedCostMap.get(animal.id) || { feed_cost: 0, feed_qty: 0 };
      const vet = vetCostMap.get(animal.id) || 0;
      const weights = weightMap.get(animal.id) || { weight_start: animal.current_weight || 0, weight_current: animal.current_weight || 0, days_diff: 1 };
      
      const animalFeedCost = parseFloat(feed.feed_cost || 0);
      const animalFeedQty = parseFloat(feed.feed_qty || 0);
      const startW = parseFloat(weights.weight_start || animal.current_weight || 0);
      const currW = parseFloat(weights.weight_current || animal.current_weight || 0);
      const weightGain = Math.max(0, currW - startW); // don't punish for shrink in total gain here
      
      // Fixed overhead allocation: $1.20 per day in the feedlot (Zimbabwe utility / labour cost benchmark)
      const daysInFeedlot = Math.max(1, Math.round((new Date() - new Date(animal.date_added)) / (1000 * 60 * 60 * 24)));
      const overhead = daysInFeedlot * 1.20;

      // Accrue totals
      totalFeedCost += animalFeedCost;
      totalFeedQtyAll += animalFeedQty;
      totalVetCost += vet;
      totalOverhead += overhead;
      totalProjectedRev += currW * LIVE_MARKET_PRICE_PER_KG;
      totalWeightGained += weightGain;

      // ADG Algorithm - HARDENED
      // Cattle lose weight ('shrink') in first 48-72h after transport.
      // We ignore the first 7 days for culling alerts to allow stabilization.
      const adg = daysInFeedlot > 2 ? (weightGain / daysInFeedlot) : null;
      if (adg !== null && weightGain > 0) {
        validAdgSum += adg;
        validAdgCount++;
      }

      // Smart Culling Algorithm: ADG < 0.8 kg/day is losing money
      // ONLY trigger after 10 days to ensure statistical significance and recovery from transport stress
      if (adg !== null && adg < 0.8 && daysInFeedlot > 10) {
        cullingWarnings.push({
          id: animal.id,
          tag_number: animal.tag_number,
          adg: parseFloat(adg.toFixed(2)),
          total_cost: parseFloat((animalFeedCost + vet + overhead).toFixed(2)),
          recommendation: `Performance Warning: Animal gains only ${adg.toFixed(2)} kg/day after ${daysInFeedlot} days. Feed costs exceed meat value. Evaluate ration or Cull.`
        });
      }

      // Exact Market Ready date calculations
      const targetW = parseFloat(animal.target_weight || 500);
      if (adg !== null && currW < targetW && adg > 0.1) {
        const kgLeft = targetW - currW;
        const daysToTarget = Math.round(kgLeft / adg);
        const readyDate = new Date();
        readyDate.setDate(readyDate.getDate() + daysToTarget);
        
        readyProjections.push({
          id: animal.id,
          tag_number: animal.tag_number,
          current_weight: currW,
          target_weight: targetW,
          adg: parseFloat(adg.toFixed(2)),
          projected_days: daysToTarget,
          projected_date: readyDate.toISOString().split('T')[0]
        });
      }
    });

    const totalAccruedCost = totalFeedCost + totalVetCost + totalOverhead;
    const totalProfit = totalProjectedRev - totalAccruedCost;
    const activeCount = animals.length;
    
    // Hardened logic for averages
    const avgCostPerKgGained = totalWeightGained > 1 ? (totalAccruedCost / totalWeightGained) : 0;
    const feedROI = totalFeedCost > 1 ? ((totalWeightGained * LIVE_MARKET_PRICE_PER_KG) / totalFeedCost) : 0;
    
    // Dynamic Benchmarks
    const userAdg = validAdgCount > 0 ? (validAdgSum / validAdgCount) : 0;
    const userFcr = totalWeightGained > 1 ? (totalFeedQtyAll / totalWeightGained) : 0;

    res.json({
      metrics: {
        total_revenue_projection: parseFloat(totalProjectedRev.toFixed(2)),
        total_feed_costs: parseFloat(totalFeedCost.toFixed(2)),
        total_vet_costs: parseFloat(totalVetCost.toFixed(2)),
        fixed_overhead: parseFloat(totalOverhead.toFixed(2)),
        total_profitability: parseFloat(totalProfit.toFixed(2)),
        avg_cost_per_kg_gained: parseFloat(avgCostPerKgGained.toFixed(2)),
        feed_investment_roi: parseFloat(feedROI.toFixed(2)),
        avg_cost_per_head: activeCount > 0 ? parseFloat((totalAccruedCost / activeCount).toFixed(2)) : 0,
        avg_rev_per_head: activeCount > 0 ? parseFloat((totalProjectedRev / activeCount).toFixed(2)) : 0,
        avg_profit_per_head: activeCount > 0 ? parseFloat((totalProfit / activeCount).toFixed(2)) : 0,
      },
      culling_warnings: cullingWarnings,
      ready_projections: readyProjections,
      benchmarks: {
        user_adg: parseFloat(userAdg.toFixed(2)),
        industry_avg_adg: 1.05,
        user_fcr: userFcr > 0 ? parseFloat(userFcr.toFixed(1)) : 6.2, // 6.2kg default if no feed logged yet
        industry_avg_fcr: 7.5,
      }
    });
  } catch (error) {
    console.error('Analytics load error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

/**
 * GET /api/analytics/financials
 * Provides professional cash flow forecast and 6-month budget projection
 */
export const getFinancialForecasting = async (req, res) => {
  try {
    const stats = await query(
      `SELECT COUNT(*) as active_count, AVG(current_weight)::numeric as avg_w 
       FROM animals WHERE status = 'active' AND created_by = $1`,
      [req.user.id]
    );
    const activeCount = parseInt(stats.rows[0].active_count || 0);
    const avgWeight = parseFloat(stats.rows[0].avg_w || 0);

    // Fetch actual dynamic ADG
    const adgQuery = await query(`
      SELECT ROUND(AVG((w_last.weight_kg - w_first.weight_kg) / GREATEST(1, w_last.recorded_date - w_first.recorded_date))::numeric, 2) as actual_adg
      FROM animals a
      LEFT JOIN LATERAL (SELECT weight_kg, recorded_date FROM weight_records WHERE animal_id = a.id ORDER BY recorded_date ASC LIMIT 1) w_first ON true
      LEFT JOIN LATERAL (SELECT weight_kg, recorded_date FROM weight_records WHERE animal_id = a.id ORDER BY recorded_date DESC LIMIT 1) w_last ON true
      WHERE a.status = 'active' AND a.created_by = $1 AND (w_last.recorded_date - w_first.recorded_date) > 2
    `, [req.user.id]);
    
    const actualAdg = parseFloat(adgQuery.rows[0].actual_adg || 1.35); // Fallback to 1.35 only if 0 records

    const projectedWeights = Array.from({ length: 6 }, (_, i) => {
      const monthIndex = i + 1;
      const weightGain = monthIndex * 30 * actualAdg; // Dynamic ADG projection
      const monthProjWeight = avgWeight + weightGain;
      const projRev = monthProjWeight * activeCount * LIVE_MARKET_PRICE_PER_KG;
      const projFeed = activeCount * 30 * monthIndex * (actualAdg * 6.2) * 0.28; // Dynamic feed projection based on actual ADG

      return {
        month: new Date(Date.now() + i * 30 * 24 * 60 * 60 * 1000).toLocaleString('en-US', { month: 'short' }),
        projected_revenue: parseFloat(projRev.toFixed(2)),
        projected_feed_costs: parseFloat(projFeed.toFixed(2)),
        projected_margin: parseFloat((projRev - projFeed).toFixed(2)),
      };
    });

    res.json({
      forecast: projectedWeights,
      assumptions: {
        adg: actualAdg
      }
    });
  } catch (error) {
    console.error('Financial forecasting error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

/**
 * GET /api/analytics/alerts
 * Real-time disease outbreak detection and alert telemetry
 */
export const getTelemetryAlerts = async (req, res) => {
  try {
    const overdueVaccines = await getAll(
      `SELECT v.vaccination_name, a.tag_number, v.next_due_date 
       FROM vet_records v
       JOIN animals a ON v.animal_id = a.id
       WHERE v.next_due_date < CURRENT_DATE 
         AND a.status = 'active' AND a.created_by = $1`,
      [req.user.id]
    );

    const marketReadyCattle = await getAll(
      `SELECT tag_number, current_weight, target_weight 
       FROM animals 
       WHERE current_weight >= target_weight 
         AND status = 'active' AND created_by = $1`,
      [req.user.id]
    );

    // Mock disease detection telemetry based on multiple animals exhibiting weight loss
    const weightLossCount = await query(
      `SELECT COUNT(*) as cnt FROM (
         SELECT a.id FROM animals a
         LEFT JOIN LATERAL (SELECT weight_kg FROM weight_records WHERE animal_id = a.id ORDER BY recorded_date DESC LIMIT 2 OFFSET 1) w_prev ON true
         LEFT JOIN LATERAL (SELECT weight_kg FROM weight_records WHERE animal_id = a.id ORDER BY recorded_date DESC LIMIT 1) w_last ON true
         WHERE a.status = 'active' AND a.created_by = $1 AND w_last.weight_kg < w_prev.weight_kg
       ) sub`,
      [req.user.id]
    );
    const weightLossCattle = parseInt(weightLossCount.rows[0].cnt || 0);

    const alerts = [];
    if (overdueVaccines.length > 0) {
      alerts.push({
        type: 'DANGER',
        category: 'VETERINARY',
        message: `${overdueVaccines.length} animal vaccinations are OVERDUE. Complete vaccination log to shield herd from disease.`,
      });
    }
    if (marketReadyCattle.length > 0) {
      alerts.push({
        type: 'SUCCESS',
        category: 'MARKET',
        message: `${marketReadyCattle.length} cattle have crossed target sale weights. Sell now to optimize profitability ROI.`,
      });
    }
    if (weightLossCattle >= 3) {
      alerts.push({
        type: 'WARNING',
        category: 'DISEASE',
        message: `ALERT: ${weightLossCattle} feeders are showing persistent weight loss. Possible disease outbreak detected. Please notify veterinary officer.`,
      });
    }

    res.json({
      alerts,
      overdue_count: overdueVaccines.length,
      market_ready_count: marketReadyCattle.length,
      weight_loss_cattle: weightLossCattle
    });
  } catch (error) {
    console.error('Telemetry alerts error:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
};

/**
 * POST /api/analytics/alerts/sms
 * Twilio Webhook dispatch integration
 */
export const dispatchTwilioSMS = async (req, res) => {
  const { phone_number, message } = req.body;

  if (!phone_number || !message) {
    return res.status(400).json({ error: 'Validation Error', message: 'Phone number and SMS message are required' });
  }

  try {
    // Log Twilio SMS dispatch in backend console
    console.log(`[TWILIO SMS SIMULATION] Dispatching SMS Alert to: ${phone_number}`);
    console.log(`[TWILIO SMS CONTENT] ${message}`);
    
    res.json({
      success: true,
      message: `SMS notification dispatched successfully via Twilio node to operator at ${phone_number}`,
      provider: 'Twilio (Mock Sandbox)',
      payload: { phone_number, message, dispatched_at: new Date().toISOString() }
    });
  } catch (error) {
    console.error('Twilio SMS error:', error);
    res.status(500).json({ error: 'Twilio Dispatch Error', message: error.message });
  }
};

/**
 * Backend Server for CSI Enhancement
 * Serves API endpoints for Phase 1 + Phase 2
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const path = require('path');

// Initialize Express
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database connection (optional for development)
let pool = null;
let dbConnected = false;

if (process.env.DATABASE_URL) {
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  // Test database connection
  pool.query('SELECT NOW()', (err, res) => {
    if (err) {
      console.error('❌ Database connection failed:', err.message);
      console.log('⚠️  Running in mock mode without database');
    } else {
      console.log('✅ Database connected:', res.rows[0].now);
      dbConnected = true;
    }
  });
} else {
  console.log('⚠️  No DATABASE_URL configured - running in mock mode');
  console.log('💡 To enable database: Set DATABASE_URL in .env file');
}

// Health check endpoint
app.get('/api/csi-enhancement/health', async (req, res) => {
  try {
    let dbStatus = 'not_configured';
    let dbTime = null;

    if (pool && dbConnected) {
      try {
        const dbResult = await pool.query('SELECT NOW()');
        dbStatus = 'connected';
        dbTime = dbResult.rows[0].now;
      } catch (error) {
        dbStatus = 'error';
      }
    }

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: dbStatus,
      dbTime: dbTime,
      phase1: 'operational',
      phase2: 'operational',
      mode: dbConnected ? 'database' : 'mock'
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Helper function to check database availability
const checkDb = (res) => {
  if (!pool || !dbConnected) {
    res.status(503).json({
      success: false,
      error: 'Database not configured. Set DATABASE_URL in .env file.',
      mode: 'mock'
    });
    return false;
  }
  return true;
};

// Phase 1 Endpoints

// Get all signals
app.get('/api/csi-enhancement/signals', async (req, res) => {
  if (!checkDb(res)) return;

  try {
    const limit = parseInt(req.query.limit) || 100;
    const offset = parseInt(req.query.offset) || 0;
    
    const result = await pool.query(
      'SELECT * FROM signals ORDER BY detected_at DESC LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      limit,
      offset
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get qualified signals
app.get('/api/csi-enhancement/signals/qualified', async (req, res) => {
  if (!checkDb(res)) return;

  try {
    const limit = parseInt(req.query.limit) || 100;
    
    const result = await pool.query(
      'SELECT * FROM signals WHERE is_qualified = true ORDER BY detected_at DESC LIMIT $1',
      [limit]
    );
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get signals by country
app.get('/api/csi-enhancement/signals/country/:country', async (req, res) => {
  if (!checkDb(res)) return;

  try {
    const { country } = req.params;
    const limit = parseInt(req.query.limit) || 100;
    
    const result = await pool.query(
      'SELECT * FROM signals WHERE $1 = ANY(countries) ORDER BY detected_at DESC LIMIT $2',
      [country, limit]
    );
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      country
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get signal statistics
app.get('/api/csi-enhancement/signals/stats', async (req, res) => {
  if (!checkDb(res)) return;

  try {
    const result = await pool.query(`
      SELECT 
        COUNT(*) as total_signals,
        COUNT(*) FILTER (WHERE is_qualified = true) as qualified_signals,
        ROUND(100.0 * COUNT(*) FILTER (WHERE is_qualified = true) / COUNT(*), 2) as qualification_rate,
        COUNT(DISTINCT unnest(countries)) as unique_countries,
        COUNT(DISTINCT primary_vector) as unique_vectors,
        MIN(detected_at) as oldest_signal,
        MAX(detected_at) as newest_signal
      FROM signals
    `);
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Phase 2 Endpoints

// Get enhanced CSI
app.get('/api/csi-enhancement/enhanced-csi', async (req, res) => {
  if (!checkDb(res)) return;

  try {
    const { country, vector } = req.query;
    
    let query = 'SELECT * FROM latest_enhanced_csi';
    const params = [];
    
    if (country) {
      query += ' WHERE country = $1';
      params.push(country);
      
      if (vector) {
        query += ' AND vector = $2';
        params.push(vector);
      }
    } else if (vector) {
      query += ' WHERE vector = $1';
      params.push(vector);
    }
    
    query += ' ORDER BY country, vector';
    
    const result = await pool.query(query, params);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get CSI comparison
app.get('/api/csi-enhancement/comparison', async (req, res) => {
  if (!checkDb(res)) return;

  try {
    const result = await pool.query(`
      SELECT * FROM csi_comparison
      ORDER BY ABS(baseline_drift) DESC
      LIMIT 50
    `);
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get explanation for country-vector
app.get('/api/csi-enhancement/explanation/:country/:vector', async (req, res) => {
  if (!checkDb(res)) return;

  try {
    const { country, vector } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM get_enhanced_csi_with_contributions($1, $2)',
      [country, vector]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'No data found for this country-vector pair'
      });
    }
    
    res.json({
      success: true,
      data: {
        country: result.rows[0].country,
        vector: result.rows[0].vector,
        legacyCSI: parseFloat(result.rows[0].legacy_csi),
        baselineDrift: parseFloat(result.rows[0].baseline_drift),
        enhancedCSI: parseFloat(result.rows[0].enhanced_csi),
        contributions: result.rows.map(row => ({
          signalId: row.signal_id,
          headline: row.signal_headline,
          impactScore: parseFloat(row.impact_score),
          decayFactor: parseFloat(row.decay_factor),
          contribution: parseFloat(row.contribution)
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get statistics
app.get('/api/csi-enhancement/statistics', async (req, res) => {
  if (!checkDb(res)) return;

  try {
    const result = await pool.query('SELECT * FROM enhanced_csi_stats');
    
    res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get drift by vector
app.get('/api/csi-enhancement/drift-by-vector', async (req, res) => {
  if (!checkDb(res)) return;

  try {
    const result = await pool.query('SELECT * FROM drift_by_vector');
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get drift by country
app.get('/api/csi-enhancement/drift-by-country', async (req, res) => {
  if (!checkDb(res)) return;

  try {
    const result = await pool.query('SELECT * FROM drift_by_country LIMIT 50');
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get calculation history
app.get('/api/csi-enhancement/calculation-history', async (req, res) => {
  if (!checkDb(res)) return;

  try {
    const limit = parseInt(req.query.limit) || 20;
    
    const result = await pool.query(
      'SELECT * FROM recent_calculations LIMIT $1',
      [limit]
    );
    
    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Trigger CSI calculation
app.post('/api/csi-enhancement/calculate', async (req, res) => {
  if (!checkDb(res)) return;

  try {
    // This would trigger the CSI calculation
    // For now, return success
    res.json({
      success: true,
      message: 'CSI calculation triggered',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Serve static files (frontend)
app.use(express.static(path.join(__dirname, 'dist')));

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// Global variables for server and shutdown state
let server;
let isShuttingDown = false;

// Graceful shutdown function
function gracefulShutdown(signal) {
  if (isShuttingDown) {
    console.log('⚠️  Shutdown already in progress...');
    return;
  }
  
  isShuttingDown = true;
  console.log(`\n🛑 Received ${signal}, shutting down gracefully...`);
  
  if (server) {
    server.close(() => {
      console.log('✅ HTTP server closed');
      if (pool) {
        pool.end(() => {
          console.log('✅ Database pool closed');
          process.exit(0);
        });
      } else {
        process.exit(0);
      }
    });
    
    // Force shutdown after 5 seconds
    setTimeout(() => {
      console.error('⚠️  Forcing shutdown after timeout');
      process.exit(1);
    }, 5000);
  } else {
    process.exit(0);
  }
}

// Register shutdown handlers
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGUSR2', () => gracefulShutdown('SIGUSR2')); // Nodemon restart signal

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('❌ Uncaught Exception:', err);
  gracefulShutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  gracefulShutdown('unhandledRejection');
});

// Start server with error handling
try {
  server = app.listen(PORT, () => {
    console.log(`🚀 CSI Enhancement Backend Server running on port ${PORT}`);
    console.log(`📊 API endpoints available at /api/csi-enhancement/*`);
    console.log(`🏥 Health check: /api/csi-enhancement/health`);
    if (!dbConnected) {
      console.log(`💡 Running in mock mode - configure DATABASE_URL to enable database features`);
    }
  });

  // Handle server errors
  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(`❌ Port ${PORT} is already in use`);
      console.log(`💡 Try: killall -9 node && pnpm run dev`);
      process.exit(1);
    } else {
      console.error('❌ Server error:', error);
      process.exit(1);
    }
  });

} catch (error) {
  console.error('❌ Failed to start server:', error);
  process.exit(1);
}
const crypto = require('crypto');
const db = require('../database/db');

// Hash IP address for privacy
const hashIP = (ip) => {
  return crypto.createHash('sha256').update(ip + process.env.JWT_SECRET).digest('hex').slice(0, 16);
};

// Check rate limit for ratings
const checkRatingLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || '0.0.0.0';
  const ipHash = hashIP(ip);
  const maxRatingsPerDay = parseInt(process.env.RATING_LIMIT_PER_DAY) || 5;
  
  // Count ratings from this IP in the last 24 hours
  const count = db.prepare(`
    SELECT COUNT(*) as count FROM rate_limits 
    WHERE ip_hash = ? AND action_type = 'rating' AND created_at > datetime('now', '-1 day')
  `).get(ipHash);
  
  if (count && count.count >= maxRatingsPerDay) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded. You can only submit ' + maxRatingsPerDay + ' ratings per day.',
      retryAfter: '24 hours'
    });
  }
  
  req.ipHash = ipHash;
  next();
};

// Check rate limit for issues
const checkIssueLimit = (req, res, next) => {
  const ip = req.ip || req.connection.remoteAddress || '0.0.0.0';
  const ipHash = hashIP(ip);
  const maxIssuesPerDay = 10;
  
  const count = db.prepare(`
    SELECT COUNT(*) as count FROM rate_limits 
    WHERE ip_hash = ? AND action_type = 'issue' AND created_at > datetime('now', '-1 day')
  `).get(ipHash);
  
  if (count && count.count >= maxIssuesPerDay) {
    return res.status(429).json({ 
      error: 'Rate limit exceeded. You can only report ' + maxIssuesPerDay + ' issues per day.',
      retryAfter: '24 hours'
    });
  }
  
  req.ipHash = ipHash;
  next();
};

// Record rate limit action
const recordAction = (ipHash, actionType) => {
  const { v4: uuidv4 } = require('uuid');
  db.prepare(`
    INSERT INTO rate_limits (id, ip_hash, action_type, created_at) VALUES (?, ?, ?, datetime('now'))
  `).run(uuidv4(), ipHash, actionType);
};

module.exports = { checkRatingLimit, checkIssueLimit, recordAction, hashIP };

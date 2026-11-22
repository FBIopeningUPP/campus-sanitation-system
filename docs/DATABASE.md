# Database Schema

## Overview

The application uses SQLite for simplicity and portability. The database file is located at `/database/sanitation.db`.

## Entity Relationship Diagram

```
buildings (1) ──── (N) floors (1) ──── (N) washrooms (1) ──── (N) ratings
                                                    │
                                                    └──── (N) issues
```

## Tables

### buildings

Stores campus building information.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| name | TEXT | NOT NULL | Building name |
| code | TEXT | UNIQUE, NOT NULL | Short code (e.g., AB1) |
| description | TEXT | | Optional description |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

### floors

Stores floor information for each building.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| building_id | TEXT | FK → buildings.id | Parent building |
| floor_number | INTEGER | NOT NULL | 0 = Ground, 1 = First, etc. |
| floor_name | TEXT | | Display name |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

**Unique constraint:** (building_id, floor_number)

### washrooms

Stores individual washroom details.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| floor_id | TEXT | FK → floors.id | Parent floor |
| name | TEXT | NOT NULL | Washroom name |
| gender | TEXT | CHECK IN ('male', 'female', 'unisex') | Default: 'unisex' |
| qr_code | TEXT | UNIQUE, NOT NULL | Unique QR code identifier |
| average_rating | REAL | DEFAULT 0 | Calculated average (0-5) |
| total_ratings | INTEGER | DEFAULT 0 | Count of ratings |
| is_active | INTEGER | DEFAULT 1 | 1 = active, 0 = inactive |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

### ratings

Stores anonymous user ratings.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| washroom_id | TEXT | FK → washrooms.id | Rated washroom |
| rating | INTEGER | CHECK 1-5 | Star rating |
| feedback | TEXT | | Optional text feedback |
| photo_url | TEXT | | Optional photo path |
| ip_hash | TEXT | | Hashed IP for rate limiting |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

### issues

Stores reported issues/complaints.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| washroom_id | TEXT | FK → washrooms.id | Related washroom |
| issue_type | TEXT | CHECK IN (types) | Category of issue |
| description | TEXT | | Optional details |
| photo_url | TEXT | | Optional photo path |
| status | TEXT | CHECK IN ('open', 'in_progress', 'resolved') | Default: 'open' |
| priority | TEXT | CHECK IN ('low', 'medium', 'high') | Default: 'medium' |
| ip_hash | TEXT | | Hashed IP for rate limiting |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| updated_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| resolved_at | DATETIME | | When issue was resolved |

**Issue Types:**
- dirty_toilet
- missing_soap
- water_shortage
- broken_fixture
- bad_odor
- no_water
- electrical
- other

### admin_users

Stores admin accounts.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| email | TEXT | UNIQUE, NOT NULL | Login email |
| password_hash | TEXT | NOT NULL | Bcrypt hash |
| full_name | TEXT | NOT NULL | Display name |
| role | TEXT | CHECK IN ('admin', 'super_admin') | Default: 'admin' |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |
| last_login | DATETIME | | Last login timestamp |

### rate_limits

Tracks rate limiting for spam prevention.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | TEXT | PRIMARY KEY | UUID |
| ip_hash | TEXT | NOT NULL | Hashed IP address |
| action_type | TEXT | NOT NULL | 'rating' or 'issue' |
| created_at | DATETIME | DEFAULT CURRENT_TIMESTAMP | |

## Indexes

```sql
CREATE INDEX idx_floors_building ON floors(building_id);
CREATE INDEX idx_washrooms_floor ON washrooms(floor_id);
CREATE INDEX idx_ratings_washroom ON ratings(washroom_id);
CREATE INDEX idx_ratings_created ON ratings(created_at);
CREATE INDEX idx_issues_washroom ON issues(washroom_id);
CREATE INDEX idx_issues_status ON issues(status);
CREATE INDEX idx_issues_created ON issues(created_at);
CREATE INDEX idx_rate_limits_ip ON rate_limits(ip_hash, action_type, created_at);
```

## Sample Queries

### Get washroom with building info
```sql
SELECT w.*, f.floor_name, b.name as building_name
FROM washrooms w
JOIN floors f ON w.floor_id = f.id
JOIN buildings b ON f.building_id = b.id
WHERE w.id = ?;
```

### Get open issues by building
```sql
SELECT i.*, w.name as washroom_name
FROM issues i
JOIN washrooms w ON i.washroom_id = w.id
JOIN floors f ON w.floor_id = f.id
WHERE f.building_id = ? AND i.status = 'open';
```

### Calculate average rating
```sql
UPDATE washrooms SET 
  average_rating = (SELECT AVG(rating) FROM ratings WHERE washroom_id = washrooms.id),
  total_ratings = (SELECT COUNT(*) FROM ratings WHERE washroom_id = washrooms.id)
WHERE id = ?;
```

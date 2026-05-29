-- RoadWatch Database Initialization
-- Enables PostGIS extension for geospatial queries

CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pg_trgm;  -- For fuzzy text search

-- Index for geospatial queries on complaints
-- (SQLAlchemy will create tables; this file adds extensions and extra indexes)

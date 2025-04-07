#!/bin/bash
# Backup script for TG_ERP production deployments

# Exit immediately if a command exits with a non-zero status
set -e

# Config
BACKUP_DIR="/var/backups/tg-erp"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="tg-erp_backup_${TIMESTAMP}"
LOG_FILE="${BACKUP_DIR}/backup_${TIMESTAMP}.log"

# Ensure backup directory exists
mkdir -p ${BACKUP_DIR}

# Start logging
exec > >(tee -a ${LOG_FILE}) 2>&1
echo "Starting backup at $(date)"

# Create backup directory for this run
mkdir -p ${BACKUP_DIR}/${BACKUP_NAME}

# Backup environment files
echo "Backing up environment files..."
cp -r .env* ${BACKUP_DIR}/${BACKUP_NAME}/

# Backup PostgreSQL databases using docker-compose
echo "Backing up PostgreSQL databases..."
docker-compose exec -T postgres pg_dumpall -c -U postgres > ${BACKUP_DIR}/${BACKUP_NAME}/postgres_all_dbs.sql

# Backup MongoDB databases
echo "Backing up MongoDB databases..."
docker-compose exec -T mongo mongodump --archive > ${BACKUP_DIR}/${BACKUP_NAME}/mongodb_dump.archive

# Backup Neo4j database (if used)
echo "Backing up Neo4j database..."
NEO4J_CONTAINER=$(docker-compose ps -q neo4j)
if [ ! -z "$NEO4J_CONTAINER" ]; then
  TEMP_BACKUP_DIR="/tmp/neo4j_backup"
  docker exec $NEO4J_CONTAINER bash -c "mkdir -p $TEMP_BACKUP_DIR && neo4j-admin dump --database=neo4j --to=$TEMP_BACKUP_DIR/neo4j.dump"
  docker cp $NEO4J_CONTAINER:$TEMP_BACKUP_DIR/neo4j.dump ${BACKUP_DIR}/${BACKUP_NAME}/
  docker exec $NEO4J_CONTAINER bash -c "rm -rf $TEMP_BACKUP_DIR"
fi

# Backup docker-compose file
echo "Backing up docker-compose configuration..."
cp docker-compose.yml ${BACKUP_DIR}/${BACKUP_NAME}/

# Compress the backup
echo "Compressing backup..."
cd ${BACKUP_DIR}
tar -czf ${BACKUP_NAME}.tar.gz ${BACKUP_NAME}
rm -rf ${BACKUP_NAME}

# Cleanup old backups (keep last 7 days)
echo "Cleaning up old backups..."
find ${BACKUP_DIR} -name "tg-erp_backup_*.tar.gz" -type f -mtime +7 -delete
find ${BACKUP_DIR} -name "backup_*.log" -type f -mtime +7 -delete

echo "Backup completed at $(date)"
echo "Backup saved to ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"

# Exit successfully
exit 0

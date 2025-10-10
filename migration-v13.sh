#!/bin/bash
docker exec -i projectroom-mariadb mariadb -uprojectroom -pprojectroom projectroom < /workspaces/projectRoom/docker/mariadb/migration-v13.sql

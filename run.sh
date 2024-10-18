#!/bin/bash

trap 'docker compose stop' SIGINT

docker compose up -d

docker compose exec django python manage.py makemigrations
docker compose exec django python manage.py migrate

docker compose logs --follow
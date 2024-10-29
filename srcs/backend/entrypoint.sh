#!/bin/sh

python manage.py makemigrations

python manage.py migrate tournament zero


python manage.py migrate

exec uvicorn transcendence.asgi:application --host 0.0.0.0 --port 8000 --loop uvloop --ws websockets --interface asgi3 # --log-level debug --workers 8
# CMD ["uvicorn", "transcendence.asgi:application", "--host", "0.0.0.0", "--port", "8000", "--log-level", "debug"]
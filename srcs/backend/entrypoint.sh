#!/bin/sh

python manage.py makemigrations
python manage.py migrate

exec uvicorn transcendence.asgi:application --host 0.0.0.0 --port 8000 --log-level debug
# CMD ["uvicorn", "transcendence.asgi:application", "--host", "0.0.0.0", "--port", "8000", "--log-level", "debug"]
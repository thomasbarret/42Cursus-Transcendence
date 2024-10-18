FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt /app/

RUN pip install --no-cache-dir -r requirements.txt

COPY . /app/

ENV PYTHONDONTWRITEBYTECODE 1
ENV PYTHONUNBUFFERED 1

EXPOSE 8000


CMD ["uvicorn", "transcendence.asgi:application", "--host", "0.0.0.0", "--port", "8000", "--log-level", "debug"]
# CMD ["gunicorn", "--bind", "0.0.0.0:8000", "transcendence.wsgi:application"]
# CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
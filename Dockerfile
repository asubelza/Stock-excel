FROM python:3.11-slim

WORKDIR /app

RUN pip install --no-cache-dir flask flask-sqlalchemy openpyxl gunicorn

COPY . .

EXPOSE 5000

CMD ["gunicorn", "--bind", "0.0.0.0:5000", "app:app"]
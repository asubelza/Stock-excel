import re

with open('web_app.py', 'r') as f:
    content = f.read()

# Agregar imports si no están
if 'from werkzeug.middleware.dispatcher import DispatcherMiddleware' not in content:
    content = content.replace(
        'from functools import wraps',
        'from functools import wraps\nfrom werkzeug.middleware.dispatcher import DispatcherMiddleware'
    )

# Agregar APPLICATION_ROOT y DispatcherMiddleware después de app.secret_key
if "app.config['APPLICATION_ROOT'] = '/stock'" not in content:
    content = content.replace(
        "app.secret_key = os.environ.get('SECRET_KEY', 'stock-secret-key-2024')",
        "app.secret_key = os.environ.get('SECRET_KEY', 'stock-secret-key-2024')\n\napp.config['APPLICATION_ROOT'] = '/stock'\napplication = DispatcherMiddleware(app, {'/stock': app})"
    )

# Cambiar gunicorn en Dockerfile
with open('Dockerfile', 'r') as f:
    df = f.read()
df = df.replace('web_app:app', 'web_app:application')
with open('Dockerfile', 'w') as f:
    f.write(df)

with open('web_app.py', 'w') as f:
    f.write(content)

print("Parche aplicado!")

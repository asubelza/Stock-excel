from web_app import app
from werkzeug.middleware.dispatcher import DispatcherMiddleware

app.config['APPLICATION_ROOT'] = '/stock'
application = DispatcherMiddleware(app, {'/stock': app})

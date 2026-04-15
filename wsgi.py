from web_app import app
from werkzeug.middleware.dispatcher import DispatcherMiddleware

application = DispatcherMiddleware(app, {'/stock': app})

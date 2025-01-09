from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_login import LoginManager

app = Flask(__name__)
app.config.from_object('config')

UPLOAD_FOLDER = 'static/images/'
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

db = SQLAlchemy(app)

migrate = Migrate(app, db)

from app import views, models

from .models import User, Admin

login_manager = LoginManager()
login_manager.login_view = 'login'
login_manager.init_app(app)

@login_manager.user_loader
def load_user(user_id):
    user = Admin.query.get(user_id)
    if not user:
       user = User.query.get(user_id)
    return user
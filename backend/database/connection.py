import os
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

def init_db(app):
    # Ensure the instance or database directory exists for SQLite
    db_url = os.environ.get('DATABASE_URL', 'sqlite:///fleet.db')
    
    # Handle SQLite path mapping to make it local to the backend folder
    if db_url.startswith('sqlite:///'):
        db_file = db_url.replace('sqlite:///', '')
        if not os.path.isabs(db_file):
            backend_dir = os.path.abspath(os.path.dirname(os.path.dirname(__file__)))
            # Create a folder for the db if it's placed inside a subfolder or instance
            db_path = os.path.join(backend_dir, db_file)
            db_dir = os.path.dirname(db_path)
            if db_dir and not os.path.exists(db_dir):
                os.makedirs(db_dir, exist_ok=True)
            db_url = f"sqlite:///{db_path}"
            
    app.config['SQLALCHEMY_DATABASE_URI'] = db_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.init_app(app)

import os
import sys
from flask import Flask, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv

# Add parent directory to sys.path to resolve 'backend' package imports
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
load_dotenv()

from backend.database.connection import db, init_db
from backend.routes.auth import auth_bp
from backend.routes.drivers import drivers_bp
from backend.routes.customers import customers_bp
from backend.routes.fuel import fuel_bp
from backend.routes.reports import reports_bp

def create_app():
    app = Flask(__name__)
    
    # Configuration
    app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'default-secret-key-12345')
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY', 'default-jwt-secret-key-12345')
    
    # Configure CORS (allow React frontend)
    CORS(app, resources={r"/api/*": {"origins": "*"}})
    
    # Initialize JWT
    jwt = JWTManager(app)
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({'message': 'The token has expired', 'error': 'token_expired'}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({'message': 'Signature verification failed', 'error': 'invalid_token'}), 401

    @jwt.unauthorized_loader
    def missing_token_callback(error):
        return jsonify({'message': 'Request does not contain an access token', 'error': 'authorization_required'}), 401
    
    # Initialize Database
    init_db(app)
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(drivers_bp, url_prefix='/api/drivers')
    app.register_blueprint(customers_bp, url_prefix='/api/customers')
    app.register_blueprint(fuel_bp, url_prefix='/api/fuel')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    
    # Create DB tables and seed admin user on startup
    with app.app_context():
        db.create_all()
        
        # Check if 'days' column exists in 'customer_jobs' table (SQLite check/alter)
        from sqlalchemy import text
        try:
            columns = db.session.execute(text("PRAGMA table_info(customer_jobs)")).fetchall()
            column_names = [col[1] for col in columns]
            if 'days' not in column_names:
                db.session.execute(text("ALTER TABLE customer_jobs ADD COLUMN days TEXT"))
                db.session.commit()
                print("Database migrated: added 'days' column to 'customer_jobs'.")
            
            # Create indexes on date columns for maximum performance
            db.session.execute(text("CREATE INDEX IF NOT EXISTS idx_customer_jobs_date ON customer_jobs(date)"))
            db.session.execute(text("CREATE INDEX IF NOT EXISTS idx_driver_payments_date ON driver_payments(date)"))
            db.session.execute(text("CREATE INDEX IF NOT EXISTS idx_fuel_entries_date ON fuel_entries(date)"))
            db.session.commit()
            print("Database migrated: created indexes on date columns.")
        except Exception as e:
            print(f"Database schema migration failed or skipped: {e}")
        
        # Seed default admin user if no users exist
        from backend.models.user import User
        if User.query.count() == 0:
            admin_user = User(username='admin')
            admin_user.set_password('admin123')
            db.session.add(admin_user)
            db.session.commit()
            print("Database initialized and default owner account seeded (admin / admin123).")
            
    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=True)

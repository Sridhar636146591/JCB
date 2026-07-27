from backend.database.connection import db
from datetime import datetime

class Driver(db.Model):
    __tablename__ = 'drivers'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    joining_date = db.Column(db.String(20), nullable=False) # Store as YYYY-MM-DD
    
    # Relationships
    payments = db.relationship('DriverPayment', backref='driver', cascade='all, delete-orphan', lazy=True)
    jobs = db.relationship('CustomerJob', backref='driver', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'phone': self.phone,
            'joining_date': self.joining_date
        }

class DriverPayment(db.Model):
    __tablename__ = 'driver_payments'
    
    id = db.Column(db.Integer, primary_key=True)
    driver_id = db.Column(db.Integer, db.ForeignKey('drivers.id'), nullable=False)
    amount = db.Column(db.Float, nullable=False)
    date = db.Column(db.String(20), nullable=False) # Store as YYYY-MM-DD
    notes = db.Column(db.String(255), nullable=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'driver_id': self.driver_id,
            'amount': self.amount,
            'date': self.date,
            'notes': self.notes or ''
        }

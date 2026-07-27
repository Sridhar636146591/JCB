from backend.database.connection import db

class FuelEntry(db.Model):
    __tablename__ = 'fuel_entries'
    
    id = db.Column(db.Integer, primary_key=True)
    date = db.Column(db.String(20), nullable=False) # YYYY-MM-DD
    vehicle = db.Column(db.String(50), nullable=False) # JCB or Tractor
    litres = db.Column(db.Float, nullable=True, default=0.0)
    price_per_litre = db.Column(db.Float, nullable=True, default=0.0)
    total_cost = db.Column(db.Float, nullable=False) # Auto-calculated or directly entered cost
    notes = db.Column(db.String(255), nullable=True)
    
    def __init__(self, **kwargs):
        super(FuelEntry, self).__init__(**kwargs)
        # Handle direct total_cost or calculate it
        if self.total_cost is None:
            if self.litres is not None and self.price_per_litre is not None:
                self.total_cost = round(self.litres * self.price_per_litre, 2)
            else:
                self.total_cost = 0.0
        if self.litres is None:
            self.litres = 0.0
        if self.price_per_litre is None:
            self.price_per_litre = 0.0
            
    def to_dict(self):
        return {
            'id': self.id,
            'date': self.date,
            'vehicle': self.vehicle,
            'litres': self.litres or 0.0,
            'price_per_litre': self.price_per_litre or 0.0,
            'total_cost': self.total_cost,
            'notes': self.notes or ''
        }

from backend.database.connection import db
from datetime import datetime

class Customer(db.Model):
    __tablename__ = 'customers'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20), nullable=False)
    village = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    jobs = db.relationship('CustomerJob', backref='customer', cascade='all, delete-orphan', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'phone': self.phone,
            'village': self.village,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class CustomerJob(db.Model):
    __tablename__ = 'customer_jobs'
    
    id = db.Column(db.Integer, primary_key=True)
    customer_id = db.Column(db.Integer, db.ForeignKey('customers.id'), nullable=False)
    driver_id = db.Column(db.Integer, db.ForeignKey('drivers.id'), nullable=True) # Nullable if owner drives
    date = db.Column(db.String(20), nullable=False) # YYYY-MM-DD
    vehicle = db.Column(db.String(50), nullable=False) # e.g. 'JCB' or 'Tractor'
    work_type = db.Column(db.String(20), nullable=False) # 'hourly' or 'loading'
    
    # Hourly Work details
    hours = db.Column(db.Float, nullable=True, default=0.0)
    rate_per_hour = db.Column(db.Float, nullable=True, default=0.0)
    
    # Loading Work details
    loads = db.Column(db.Integer, nullable=True, default=0)
    rate_per_load = db.Column(db.Float, nullable=True, default=0.0)
    
    # Extra expenses
    food = db.Column(db.Float, nullable=False, default=0.0)
    bata = db.Column(db.Float, nullable=False, default=0.0)
    diesel = db.Column(db.Float, nullable=False, default=0.0)
    additional_charges = db.Column(db.Float, nullable=False, default=0.0)
    other_expenses = db.Column(db.Float, nullable=False, default=0.0)
    
    # Payments
    amount_paid = db.Column(db.Float, nullable=False, default=0.0)
    notes = db.Column(db.String(255), nullable=True)
    days = db.Column(db.Text, nullable=True) # JSON list of DayEntries
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def get_days(self):
        import json
        if not self.days:
            return [{
                'day_number': 1,
                'date': self.date,
                'vehicle': self.vehicle,
                'driver_id': self.driver_id,
                'work_type': self.work_type,
                'hours': self.hours or 0.0,
                'rate_per_hour': self.rate_per_hour or 0.0,
                'loads': self.loads or 0,
                'rate_per_load': self.rate_per_load or 0.0,
                'food': self.food or 0.0,
                'bata': self.bata or 0.0,
                'diesel': self.diesel or 0.0,
                'additional_charges': self.additional_charges or 0.0,
                'other_expenses': self.other_expenses or 0.0
            }]
        try:
            days_list = json.loads(self.days)
            for idx, d in enumerate(days_list):
                if 'day_number' not in d:
                    d['day_number'] = idx + 1
                if 'vehicle' not in d:
                    d['vehicle'] = self.vehicle
                if 'driver_id' not in d:
                    d['driver_id'] = self.driver_id
                if 'work_type' not in d:
                    d['work_type'] = self.work_type
                
                # Check for expenses
                for field in ['food', 'bata', 'diesel', 'additional_charges', 'other_expenses']:
                    if field not in d:
                        d[field] = getattr(self, field) if idx == 0 else 0.0
            return days_list
        except Exception:
            return [{
                'day_number': 1,
                'date': self.date,
                'vehicle': self.vehicle,
                'driver_id': self.driver_id,
                'work_type': self.work_type,
                'hours': self.hours or 0.0,
                'rate_per_hour': self.rate_per_hour or 0.0,
                'loads': self.loads or 0,
                'rate_per_load': self.rate_per_load or 0.0,
                'food': self.food or 0.0,
                'bata': self.bata or 0.0,
                'diesel': self.diesel or 0.0,
                'additional_charges': self.additional_charges or 0.0,
                'other_expenses': self.other_expenses or 0.0
            }]

    def get_days_with_names(self):
        days_list = self.get_days()
        from backend.models.driver import Driver
        try:
            drivers = {d.id: d.name for d in Driver.query.all()}
        except Exception:
            drivers = {}
        for d in days_list:
            did = d.get('driver_id')
            if did:
                try:
                    did_int = int(did)
                    d['driver_name'] = drivers.get(did_int, 'Owner/None')
                except ValueError:
                    d['driver_name'] = 'Owner/None'
            else:
                d['driver_name'] = 'Owner/None'
        return days_list

    @property
    def total_amount(self):
        """Calculates Gross Amount billed to customer"""
        days_list = self.get_days()
        total = 0.0
        for d in days_list:
            wt = d.get('work_type', 'hourly')
            if wt == 'hourly':
                total += (float(d.get('hours') or 0.0)) * (float(d.get('rate_per_hour') or 0.0))
            elif wt == 'loading':
                total += (int(d.get('loads') or 0)) * (float(d.get('rate_per_load') or 0.0))
        return total
        
    @property
    def total_expenses(self):
        """Calculates Total Expenses incurred on the job"""
        days_list = self.get_days()
        return sum(
            (float(d.get('food') or 0.0) +
             float(d.get('bata') or 0.0) +
             float(d.get('diesel') or 0.0) +
             float(d.get('additional_charges') or 0.0) +
             float(d.get('other_expenses') or 0.0))
            for d in days_list
        )
               
    @property
    def net_profit(self):
        """Calculates Net Profit: Total Billed - Total Expenses"""
        return self.total_amount - self.total_expenses
        
    @property
    def balance(self):
        """Calculates Outstanding Balance: Total Billed - Amount Paid"""
        return self.total_amount - self.amount_paid
        
    def to_dict(self):
        driver_name = self.driver.name if self.driver else 'Owner/None'
        driver_phone = self.driver.phone if self.driver else ''
        customer_name = self.customer.name if self.customer else ''
        customer_phone = self.customer.phone if self.customer else ''
        customer_village = self.customer.village if self.customer else ''
        
        return {
            'id': self.id,
            'customer_id': self.customer_id,
            'customer_name': customer_name,
            'customer_phone': customer_phone,
            'customer_village': customer_village,
            'driver_id': self.driver_id,
            'driver_name': driver_name,
            'driver_phone': driver_phone,
            'date': self.date,
            'vehicle': self.vehicle,
            'work_type': self.work_type,
            'hours': self.hours,
            'rate_per_hour': self.rate_per_hour,
            'loads': self.loads,
            'rate_per_load': self.rate_per_load,
            'food': self.food,
            'bata': self.bata,
            'diesel': self.diesel,
            'additional_charges': self.additional_charges,
            'other_expenses': self.other_expenses,
            'amount_paid': self.amount_paid,
            'total_amount': self.total_amount,
            'total_expenses': self.total_expenses,
            'net_profit': self.net_profit,
            'balance': self.balance,
            'notes': self.notes or '',
            'days': self.get_days_with_names(),
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

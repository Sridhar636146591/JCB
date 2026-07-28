from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required
from backend.models.driver import Driver, DriverPayment
from backend.models.customer import CustomerJob
from backend.database.connection import db
from backend.pdf.generator import PDFGenerator
from backend.utils.helpers import parse_float
import io
from datetime import datetime, date

drivers_bp = Blueprint('drivers', __name__)

@drivers_bp.route('', methods=['GET'])
@jwt_required()
def get_drivers():
    drivers = Driver.query.all()
    return jsonify([d.to_dict() for d in drivers]), 200

@drivers_bp.route('', methods=['POST'])
@jwt_required()
def add_driver():
    data = request.get_json() or {}
    name = data.get('name')
    phone = data.get('phone') or ''
    joining_date = data.get('joining_date')
    
    if not name or not joining_date:
        return jsonify({'message': 'Driver Name and Joining Date are required'}), 400
        
    driver = Driver(name=name, phone=phone, joining_date=joining_date)
    db.session.add(driver)
    db.session.commit()
    return jsonify(driver.to_dict()), 201

@drivers_bp.route('/<int:driver_id>', methods=['PUT'])
@jwt_required()
def edit_driver(driver_id):
    driver = Driver.query.get_or_404(driver_id)
    data = request.get_json() or {}
    
    driver.name = data.get('name', driver.name)
    driver.phone = data.get('phone', driver.phone)
    driver.joining_date = data.get('joining_date', driver.joining_date)
    
    db.session.commit()
    return jsonify(driver.to_dict()), 200

@drivers_bp.route('/<int:driver_id>', methods=['DELETE'])
@jwt_required()
def delete_driver(driver_id):
    driver = Driver.query.get_or_404(driver_id)
    db.session.delete(driver)
    db.session.commit()
    return jsonify({'message': 'Driver deleted successfully'}), 200

# --- DRIVER PAYMENTS ---

@drivers_bp.route('/<int:driver_id>/payments', methods=['GET'])
@jwt_required()
def get_driver_payments(driver_id):
    driver = Driver.query.get_or_404(driver_id)
    payments = DriverPayment.query.filter_by(driver_id=driver_id).order_by(DriverPayment.date.desc()).all()
    
    # Calculate monthly and yearly totals
    today = date.today()
    current_month_prefix = today.strftime('%Y-%m')
    current_year_prefix = today.strftime('%Y')
    
    monthly_total = sum(p.amount for p in payments if p.date.startswith(current_month_prefix))
    yearly_total = sum(p.amount for p in payments if p.date.startswith(current_year_prefix))
    
    return jsonify({
        'payments': [p.to_dict() for p in payments],
        'monthly_total': monthly_total,
        'yearly_total': yearly_total
    }), 200

@drivers_bp.route('/<int:driver_id>/payments', methods=['POST'])
@jwt_required()
def add_driver_payment(driver_id):
    driver = Driver.query.get_or_404(driver_id)
    data = request.get_json() or {}
    
    amount = parse_float(data.get('amount'))
    payment_date = data.get('date') or date.today().strftime('%Y-%m-%d')
    notes = data.get('notes')
    
    if amount <= 0:
        return jsonify({'message': 'Amount must be greater than zero'}), 400
        
    payment = DriverPayment(driver_id=driver_id, amount=amount, date=payment_date, notes=notes)
    db.session.add(payment)
    db.session.commit()
    return jsonify(payment.to_dict()), 201

@drivers_bp.route('/payments/<int:payment_id>', methods=['DELETE'])
@jwt_required()
def delete_driver_payment(payment_id):
    payment = DriverPayment.query.get_or_404(payment_id)
    db.session.delete(payment)
    db.session.commit()
    return jsonify({'message': 'Payment entry deleted successfully'}), 200

# --- DRIVER BILL PDF ---

@drivers_bp.route('/<int:driver_id>/pdf', methods=['GET'])
@jwt_required()
def get_driver_bill_pdf(driver_id):
    driver = Driver.query.get_or_404(driver_id)
    
    # Query parameters
    range_type = request.args.get('range_type', 'all') # 'today', 'month', 'custom', or 'all'
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    today_str = date.today().strftime('%Y-%m-%d')
    
    if range_type == 'today':
        start_date = today_str
        end_date = today_str
        date_label = f"Today ({today_str})"
    elif range_type == 'month':
        start_date = date.today().strftime('%Y-%m-01')
        # simple end of month
        end_date = date.today().strftime('%Y-%m-31') # SQLite matches works fine with >= and <=
        date_label = date.today().strftime('%B %Y')
    elif range_type == 'custom' and start_date and end_date:
        date_label = f"{start_date} to {end_date}"
    else:
        start_date = "1970-01-01"
        end_date = "9999-12-31"
        date_label = "All Time"
        
    # Get payments in range
    payments = DriverPayment.query.filter(
        DriverPayment.driver_id == driver_id,
        DriverPayment.date >= start_date,
        DriverPayment.date <= end_date
    ).order_by(DriverPayment.date.desc()).all()
    
    # Get jobs in range
    jobs = CustomerJob.query.filter(
        CustomerJob.driver_id == driver_id,
        CustomerJob.date >= start_date,
        CustomerJob.date <= end_date
    ).order_by(CustomerJob.date.desc()).all()
    
    # Generate PDF
    pdf_bytes = PDFGenerator.generate_driver_bill(driver, payments, jobs, date_label)
    
    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"Driver_Bill_{driver.name.replace(' ', '_')}.pdf"
    )

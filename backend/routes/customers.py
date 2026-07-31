from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required
from backend.models.customer import Customer, CustomerJob
from backend.models.driver import Driver
from backend.database.connection import db
from backend.pdf.generator import PDFGenerator
from backend.utils.helpers import parse_float, parse_int
import io
from datetime import datetime, date

customers_bp = Blueprint('customers', __name__)

@customers_bp.route('', methods=['GET'])
@jwt_required()
def get_customers():
    # Supports optional query parameter search
    search_query = request.args.get('search', '')
    if search_query:
        customers = Customer.query.filter(
            (Customer.name.like(f"%{search_query}%")) |
            (Customer.village.like(f"%{search_query}%")) |
            (Customer.phone.like(f"%{search_query}%"))
        ).all()
    else:
        customers = Customer.query.all()
    return jsonify([c.to_dict() for c in customers]), 200

@customers_bp.route('', methods=['POST'])
@jwt_required()
def add_customer():
    data = request.get_json() or {}
    name = data.get('name')
    phone = data.get('phone') or ''
    village = data.get('village') or ''
    
    if not name:
        return jsonify({'message': 'Customer Name is required'}), 400
        
    customer = Customer(name=name, phone=phone, village=village)
    db.session.add(customer)
    db.session.commit()
    return jsonify(customer.to_dict()), 201

@customers_bp.route('/<int:customer_id>', methods=['PUT'])
@jwt_required()
def edit_customer(customer_id):
    customer = Customer.query.get_or_404(customer_id)
    data = request.get_json() or {}
    
    customer.name = data.get('name', customer.name)
    customer.phone = data.get('phone', customer.phone)
    customer.village = data.get('village', customer.village)
    
    db.session.commit()
    return jsonify(customer.to_dict()), 200

@customers_bp.route('/<int:customer_id>', methods=['DELETE'])
@jwt_required()
def delete_customer(customer_id):
    customer = Customer.query.get_or_404(customer_id)
    db.session.delete(customer)
    db.session.commit()
    return jsonify({'message': 'Customer deleted successfully'}), 200

# --- CUSTOMER JOBS ---

@customers_bp.route('/<int:customer_id>/jobs', methods=['GET'])
@jwt_required()
def get_customer_jobs(customer_id):
    customer = Customer.query.get_or_404(customer_id)
    jobs = CustomerJob.query.filter_by(customer_id=customer_id).order_by(CustomerJob.id.desc()).all()
    return jsonify([j.to_dict() for j in jobs]), 200

@customers_bp.route('/<int:customer_id>/jobs', methods=['POST'])
@jwt_required()
def add_customer_job(customer_id):
    customer = Customer.query.get_or_404(customer_id)
    data = request.get_json() or {}
    
    date_str = data.get('date') or date.today().strftime('%Y-%m-%d')
    vehicle = data.get('vehicle')
    driver_id = data.get('driver_id') # Nullable
    work_type = data.get('work_type') # 'hourly' or 'loading'
    
    if not vehicle or not work_type:
        return jsonify({'message': 'Vehicle and Work Type are required'}), 400
        
    if work_type not in ['hourly', 'loading']:
        return jsonify({'message': 'Invalid work type'}), 400
        
    # Check driver if provided
    if driver_id == '' or driver_id is None:
        driver_id = None
    else:
        driver = Driver.query.get(driver_id)
        if not driver:
            return jsonify({'message': 'Driver not found'}), 404
            
    # Extract work specific variables
    days = data.get('days')
    import json
    days_json = json.dumps(days) if days else None
    
    if days and len(days) > 0:
        first_day = days[0]
        date_str = first_day.get('date') or date_str
        vehicle = first_day.get('vehicle') or vehicle
        work_type = first_day.get('work_type') or work_type
        
        did = first_day.get('driver_id')
        if did == '' or did is None:
            driver_id = None
        else:
            driver_id = int(did)
            
        if work_type == 'hourly':
            hours = parse_float(first_day.get('hours'))
            rate_per_hour = parse_float(first_day.get('rate_per_hour'))
            loads = 0
            rate_per_load = 0.0
        else:
            loads = parse_int(first_day.get('loads'))
            rate_per_load = parse_float(first_day.get('rate_per_load'))
            hours = 0.0
            rate_per_hour = 0.0
            
        food = parse_float(first_day.get('food'), 0.0)
        bata = parse_float(first_day.get('bata'), 0.0)
        diesel = parse_float(first_day.get('diesel'), 0.0)
        additional_charges = parse_float(first_day.get('additional_charges'), 0.0)
        other_expenses = parse_float(first_day.get('other_expenses'), 0.0)
    else:
        hours = parse_float(data.get('hours'))
        rate_per_hour = parse_float(data.get('rate_per_hour'))
        loads = parse_int(data.get('loads'))
        rate_per_load = parse_float(data.get('rate_per_load'))
        food = parse_float(data.get('food'), 0.0)
        bata = parse_float(data.get('bata'), 0.0)
        diesel = parse_float(data.get('diesel'), 0.0)
        additional_charges = parse_float(data.get('additional_charges'), 0.0)
        other_expenses = parse_float(data.get('other_expenses'), 0.0)
    
    # Payments
    amount_paid = parse_float(data.get('amount_paid'), 0.0)
    notes = data.get('notes')
    
    job = CustomerJob(
        customer_id=customer_id,
        driver_id=driver_id,
        date=date_str,
        vehicle=vehicle,
        work_type=work_type,
        hours=hours,
        rate_per_hour=rate_per_hour,
        loads=loads,
        rate_per_load=rate_per_load,
        food=food,
        bata=bata,
        diesel=diesel,
        additional_charges=additional_charges,
        other_expenses=other_expenses,
        amount_paid=amount_paid,
        notes=notes,
        days=days_json
    )
    
    db.session.add(job)
    db.session.commit()
    return jsonify(job.to_dict()), 201

@customers_bp.route('/jobs/<int:job_id>', methods=['PUT'])
@jwt_required()
def edit_customer_job(job_id):
    job = CustomerJob.query.get_or_404(job_id)
    data = request.get_json() or {}
    
    # Work Type details
    days = data.get('days')
    if days is not None:
        import json
        job.days = json.dumps(days)
        if len(days) > 0:
            first_day = days[0]
            job.date = first_day.get('date', job.date)
            job.vehicle = first_day.get('vehicle', job.vehicle)
            job.work_type = first_day.get('work_type', job.work_type)
            
            did = first_day.get('driver_id')
            if did == '' or did is None:
                job.driver_id = None
            else:
                job.driver_id = int(did)
                
            if job.work_type == 'hourly':
                job.hours = parse_float(first_day.get('hours'))
                job.rate_per_hour = parse_float(first_day.get('rate_per_hour'))
                job.loads = 0
                job.rate_per_load = 0.0
            else:
                job.loads = parse_int(first_day.get('loads'))
                job.rate_per_load = parse_float(first_day.get('rate_per_load'))
                job.hours = 0.0
                job.rate_per_hour = 0.0
                
            job.food = parse_float(first_day.get('food'))
            job.bata = parse_float(first_day.get('bata'))
            job.diesel = parse_float(first_day.get('diesel'))
            job.additional_charges = parse_float(first_day.get('additional_charges'))
            job.other_expenses = parse_float(first_day.get('other_expenses'))
    else:
        # Check driver
        driver_id = data.get('driver_id')
        if driver_id is not None:
            if driver_id == '':
                job.driver_id = None
            else:
                driver = Driver.query.get(driver_id)
                if not driver:
                    return jsonify({'message': 'Driver not found'}), 404
                job.driver_id = driver_id
                
        if job.work_type == 'hourly':
            job.hours = parse_float(data.get('hours'), job.hours)
            job.rate_per_hour = parse_float(data.get('rate_per_hour'), job.rate_per_hour)
            job.loads = 0
            job.rate_per_load = 0.0
        else:
            job.loads = parse_int(data.get('loads'), job.loads)
            job.rate_per_load = parse_float(data.get('rate_per_load'), job.rate_per_load)
            job.hours = 0.0
            job.rate_per_hour = 0.0
            
        job.food = parse_float(data.get('food'), job.food)
        job.bata = parse_float(data.get('bata'), job.bata)
        job.diesel = parse_float(data.get('diesel'), job.diesel)
        job.additional_charges = parse_float(data.get('additional_charges'), job.additional_charges)
        job.other_expenses = parse_float(data.get('other_expenses'), job.other_expenses)
    
    # Payments
    job.amount_paid = parse_float(data.get('amount_paid'), job.amount_paid)
    job.notes = data.get('notes', job.notes)
    
    db.session.commit()
    return jsonify(job.to_dict()), 200

@customers_bp.route('/jobs/<int:job_id>', methods=['DELETE'])
@jwt_required()
def delete_customer_job(job_id):
    job = CustomerJob.query.get_or_404(job_id)
    db.session.delete(job)
    db.session.commit()
    return jsonify({'message': 'Job sheet deleted successfully'}), 200

# --- INVOICE PDF ---

@customers_bp.route('/jobs/<int:job_id>/pdf', methods=['GET'])
@jwt_required()
def get_customer_job_invoice_pdf(job_id):
    job = CustomerJob.query.get_or_404(job_id)
    pdf_bytes = PDFGenerator.generate_customer_invoice(job)
    
    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"Invoice_{job.customer.name.replace(' ', '_')}_{job.date}.pdf"
    )

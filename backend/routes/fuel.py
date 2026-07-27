from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required
from backend.models.fuel import FuelEntry
from backend.database.connection import db
from backend.pdf.generator import PDFGenerator
from backend.utils.helpers import parse_float
import io
from datetime import datetime, date

fuel_bp = Blueprint('fuel', __name__)

@fuel_bp.route('', methods=['GET'])
@jwt_required()
def get_fuel_entries():
    # Supports optional start and end date filters
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    query = FuelEntry.query
    if start_date and end_date:
        query = query.filter(FuelEntry.date >= start_date, FuelEntry.date <= end_date)
        
    entries = query.order_by(FuelEntry.date.desc()).all()
    return jsonify([f.to_dict() for f in entries]), 200

@fuel_bp.route('', methods=['POST'])
@jwt_required()
def add_fuel_entry():
    data = request.get_json() or {}
    
    date_str = data.get('date') or date.today().strftime('%Y-%m-%d')
    vehicle = data.get('vehicle')
    amount = parse_float(data.get('amount') or data.get('total_cost'))
    notes = data.get('notes')
    
    if not vehicle or amount <= 0:
        return jsonify({'message': 'Vehicle and a positive Amount are required'}), 400
        
    entry = FuelEntry(
        date=date_str,
        vehicle=vehicle,
        total_cost=amount,
        litres=parse_float(data.get('litres'), 0.0),
        price_per_litre=parse_float(data.get('price_per_litre'), 0.0),
        notes=notes
    )
    db.session.add(entry)
    db.session.commit()
    return jsonify(entry.to_dict()), 201

@fuel_bp.route('/<int:entry_id>', methods=['PUT'])
@jwt_required()
def edit_fuel_entry(entry_id):
    entry = FuelEntry.query.get_or_404(entry_id)
    data = request.get_json() or {}
    
    entry.date = data.get('date', entry.date)
    entry.vehicle = data.get('vehicle', entry.vehicle)
    entry.notes = data.get('notes', entry.notes)
    
    # Check if direct amount is provided, otherwise calculate from litres/price
    if 'amount' in data or 'total_cost' in data:
        entry.total_cost = parse_float(data.get('amount') or data.get('total_cost'))
        entry.litres = parse_float(data.get('litres'), 0.0)
        entry.price_per_litre = parse_float(data.get('price_per_litre'), 0.0)
    else:
        entry.litres = parse_float(data.get('litres'), entry.litres)
        entry.price_per_litre = parse_float(data.get('price_per_litre'), entry.price_per_litre)
        entry.total_cost = round(entry.litres * entry.price_per_litre, 2)
    
    db.session.commit()
    return jsonify(entry.to_dict()), 200

@fuel_bp.route('/<int:entry_id>', methods=['DELETE'])
@jwt_required()
def delete_fuel_entry(entry_id):
    entry = FuelEntry.query.get_or_404(entry_id)
    db.session.delete(entry)
    db.session.commit()
    return jsonify({'message': 'Fuel entry deleted successfully'}), 200

# --- FUEL REPORT PDF ---

@fuel_bp.route('/pdf', methods=['GET'])
@jwt_required()
def get_fuel_report_pdf():
    # Query parameters
    range_type = request.args.get('range_type', 'all')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    today_str = date.today().strftime('%Y-%m-%d')
    
    if range_type == 'today':
        start_date = today_str
        end_date = today_str
        date_label = f"Today ({today_str})"
    elif range_type == 'month':
        start_date = date.today().strftime('%Y-%m-01')
        end_date = date.today().strftime('%Y-%m-31')
        date_label = date.today().strftime('%B %Y')
    elif range_type == 'custom' and start_date and end_date:
        date_label = f"{start_date} to {end_date}"
    else:
        start_date = "1970-01-01"
        end_date = "9999-12-31"
        date_label = "All Time"
        
    entries = FuelEntry.query.filter(
        FuelEntry.date >= start_date,
        FuelEntry.date <= end_date
    ).order_by(FuelEntry.date.desc()).all()
    
    pdf_bytes = PDFGenerator.generate_fuel_report(entries, date_label)
    
    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"Fuel_Report_{date_label.replace(' ', '_')}.pdf"
    )

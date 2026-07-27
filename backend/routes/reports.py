from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required
from backend.services.report_service import ReportService
from backend.pdf.generator import PDFGenerator
import io
from datetime import datetime, date

reports_bp = Blueprint('reports', __name__)

@reports_bp.route('/dashboard', methods=['GET'])
@jwt_required()
def get_dashboard():
    data = ReportService.get_dashboard_data()
    return jsonify(data), 200

@reports_bp.route('/financial', methods=['GET'])
@jwt_required()
def get_financial():
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    
    if not start_date or not end_date:
        return jsonify({'message': 'Start Date and End Date are required'}), 400
        
    data = ReportService.get_financial_report(start_date, end_date)
    return jsonify(data), 200

@reports_bp.route('/export-pdf', methods=['GET'])
@jwt_required()
def export_financial_pdf():
    range_type = request.args.get('range_type', 'month')
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
    elif range_type == 'yearly':
        current_year = date.today().strftime('%Y')
        start_date = f"{current_year}-01-01"
        end_date = f"{current_year}-12-31"
        date_label = f"Year {current_year}"
    elif range_type == 'custom' and start_date and end_date:
        date_label = f"{start_date} to {end_date}"
    else:
        # Fallback to current month
        start_date = date.today().strftime('%Y-%m-01')
        end_date = date.today().strftime('%Y-%m-31')
        date_label = date.today().strftime('%B %Y')
        
    report_data = ReportService.get_financial_report(start_date, end_date)
    pdf_bytes = PDFGenerator.generate_pl_report(report_data, date_label)
    
    return send_file(
        io.BytesIO(pdf_bytes),
        mimetype='application/pdf',
        as_attachment=True,
        download_name=f"Financial_Report_{date_label.replace(' ', '_')}.pdf"
    )

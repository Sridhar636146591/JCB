import io
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from backend.utils.helpers import format_date

class PDFGenerator:
    @staticmethod
    def get_base_styles():
        styles = getSampleStyleSheet()
        
        # Custom styles for professional aesthetic
        title_style = ParagraphStyle(
            'InvoiceTitle',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=24,
            leading=28,
            textColor=colors.HexColor('#1e293b') # Slate 800
        )
        
        subtitle_style = ParagraphStyle(
            'InvoiceSubtitle',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#64748b') # Slate 500
        )
        
        h2_style = ParagraphStyle(
            'SectionHeader',
            parent=styles['Normal'],
            fontName='Helvetica-Bold',
            fontSize=14,
            leading=18,
            textColor=colors.HexColor('#0f172a'), # Slate 900
            spaceAfter=6
        )
        
        body_style = ParagraphStyle(
            'InvoiceBody',
            parent=styles['Normal'],
            fontName='Helvetica',
            fontSize=10,
            leading=14,
            textColor=colors.HexColor('#334155') # Slate 700
        )
        
        body_bold = ParagraphStyle(
            'InvoiceBodyBold',
            parent=body_style,
            fontName='Helvetica-Bold'
        )

        right_body = ParagraphStyle(
            'RightBody',
            parent=body_style,
            alignment=2 # Right aligned
        )
        
        right_body_bold = ParagraphStyle(
            'RightBodyBold',
            parent=body_bold,
            alignment=2 # Right aligned
        )
        
        return {
            'title': title_style,
            'subtitle': subtitle_style,
            'h2': h2_style,
            'body': body_style,
            'body_bold': body_bold,
            'right_body': right_body,
            'right_body_bold': right_body_bold
        }

    @staticmethod
    def generate_customer_invoice(job):
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )
        
        styles = PDFGenerator.get_base_styles()
        story = []
        
        # --- HEADER SECTION ---
        from datetime import date
        today_str = date.today().strftime('%Y-%m-%d')
        header_data = [
            [
                Paragraph("Sri Lakshmi Narayana Swamy Earth Movers", styles['title']),
                Paragraph(f"<b>BILL / INVOICE</b><br/>Serial Number: {job.id}<br/>Date: {format_date(today_str)}", styles['right_body'])
            ],
            [
                Paragraph("Proprietor: ASHOK G | Phone: +91 9845174737<br/>Address: Gudipalli(V), Mulbagal(T), Kolar, Karnataka - 563132<br/>JCB & Tractor Rental Services", styles['subtitle']),
                Paragraph("", styles['subtitle'])
            ]
        ]
        header_table = Table(header_data, colWidths=[4.8 * inch, 2.7 * inch])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 15))
        
        # Divider Line
        divider = Table([[""]], colWidths=[7.5 * inch])
        divider.setStyle(TableStyle([
            ('LINEABOVE', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING', (0,0), (-1,-1), 0),
        ]))
        story.append(divider)
        story.append(Spacer(1, 15))
        
        # --- BILL TO & JOB DETAILS ---
        days_list = job.get_days()
        vehicles = set(d.get('vehicle', job.vehicle) for d in days_list)
        vehicle_display = job.vehicle if len(vehicles) <= 1 else "Multiple"
        
        from backend.models.driver import Driver
        try:
            drivers = {d.id: d.name for d in Driver.query.all()}
        except Exception:
            drivers = {}
        driver_ids = set(d.get('driver_id') for d in days_list)
        driver_names = []
        for did in driver_ids:
            if did:
                try:
                    driver_names.append(drivers.get(int(did), 'Owner/None'))
                except ValueError:
                    driver_names.append('Owner/None')
            else:
                driver_names.append('Owner/None')
        driver_display = ", ".join(set(driver_names)) if len(driver_names) > 0 else "Owner/None"
        if len(set(driver_names)) > 1:
            driver_display = "Multiple"
            
        work_types = set(d.get('work_type', job.work_type) for d in days_list)
        work_type_display = job.work_type.capitalize() if len(work_types) <= 1 else "Multiple"
        
        details_data = [
            [
                Paragraph("<b>CUSTOMER DETAILS (BILL TO)</b>", styles['body_bold']),
                Paragraph("<b>VEHICLE & OPERATOR</b>", styles['body_bold'])
            ],
            [
                Paragraph(f"Name: {job.customer.name}<br/>Phone: {job.customer.phone}<br/>Village: {job.customer.village}", styles['body']),
                Paragraph(f"Vehicle: {vehicle_display}<br/>Operator: {driver_display}<br/>Work Type: {work_type_display} Work<br/>Job Date: {format_date(job.date)}", styles['body'])
            ]
        ]
        details_table = Table(details_data, colWidths=[3.75 * inch, 3.75 * inch])
        details_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ]))
        story.append(details_table)
        story.append(Spacer(1, 10))
        
        # --- WORK DETAILS TABLE ---
        work_headers = [
            Paragraph("<b>Days</b>", styles['body_bold']),
            Paragraph("<b>Description</b>", styles['body_bold']),
            Paragraph("<b>Quantity</b>", styles['right_body_bold']),
            Paragraph("<b>Rate</b>", styles['right_body_bold']),
            Paragraph("<b>Amount</b>", styles['right_body_bold'])
        ]
        
        work_table_data = [work_headers]
        for idx, d in enumerate(days_list):
            dt = d.get('date', job.date)
            wt = d.get('work_type', 'hourly')
            veh = d.get('vehicle', job.vehicle)
            day_number = d.get('day_number', idx + 1)
            day_label = f"Day {day_number}"
            
            if wt == 'hourly':
                if veh == 'Tractor':
                    qty = f"{d.get('hours')} Days"
                    rate = f"Rs. {d.get('rate_per_hour')}/Day"
                    desc = f"{veh} Rental Work (Daily)"
                else:
                    qty = f"{d.get('hours')} Hours"
                    rate = f"Rs. {d.get('rate_per_hour')}/Hr"
                    desc = f"{veh} Rental Work ({wt.capitalize()})"
                amt = float(d.get('hours') or 0.0) * float(d.get('rate_per_hour') or 0.0)
            else:
                qty = f"{d.get('loads')} Loads"
                rate = f"Rs. {d.get('rate_per_load')}/Load"
                desc = f"{veh} Rental Work ({wt.capitalize()})"
                amt = int(d.get('loads') or 0) * float(d.get('rate_per_load') or 0.0)
                
            work_row = [
                Paragraph(day_label, styles['body']),
                Paragraph(desc, styles['body']),
                Paragraph(qty, styles['right_body']),
                Paragraph(rate, styles['right_body']),
                Paragraph(f"Rs. {amt:,.2f}", styles['right_body_bold'])
            ]
            work_table_data.append(work_row)
            
        work_table = Table(work_table_data, colWidths=[1.1 * inch, 2.7 * inch, 1.1 * inch, 1.2 * inch, 1.4 * inch])
        work_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
            ('ALIGN', (0,0), (-1,-1), 'LEFT'),
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(work_table)
        story.append(Spacer(1, 15))
        
        # --- EXPENSES BREAKDOWN & TOTALS (Side by Side) ---
        expenses_p = [
            Paragraph("<b>EXPENSES INCURRED (FOR JOB)</b>", styles['body_bold']),
            Spacer(1, 5)
        ]
        
        expenses_rows = [
            ["Food Expense", f"Rs. {job.food:,.2f}"],
            ["Bata / Allowance", f"Rs. {job.bata:,.2f}"],
            ["Diesel Expense", f"Rs. {job.diesel:,.2f}"],
            ["Additional Charges", f"Rs. {job.additional_charges:,.2f}"],
            ["Other Expenses", f"Rs. {job.other_expenses:,.2f}"],
            ["Total Job Expenses", f"Rs. {job.total_expenses:,.2f}"],
            ["Total Expenses (excl. Diesel)", f"Rs. {(job.total_expenses - (job.diesel or 0)):,.2f}"]
        ]
        
        exp_table_data = []
        for label, val in expenses_rows:
            is_total = "Total" in label
            lbl_style = styles['body_bold'] if is_total else styles['body']
            val_style = styles['right_body_bold'] if is_total else styles['right_body']
            exp_table_data.append([Paragraph(label, lbl_style), Paragraph(val, val_style)])
            
        exp_table = Table(exp_table_data, colWidths=[2.2 * inch, 1.3 * inch])
        exp_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('LINEBELOW', (0,0), (-1,-2), 0.5, colors.HexColor('#e2e8f0')),
            ('LINEABOVE', (0,-1), (-1,-1), 1, colors.HexColor('#475569')),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        
        # Totals / Summary Table (Right Column)
        gross_work = job.total_amount or 0
        excl_diesel = (job.total_expenses or 0) - (job.diesel or 0)
        diesel_exp = job.diesel or 0
        balance_val = gross_work + excl_diesel - diesel_exp
        
        totals_rows = [
            ["Subtotal (Gross Work)", f"Rs. {gross_work:,.2f}"],
            ["Total Expenses (excl. Diesel)", f"Rs. {excl_diesel:,.2f}"],
            ["Minus: Diesel Expense", f"Rs. {diesel_exp:,.2f}"],
            ["Balance", f"Rs. {balance_val:,.2f}"]
        ]
        
        tot_table_data = []
        for label, val in totals_rows:
            is_balance = label == "Balance"
            lbl_style = styles['body_bold'] if is_balance else styles['body']
            val_style = styles['right_body_bold'] if is_balance else styles['right_body']
            
            if is_balance:
                val_style = ParagraphStyle('BalText', parent=val_style, textColor=colors.HexColor('#b91c1c') if balance_val > 0 else colors.HexColor('#16a34a'))
                
            tot_table_data.append([Paragraph(label, lbl_style), Paragraph(val, val_style)])
            
        tot_table = Table(tot_table_data, colWidths=[2.2 * inch, 1.3 * inch])
        tot_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ('LINEBELOW', (0,0), (-1,-2), 0.5, colors.HexColor('#e2e8f0')),
            ('LINEABOVE', (0,-1), (-1,-1), 1, colors.HexColor('#475569')),
            ('TOPPADDING', (0,0), (-1,-1), 4),
            ('BOTTOMPADDING', (0,0), (-1,-1), 4),
        ]))
        
        summary_layout_data = [
            [
                Paragraph("<b>EXPENSES INCURRED</b>", styles['body_bold']),
                Paragraph("<b>BILL SUMMARY</b>", styles['body_bold'])
            ],
            [
                exp_table,
                tot_table
            ]
        ]
        summary_layout_table = Table(summary_layout_data, colWidths=[3.75 * inch, 3.75 * inch])
        summary_layout_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
            ('TOPPADDING', (0,0), (-1,-1), 0),
            ('LEFTPADDING', (0,0), (-1,-1), 0),
            ('RIGHTPADDING', (0,0), (-1,-1), 0),
        ]))
        story.append(summary_layout_table)
        story.append(Spacer(1, 20))
        
        # --- FOOTER REMARK ---
        query_style = ParagraphStyle(
            'QueryNote',
            parent=styles['body'],
            textColor=colors.HexColor('#64748b'),
            alignment=1, # Centered
            fontName='Helvetica-Oblique',
            fontSize=9
        )
        story.append(Paragraph("For any queries, please contact the owner: ASHOK G (+91 9845174737)", query_style))
        story.append(Spacer(1, 20))
        
        # --- SIGNATURE BLOCK ---
        sig_data = [
            [
                Paragraph("Customer Signature:<br/><br/>_________________________", styles['body']),
                Paragraph("Owner Signature:<br/><br/>_________________________", styles['right_body'])
            ]
        ]
        sig_table = Table(sig_data, colWidths=[3.75 * inch, 3.75 * inch])
        sig_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'BOTTOM'),
        ]))
        
        # Ensure signature stays with page
        story.append(KeepTogether(sig_table))
        
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()

    @staticmethod
    def generate_driver_bill(driver, payments, jobs, date_range_label):
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )
        
        styles = PDFGenerator.get_base_styles()
        story = []
        
        # Header
        header_data = [
            [
                Paragraph("Sri Lakshmi Narayana Swamy Earth Movers", styles['title']),
                Paragraph(f"<b>DRIVER BILL / REPORT</b><br/>Date Range: {date_range_label}", styles['right_body'])
            ],
            [
                Paragraph(f"Proprietor: ASHOK G | Phone: +91 9845174737<br/>Driver Name: {driver.name} | Phone: {driver.phone}", styles['subtitle']),
                Paragraph("", styles['subtitle'])
            ]
        ]
        header_table = Table(header_data, colWidths=[4.8 * inch, 2.7 * inch])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 15))
        
        # Divider Line
        divider = Table([[""]], colWidths=[7.5 * inch])
        divider.setStyle(TableStyle([
            ('LINEABOVE', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ]))
        story.append(divider)
        story.append(Spacer(1, 15))
        
        # Calculate Total Bata
        total_bata = 0.0
        for job in jobs:
            total_bata += job.bata
        
        # --- PAYMENT HISTORY ---
        story.append(Paragraph("<b>PAYMENTS MADE TO DRIVER</b>", styles['h2']))
        story.append(Spacer(1, 5))
        
        pay_headers = [
            Paragraph("<b>Date</b>", styles['body_bold']),
            Paragraph("<b>Notes / Remarks</b>", styles['body_bold']),
            Paragraph("<b>Amount Paid</b>", styles['right_body_bold'])
        ]
        
        pay_rows = [pay_headers]
        total_paid = 0.0
        
        for pay in payments:
            total_paid += pay.amount
            pay_rows.append([
                Paragraph(format_date(pay.date), styles['body']),
                Paragraph(pay.notes or 'Regular payment', styles['body']),
                Paragraph(f"Rs. {pay.amount:,.2f}", styles['right_body'])
            ])
            
        if len(payments) == 0:
            pay_rows.append([Paragraph("No payments recorded for this driver in this period.", styles['body']), "", ""])
            
        pay_rows.append([
            Paragraph("<b>Total Driver Payments</b>", styles['body_bold']),
            Paragraph("", styles['body']),
            Paragraph(f"Rs. {total_paid:,.2f}", styles['right_body_bold'])
        ])
        
        pay_table = Table(pay_rows, colWidths=[1.5 * inch, 4.3 * inch, 1.7 * inch])
        pay_table_style = [
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
            ('GRID', (0,0), (-1,-2), 0.5, colors.HexColor('#cbd5e1')),
            ('LINEABOVE', (0,-1), (-1,-1), 1.5, colors.HexColor('#475569')),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]
        if len(payments) == 0:
            pay_table_style.append(('SPAN', (0,1), (1,1)))
        pay_table.setStyle(TableStyle(pay_table_style))
        story.append(pay_table)
        story.append(Spacer(1, 30))
        
        # Summary box
        summary_rows = [
            [Paragraph("<b>Total Bata / Allowance Earned</b>", styles['body']), Paragraph(f"Rs. {total_bata:,.2f}", styles['right_body'])],
            [Paragraph("<b>Total Payments Received</b>", styles['body_bold']), Paragraph(f"Rs. {total_paid:,.2f}", styles['right_body_bold'])]
        ]
        summary_table = Table(summary_rows, colWidths=[4.0 * inch, 3.5 * inch])
        summary_table.setStyle(TableStyle([
            ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor('#cbd5e1')),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(KeepTogether(summary_table))
        
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()

    @staticmethod
    def generate_fuel_report(entries, date_range_label):
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )
        
        styles = PDFGenerator.get_base_styles()
        story = []
        
        # Header
        header_data = [
            [
                Paragraph("Sri Lakshmi Narayana Swamy Earth Movers", styles['title']),
                Paragraph(f"<b>FUEL PURCHASE & COST REPORT</b><br/>Period: {date_range_label}", styles['right_body'])
            ],
            [
                Paragraph("Proprietor: ASHOK G | Phone: +91 9845174737<br/>JCB & Tractor Rental Services", styles['subtitle']),
                Paragraph("", styles['subtitle'])
            ]
        ]
        header_table = Table(header_data, colWidths=[4.8 * inch, 2.7 * inch])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 15))
        
        # Divider Line
        divider = Table([[""]], colWidths=[7.5 * inch])
        divider.setStyle(TableStyle([
            ('LINEABOVE', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ]))
        story.append(divider)
        story.append(Spacer(1, 15))
        
        # Fuel log table
        fuel_headers = [
            Paragraph("<b>Date</b>", styles['body_bold']),
            Paragraph("<b>Vehicle</b>", styles['body_bold']),
            Paragraph("<b>Litres (L)</b>", styles['right_body_bold']),
            Paragraph("<b>Price / Litre</b>", styles['right_body_bold']),
            Paragraph("<b>Total Cost</b>", styles['right_body_bold']),
            Paragraph("<b>Notes</b>", styles['body_bold'])
        ]
        
        fuel_rows = [fuel_headers]
        total_litres = 0.0
        total_cost = 0.0
        
        for entry in entries:
            total_litres += entry.litres
            total_cost += entry.total_cost
            fuel_rows.append([
                Paragraph(format_date(entry.date), styles['body']),
                Paragraph(entry.vehicle, styles['body']),
                Paragraph(f"{entry.litres:.2f}", styles['right_body']),
                Paragraph(f"Rs. {entry.price_per_litre:.2f}", styles['right_body']),
                Paragraph(f"Rs. {entry.total_cost:,.2f}", styles['right_body_bold']),
                Paragraph(entry.notes or '', styles['body'])
            ])
            
        if len(entries) == 0:
            fuel_rows.append([Paragraph("No fuel logs recorded in this period.", styles['body']), "", "", "", "", ""])
            
        fuel_rows.append([
            Paragraph("<b>Total Summary</b>", styles['body_bold']),
            Paragraph("", styles['body']),
            Paragraph(f"<b>{total_litres:.2f} L</b>", styles['right_body_bold']),
            Paragraph("", styles['right_body']),
            Paragraph(f"Rs. {total_cost:,.2f}", styles['right_body_bold']),
            Paragraph("", styles['body'])
        ])
        
        fuel_table = Table(fuel_rows, colWidths=[1.0 * inch, 1.0 * inch, 1.2 * inch, 1.2 * inch, 1.5 * inch, 1.6 * inch])
        fuel_table_style = [
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f1f5f9')),
            ('GRID', (0,0), (-1,-2), 0.5, colors.HexColor('#cbd5e1')),
            ('LINEABOVE', (0,-1), (-1,-1), 1.5, colors.HexColor('#475569')),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]
        if len(entries) == 0:
            fuel_table_style.append(('SPAN', (0,1), (-1,1)))
        fuel_table.setStyle(TableStyle(fuel_table_style))
        story.append(fuel_table)
        
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()

    @staticmethod
    def generate_pl_report(data, date_range_label):
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )
        
        styles = PDFGenerator.get_base_styles()
        story = []
        
        # Header
        header_data = [
            [
                Paragraph("Sri Lakshmi Narayana Swamy Earth Movers", styles['title']),
                Paragraph(f"<b>PROFIT & LOSS STATEMENT</b><br/>Period: {date_range_label}", styles['right_body'])
            ],
            [
                Paragraph("Proprietor: ASHOK G | Phone: +91 9845174737<br/>JCB & Tractor Rental Services", styles['subtitle']),
                Paragraph("", styles['subtitle'])
            ]
        ]
        header_table = Table(header_data, colWidths=[4.8 * inch, 2.7 * inch])
        header_table.setStyle(TableStyle([
            ('VALIGN', (0,0), (-1,-1), 'TOP'),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ]))
        story.append(header_table)
        story.append(Spacer(1, 15))
        
        # Divider Line
        divider = Table([[""]], colWidths=[7.5 * inch])
        divider.setStyle(TableStyle([
            ('LINEABOVE', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
            ('BOTTOMPADDING', (0,0), (-1,-1), 0),
        ]))
        story.append(divider)
        story.append(Spacer(1, 15))
        
        # --- INCOME TABLE ---
        story.append(Paragraph("<b>1. REVENUE (INCOME)</b>", styles['h2']))
        story.append(Spacer(1, 5))
        
        inc_data = [
            [Paragraph("<b>Category</b>", styles['body_bold']), Paragraph("<b>Amount (Rs.)</b>", styles['right_body_bold'])],
            [Paragraph("Hourly Jobs Billing", styles['body']), Paragraph(f"Rs. {data['income']['hourly']:,.2f}", styles['right_body'])],
            [Paragraph("Loading Jobs Billing", styles['body']), Paragraph(f"Rs. {data['income']['loading']:,.2f}", styles['right_body'])],
            [Paragraph("<b>Total Gross Revenue</b>", styles['body_bold']), Paragraph(f"<b>Rs. {data['income']['total']:,.2f}</b>", styles['right_body_bold'])]
        ]
        inc_table = Table(inc_data, colWidths=[5.0 * inch, 2.5 * inch])
        inc_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f8fafc')),
            ('GRID', (0,0), (-1,-2), 0.5, colors.HexColor('#e2e8f0')),
            ('LINEABOVE', (0,-1), (-1,-1), 1.5, colors.HexColor('#475569')),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(inc_table)
        story.append(Spacer(1, 15))
        
        # --- EXPENSES TABLE ---
        story.append(Paragraph("<b>2. OPERATING EXPENSES</b>", styles['h2']))
        story.append(Spacer(1, 5))
        
        exp_data = [
            [Paragraph("<b>Category</b>", styles['body_bold']), Paragraph("<b>Amount (Rs.)</b>", styles['right_body_bold'])],
            [Paragraph("Job Expense: Food & Bata (Allowance)", styles['body']), Paragraph(f"Rs. {data['expenses']['job_food'] + data['expenses']['job_bata']:,.2f}", styles['right_body'])],
            [Paragraph("Job Expense: Job Diesel Consumed", styles['body']), Paragraph(f"Rs. {data['expenses']['job_diesel']:,.2f}", styles['right_body'])],
            [Paragraph("Job Expense: Additional & Other Charges", styles['body']), Paragraph(f"Rs. {data['expenses']['job_additional'] + data['expenses']['job_other']:,.2f}", styles['right_body'])],
            [Paragraph("Direct Driver Cash Payments", styles['body']), Paragraph(f"Rs. {data['expenses']['driver_payments']:,.2f}", styles['right_body'])],
            [Paragraph(f"Bulk Fuel Purchase Costs ({data['expenses']['fuel_litres']:.1f} Litres)", styles['body']), Paragraph(f"Rs. {data['expenses']['fuel_purchases']:,.2f}", styles['right_body'])],
            [Paragraph("<b>Total Operating Expenses</b>", styles['body_bold']), Paragraph(f"<b>Rs. {data['expenses']['total']:,.2f}</b>", styles['right_body_bold'])]
        ]
        exp_table = Table(exp_data, colWidths=[5.0 * inch, 2.5 * inch])
        exp_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#f8fafc')),
            ('GRID', (0,0), (-1,-2), 0.5, colors.HexColor('#e2e8f0')),
            ('LINEABOVE', (0,-1), (-1,-1), 1.5, colors.HexColor('#475569')),
            ('TOPPADDING', (0,0), (-1,-1), 6),
            ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ]))
        story.append(exp_table)
        story.append(Spacer(1, 20))
        
        # --- NET PROFIT BOX ---
        story.append(Paragraph("<b>3. NET FINANCIAL SUMMARY</b>", styles['h2']))
        story.append(Spacer(1, 5))
        
        profit_color = colors.HexColor('#16a34a') if data['net_profit'] >= 0 else colors.HexColor('#b91c1c')
        net_profit_style = ParagraphStyle(
            'NetProfitStyle',
            parent=styles['right_body_bold'],
            fontName='Helvetica-Bold',
            fontSize=14,
            leading=18,
            textColor=profit_color,
            alignment=2
        )
        
        summary_rows = [
            [Paragraph("Total Revenue (A)", styles['body_bold']), Paragraph(f"Rs. {data['income']['total']:,.2f}", styles['right_body_bold'])],
            [Paragraph("Total Expenses (B)", styles['body_bold']), Paragraph(f"Rs. {data['expenses']['total']:,.2f}", styles['right_body_bold'])],
            [Paragraph("<b>NET PROFIT / LOSS (A - B)</b>", styles['body_bold']), Paragraph(f"Rs. {data['net_profit']:,.2f}", net_profit_style)]
        ]
        
        summary_table = Table(summary_rows, colWidths=[4.0 * inch, 3.5 * inch])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#f1f5f9')),
            ('GRID', (0,0), (-1,-1), 1, colors.HexColor('#cbd5e1')),
            ('TOPPADDING', (0,0), (-1,-1), 8),
            ('BOTTOMPADDING', (0,0), (-1,-1), 8),
        ]))
        story.append(KeepTogether(summary_table))
        
        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()

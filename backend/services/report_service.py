from backend.database.connection import db
from backend.models.customer import CustomerJob, Customer
from backend.models.driver import DriverPayment, Driver
from backend.models.fuel import FuelEntry
from datetime import datetime, date, timedelta
from sqlalchemy.orm import joinedload

class ReportService:
    @staticmethod
    def get_dashboard_data():
        today_str = date.today().strftime('%Y-%m-%d')
        current_month_prefix = date.today().strftime('%Y-%m')
        
        # --- TODAY STATS ---
        today_jobs = CustomerJob.query.filter(CustomerJob.date == today_str).all()
        today_income = sum(job.total_amount for job in today_jobs)
        
        # Today's expenses = Job expenses + Driver payments today + Fuel purchases today
        today_job_expenses = sum(job.total_expenses for job in today_jobs)
        today_driver_payments = sum(p.amount for p in DriverPayment.query.filter(DriverPayment.date == today_str).all())
        today_fuel_purchases = sum(f.total_cost for f in FuelEntry.query.filter(FuelEntry.date == today_str).all())
        today_expenses = today_job_expenses + today_driver_payments + today_fuel_purchases
        today_profit = today_income - today_expenses
        
        # --- MONTHLY STATS ---
        month_jobs = CustomerJob.query.filter(CustomerJob.date.like(f"{current_month_prefix}%")).all()
        month_income = sum(job.total_amount for job in month_jobs)
        
        month_job_expenses = sum(job.total_expenses for job in month_jobs)
        month_driver_payments = sum(p.amount for p in DriverPayment.query.filter(DriverPayment.date.like(f"{current_month_prefix}%")).all())
        month_fuel_purchases = sum(f.total_cost for f in FuelEntry.query.filter(FuelEntry.date.like(f"{current_month_prefix}%")).all())
        month_expenses = month_job_expenses + month_driver_payments + month_fuel_purchases
        month_profit = month_income - month_expenses
        
        # --- RECENT ACTIVITIES ---
        recent_activities = []
        
        # 5 Recent Jobs
        recent_jobs = CustomerJob.query.options(joinedload(CustomerJob.customer)).order_by(CustomerJob.created_at.desc()).limit(5).all()
        for job in recent_jobs:
            recent_activities.append({
                'type': 'job',
                'title': f"Work done for {job.customer.name}",
                'amount': job.total_amount,
                'date': job.date,
                'vehicle': job.vehicle,
                'created_at': job.created_at.isoformat() if job.created_at else None
            })
            
        # 5 Recent Driver Payments
        recent_payments = DriverPayment.query.options(joinedload(DriverPayment.driver)).order_by(DriverPayment.id.desc()).limit(5).all()
        for payment in recent_payments:
            recent_activities.append({
                'type': 'driver_payment',
                'title': f"Paid Driver {payment.driver.name}",
                'amount': payment.amount,
                'date': payment.date,
                'vehicle': '',
                'created_at': payment.date + "T00:00:00" # fallback
            })
            
        # 5 Recent Fuel Entries
        recent_fuels = FuelEntry.query.order_by(FuelEntry.id.desc()).limit(5).all()
        for fuel in recent_fuels:
            recent_activities.append({
                'type': 'fuel',
                'title': f"Fuel purchase for {fuel.vehicle}",
                'amount': fuel.total_cost,
                'date': fuel.date,
                'vehicle': fuel.vehicle,
                'created_at': fuel.date + "T00:00:00" # fallback
            })
            
        # Sort recent activities by date desc
        recent_activities.sort(key=lambda x: x['date'], reverse=True)
        recent_activities = recent_activities[:10]
        
        # --- LAST 7 DAYS TREND ---
        daily_trend = []
        for i in range(6, -1, -1):
            day = date.today() - timedelta(days=i)
            day_str = day.strftime('%Y-%m-%d')
            day_label = day.strftime('%d %b')

            day_jobs = CustomerJob.query.filter(CustomerJob.date == day_str).all()
            day_income = sum(job.total_amount for job in day_jobs)
            day_job_expenses = sum(job.total_expenses for job in day_jobs)
            day_driver_payments = sum(p.amount for p in DriverPayment.query.filter(DriverPayment.date == day_str).all())
            day_fuel = sum(f.total_cost for f in FuelEntry.query.filter(FuelEntry.date == day_str).all())
            day_expenses = day_job_expenses + day_driver_payments + day_fuel
            day_profit = day_income - day_expenses

            daily_trend.append({
                'day': day_label,
                'Income': round(day_income, 2),
                'Expenses': round(day_expenses, 2),
                'Profit': round(day_profit, 2),
            })

        return {
            'today': {
                'income': round(today_income, 2),
                'expenses': round(today_expenses, 2),
                'profit': round(today_profit, 2)
            },
            'month': {
                'income': round(month_income, 2),
                'expenses': round(month_expenses, 2),
                'profit': round(month_profit, 2)
            },
            'recent_activities': recent_activities,
            'daily_trend': daily_trend
        }
        
    @staticmethod
    def get_financial_report(start_date, end_date):
        """Calculates detailed P&L breakdown for a date range (YYYY-MM-DD)."""
        jobs = CustomerJob.query.filter(CustomerJob.date >= start_date, CustomerJob.date <= end_date).all()
        payments = DriverPayment.query.filter(DriverPayment.date >= start_date, DriverPayment.date <= end_date).all()
        fuels = FuelEntry.query.filter(FuelEntry.date >= start_date, FuelEntry.date <= end_date).all()
        
        # Income breakdown
        hourly_jobs = [j for j in jobs if j.work_type == 'hourly']
        loading_jobs = [j for j in jobs if j.work_type == 'loading']
        
        hourly_income = sum(j.total_amount for j in hourly_jobs)
        loading_income = sum(j.total_amount for j in loading_jobs)
        total_income = hourly_income + loading_income
        
        # Job expenses breakdown
        food_exp = sum(j.food for j in jobs)
        bata_exp = sum(j.bata for j in jobs)
        diesel_exp = sum(j.diesel for j in jobs)
        additional_exp = sum(j.additional_charges for j in jobs)
        other_exp = sum(j.other_expenses for j in jobs)
        total_job_expenses = food_exp + bata_exp + diesel_exp + additional_exp + other_exp
        
        # Other expenses
        total_driver_payments = sum(p.amount for p in payments)
        total_fuel_purchases = sum(f.total_cost for f in fuels)
        total_fuel_litres = sum(f.litres for f in fuels)
        
        total_expenses = total_job_expenses + total_driver_payments + total_fuel_purchases
        net_profit = total_income - total_expenses
        
        return {
            'period': {
                'start': start_date,
                'end': end_date
            },
            'income': {
                'hourly': round(hourly_income, 2),
                'loading': round(loading_income, 2),
                'total': round(total_income, 2)
            },
            'expenses': {
                'job_food': round(food_exp, 2),
                'job_bata': round(bata_exp, 2),
                'job_diesel': round(diesel_exp, 2),
                'job_additional': round(additional_exp, 2),
                'job_other': round(other_exp, 2),
                'job_total': round(total_job_expenses, 2),
                'driver_payments': round(total_driver_payments, 2),
                'fuel_purchases': round(total_fuel_purchases, 2),
                'fuel_litres': round(total_fuel_litres, 2),
                'total': round(total_expenses, 2)
            },
            'net_profit': round(net_profit, 2)
        }

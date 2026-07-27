from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from backend.models.user import User
from backend.database.connection import db

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    username = data.get('username')
    password = data.get('password')
    
    print(f"[DEBUG AUTH] Login attempt for username: '{username}'")
    
    if not username or not password:
        print("[DEBUG AUTH] Missing username or password")
        return jsonify({'message': 'Username and password are required'}), 400
        
    user = User.query.filter_by(username=username).first()
    if not user:
        print(f"[DEBUG AUTH] User '{username}' not found in database")
        return jsonify({'message': 'Invalid credentials'}), 401
        
    pwd_check = user.check_password(password)
    print(f"[DEBUG AUTH] User found. Password match result: {pwd_check}")
    
    if not pwd_check:
        return jsonify({'message': 'Invalid credentials'}), 401
        
    # Generate token
    access_token = create_access_token(identity=str(user.id))
    print(f"[DEBUG AUTH] Login successful. Access token generated for user id {user.id}")
    return jsonify({
        'token': access_token,
        'user': user.to_dict()
    }), 200

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def me():
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    if not user:
        return jsonify({'message': 'User not found'}), 444
    return jsonify(user.to_dict()), 200

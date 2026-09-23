"""
Musafir Cafe - Menu Routes Blueprint
"""
from flask import Blueprint, jsonify
from ..services.n8n_service import N8nService

menu_bp = Blueprint("menu", __name__, url_prefix="/api")

@menu_bp.route("/menu", methods=["GET"])
def get_menu():
    """Returns the list of menu items from n8n or fallback."""
    try:
        items = N8nService.get_menu()
        return jsonify(items), 200
    except Exception as e:
        return jsonify({"error": "Failed to load menu", "details": str(e)}), 500

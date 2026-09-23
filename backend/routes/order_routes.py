"""
Musafir Cafe - Order Routes Blueprint
"""
from flask import Blueprint, request, jsonify
from pydantic import ValidationError
from ..models.order_models import OrderRequest
from ..services.n8n_service import N8nService

order_bp = Blueprint("order", __name__, url_prefix="/api")

@order_bp.route("/order", methods=["POST"])
def place_order():
    """
    Validates and places an order to n8n webhook.
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON body provided"}), 400

    try:
        order_obj = OrderRequest(**data)
    except ValidationError as ve:
        return jsonify({"error": "Validation error", "details": ve.errors()}), 422
    except Exception as e:
        return jsonify({"error": "Bad request", "details": str(e)}), 400

    try:
        result = N8nService.submit_order(order_obj)
        return jsonify(result), 200
    except Exception as e:
        return jsonify({
            "error": "Failed to submit order to n8n webhook",
            "details": str(e)
        }), 502

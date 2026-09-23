"""
Musafir Cafe - Flask Backend Server
Architectural separation for Musafir Cafe Ordering System.
"""
from flask import Flask, jsonify
from flask_cors import CORS
import logging
from .config import Config
from .routes.menu_routes import menu_bp
from .routes.order_routes import order_bp

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("musafir_cafe")

def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    # Enable CORS for frontend integration
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Register Blueprints
    app.register_blueprint(menu_bp)
    app.register_blueprint(order_bp)

    @app.route("/api/health", methods=["GET"])
    def health_check():
        return jsonify({
            "status": "healthy",
            "service": "Musafir Cafe Backend",
            "menu_webhook": Config.MENU_WEBHOOK_URL,
            "order_webhook": Config.ORDER_WEBHOOK_URL
        }), 200

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"error": "Resource not found"}), 404

    @app.errorhandler(500)
    def server_error(e):
        return jsonify({"error": "Internal server error"}), 500

    return app

if __name__ == "__main__":
    application = create_app()
    logger.info(f"Starting Musafir Cafe Backend on port {Config.PORT}")
    application.run(host="0.0.0.0", port=Config.PORT, debug=Config.DEBUG)

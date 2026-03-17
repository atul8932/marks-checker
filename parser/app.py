import os

from flask import Flask
from flask_cors import CORS

from routes.parse import parse_bp


def create_app() -> Flask:
    app = Flask(__name__)
    CORS(app)

    app.register_blueprint(parse_bp)

    @app.get("/health")
    def health():
        return {"ok": True}

    return app


def main() -> None:
    port = int(os.getenv("PARSER_PORT", "5001"))
    app = create_app()
    app.run(host="0.0.0.0", port=port, debug=True)


if __name__ == "__main__":
    main()


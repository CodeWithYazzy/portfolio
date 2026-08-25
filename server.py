"""Local demo backend for the portfolio.

Run with: python server.py
The frontend calls POST /api/calculator for the Calculator App demo.
"""

from __future__ import annotations

import ast
import json
import operator
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent
OPS = {
    ast.Add: operator.add,
    ast.Sub: operator.sub,
    ast.Mult: operator.mul,
    ast.Div: operator.truediv,
    ast.Mod: operator.mod,
    ast.Pow: operator.pow,
    ast.USub: operator.neg,
    ast.UAdd: operator.pos,
}


def calculate(expression: str) -> float | int:
    """Evaluate the calculator's arithmetic safely on the server."""
    if not expression or len(expression) > 120:
        raise ValueError("Enter a valid expression.")

    def visit(node: ast.AST) -> float | int:
        if isinstance(node, ast.Expression):
            return visit(node.body)
        if isinstance(node, ast.Constant) and isinstance(node.value, (int, float)):
            if abs(node.value) > 1_000_000_000_000:
                raise ValueError("Number is too large.")
            return node.value
        if isinstance(node, ast.BinOp) and type(node.op) in OPS:
            left, right = visit(node.left), visit(node.right)
            if isinstance(node.op, ast.Pow) and abs(right) > 10:
                raise ValueError("Power is too large.")
            return OPS[type(node.op)](left, right)
        if isinstance(node, ast.UnaryOp) and type(node.op) in OPS:
            return OPS[type(node.op)](visit(node.operand))
        raise ValueError("Only calculator arithmetic is supported.")

    try:
        result = visit(ast.parse(expression.replace("×", "*").replace("÷", "/").replace("−", "-"), mode="eval"))
    except ZeroDivisionError as exc:
        raise ValueError("Cannot divide by zero.") from exc
    except (SyntaxError, TypeError, ValueError, OverflowError) as exc:
        if isinstance(exc, ValueError) and str(exc) not in {"invalid expression"}:
            raise
        raise ValueError("Enter a valid expression.") from exc

    if isinstance(result, float) and result.is_integer():
        return int(result)
    return result


class DemoHandler(BaseHTTPRequestHandler):
    def send_json(self, status: int, payload: dict) -> None:
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self) -> None:  # noqa: N802
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        if urlparse(self.path).path == "/api/health":
            self.send_json(200, {"ok": True, "service": "portfolio-demo-backend"})
            return
        self.send_json(404, {"error": "Not found"})

    def do_POST(self) -> None:  # noqa: N802
        if urlparse(self.path).path != "/api/calculator":
            self.send_json(404, {"error": "Not found"})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length) or b"{}")
            result = calculate(str(payload.get("expression", "")))
            self.send_json(200, {"ok": True, "expression": payload["expression"], "result": result})
        except (ValueError, KeyError, json.JSONDecodeError) as exc:
            self.send_json(400, {"ok": False, "error": str(exc)})

    def log_message(self, format: str, *args: object) -> None:
        print(f"[demo-api] {self.address_string()} - {format % args}")


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", 8766), DemoHandler)
    print("Demo backend running at http://127.0.0.1:8766")
    print("Keep this terminal open while testing Run Demo.")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nDemo backend stopped.")
    finally:
        server.server_close()

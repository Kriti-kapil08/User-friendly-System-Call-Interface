
from flask import Flask, render_template, request, jsonify, session
import os, time
from users import users

app = Flask(__name__)
app.secret_key = "securekey"
LOG_FILE = "log.txt"

def log_event(user, syscall, path, status, reason):
    with open(LOG_FILE, "a") as f:
        f.write(f"{time.ctime()} | {user} | {syscall} | {path} | {status} | {reason}\n")

def is_allowed(user, path):
    path = os.path.abspath(path)
    for d in users[user]["allowed_dirs"]:
        if path.startswith(os.path.abspath(d) + os.sep):
            return True
    return False

@app.route("/")
def home():
    return render_template("index1.html")

@app.route("/login", methods=["POST"])
def login():
    data = request.json
    if data["username"] in users and users[data["username"]]["password"] == data["password"]:
        session["user"] = data["username"]
        return jsonify({"status": "success"})
    return jsonify({"status": "fail"})

@app.route("/read", methods=["POST"])
def read_file():
    user = session.get("user")
    path = request.json["path"]
    if not user:
        return jsonify({"msg": "Login first"})
    if not os.path.exists(path):
        log_event(user, "READ", path, "FAIL", "FILE NOT FOUND")
        return jsonify({"msg": "File not found"})
    if not is_allowed(user, path):
        log_event(user, "READ", path, "DENIED", "UNAUTHORIZED")
        return jsonify({"msg": "Unauthorized access"})
    with open(path, "r") as f:
        content = f.read()
    log_event(user, "READ", path, "SUCCESS", "READ OK")
    return jsonify({"msg": "Read successful", "data": content})

@app.route("/write", methods=["POST"])
def write_file():
    user = session.get("user")
    path = request.json["path"]
    data = request.json["data"]
    if not user:
        return jsonify({"msg": "Login first"})
    if "WRITE" not in users[user]["permissions"]:
        log_event(user, "WRITE", path, "DENIED", "NO PERMISSION")
        return jsonify({"msg": "Write denied"})
    with open(path, "a") as f:
        f.write(data + "\n")
    log_event(user, "WRITE", path, "SUCCESS", "WRITE OK")
    return jsonify({"msg": "Write successful"})

@app.route("/delete", methods=["POST"])
def delete_file():
    user = session.get("user")
    path = request.json["path"]
    if not user:
        return jsonify({"msg": "Login first"})
    if "DELETE" not in users[user]["permissions"]:
        log_event(user, "DELETE", path, "DENIED", "NO PERMISSION")
        return jsonify({"msg": "Delete denied"})
    if not os.path.exists(path):
        log_event(user, "DELETE", path, "FAIL", "FILE NOT FOUND")
        return jsonify({"msg": "File not found"})
    os.remove(path)
    log_event(user, "DELETE", path, "SUCCESS", "FILE DELETED")
    return jsonify({"msg": "File deleted"})

if __name__ == "__main__":
    app.run(debug=True)

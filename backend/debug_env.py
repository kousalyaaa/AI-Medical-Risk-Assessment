import sys
import os

print(f"Python executable: {sys.executable}")
print(f"CWD: {os.getcwd()}")
print(f"Sys path: {sys.path}")

try:
    import flask
    print(f"Flask imported from: {flask.__file__}")
except ImportError as e:
    print(f"Failed to import flask: {e}")

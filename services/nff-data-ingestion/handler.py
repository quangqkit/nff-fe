import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from main import main

def handler(event, context):
    return main(event, context)

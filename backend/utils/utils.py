import os

def create_directory(path):
    if not os.path.exists(path):
        os.makedirs(path)

def load_labels(label_file):
    with open(label_file, 'r') as file:
        return {int(k): v.strip() for k, v in (line.split(':') for line in file)}

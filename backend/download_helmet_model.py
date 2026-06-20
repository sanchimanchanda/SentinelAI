from huggingface_hub import hf_hub_download
import os

os.makedirs("models", exist_ok=True)
print("Downloading model via huggingface_hub...")
model_path = hf_hub_download(repo_id="iam-tsr/yolov8n-helmet-detection", filename="best.pt", local_dir="models")
print("Downloaded to:", model_path)

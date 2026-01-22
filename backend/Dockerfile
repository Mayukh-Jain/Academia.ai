# Use Python 3.9 as the base image
FROM python:3.10

# Set the working directory inside the container
WORKDIR /app

# Copy the requirements file first to leverage Docker caching
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the rest of the application code
COPY . .

# Create the static directory and set permissions (Crucial for HF Spaces)
# HF runs as user 1000, so we need to make sure it can write to these folders
RUN mkdir -p static/uploads && chmod -R 777 static

# Expose the port Hugging Face expects
EXPOSE 7860

# Start the application on port 7860
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "7860"]
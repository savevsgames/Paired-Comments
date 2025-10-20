#!/bin/bash
# Setup script for AI Training Demo

echo "🔧 Setting up AI Training Demo environment..."
echo ""

# Create virtual environment
echo "📦 Creating virtual environment..."
python -m venv venv

# Activate virtual environment
echo "✅ Activating virtual environment..."
source venv/Scripts/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

echo ""
echo "✅ Setup complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Activate environment: source venv/Scripts/activate"
echo "   2. Run data preparation: python src/data/prepare_datasets.py"
echo "   3. Review datasets in datasets/ folder"

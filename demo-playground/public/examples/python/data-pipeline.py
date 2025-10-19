# Data Pipeline with Pandas and NumPy
# ETL (Extract, Transform, Load) pattern for data processing

import pandas as pd
import numpy as np
from datetime import datetime, timedelta

class DataPipeline:
    def __init__(self, source_path, output_path):
        self.source_path = source_path
        self.output_path = output_path
        self.df = None

    def extract(self):
        """Load data from CSV file"""
        try:
            self.df = pd.read_csv(self.source_path)
            print(f"Loaded {len(self.df)} records from {self.source_path}")
            return self
        except FileNotFoundError:
            raise Exception(f"Source file not found: {self.source_path}")

    def transform(self):
        """Clean and transform data"""
        if self.df is None:
            raise Exception("No data loaded. Call extract() first.")

        self.df['timestamp'] = pd.to_datetime(self.df['timestamp'])

        self.df['amount'] = pd.to_numeric(self.df['amount'], errors='coerce')

        self.df = self.df.dropna(subset=['id', 'amount'])

        self.df = self.df[self.df['amount'] > 0]

        self.df['category'] = self.df['category'].str.lower().str.strip()

        self.df['rolling_avg'] = self.df.groupby('category')['amount'].transform(
            lambda x: x.rolling(window=7, min_periods=1).mean()
        )

        return self

    def load(self):
        """Save processed data"""
        if self.df is None:
            raise Exception("No data to load. Call transform() first.")

        self.df.to_csv(self.output_path, index=False)
        print(f"Saved {len(self.df)} records to {self.output_path}")
        return self

    def run(self):
        """Execute full ETL pipeline"""
        return self.extract().transform().load()

if __name__ == '__main__':
    pipeline = DataPipeline('data/raw.csv', 'data/processed.csv')
    pipeline.run()

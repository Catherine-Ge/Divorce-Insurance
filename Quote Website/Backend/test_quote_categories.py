"""Check actual deployed artifacts against all selectable form combinations."""
import itertools
import json
from pathlib import Path
import unittest
import numpy as np
import pandas as pd
from app import app, encoder, model


class QuoteCategoryTests(unittest.TestCase):
    def test_every_frontend_combination_is_supported(self):
        file = Path(__file__).resolve().parents[1] / 'frontend' / 'src' / 'quoteOptions.js'
        if not file.exists():
            file = Path(__file__).resolve().parents[2] / 'frontend' / 'src' / 'quoteOptions.js'
        fields = json.loads(file.read_text(encoding='utf-8').split('=', 1)[1].strip().rstrip(';'))
        names = [field['key'] for field in fields]
        combinations = list(itertools.product(*[[o['value'] for o in f['options']] for f in fields]))
        frame = pd.DataFrame(combinations, columns=names)
        probabilities = model.predict_proba(encoder.transform(frame))[:, 1]
        self.assertEqual(len(probabilities), 1320)
        self.assertTrue(np.isfinite(probabilities).all())
        self.assertTrue(((probabilities >= 0) & (probabilities <= 1)).all())

    def test_grouped_and_legacy_years_generate_same_quote(self):
        client = app.test_client()
        fields = {'AgeGroup': '30 to 34 years', 'YearsTogether': '10 years or more', 'Province': 'Ont.'}
        grouped = client.post('/predict', json=fields)
        self.assertEqual(grouped.status_code, 200)
        self.assertEqual(grouped.json['email_status'], 'not_requested')
        for years in ('10 years', '25 years', '50 years'):
            response = client.post('/predict', json={**fields, 'YearsTogether': years})
            self.assertEqual(response.status_code, 200)
            self.assertEqual(response.json, grouped.json)

    def test_invalid_categories_still_rejected(self):
        client = app.test_client()
        fields = {'AgeGroup': '30 to 34 years', 'YearsTogether': '10 years or more', 'Province': 'Ont.'}
        for changes in ({'YearsTogether': '51 years'}, {'YearsTogether': 'nonsense'}, {'Province': 'Nvt.'}):
            self.assertEqual(client.post('/predict', json={**fields, **changes}).status_code, 400)


if __name__ == '__main__':
    unittest.main()

import json
import os
import unittest

class TestMCUJson(unittest.TestCase):
    def setUp(self):
        # Load the JSON file before each test
        json_path = os.path.join(os.path.dirname(__file__), '..', 'mcu.json')
        with open(json_path, 'r', encoding='utf-8') as f:
            self.data = json.load(f)

    def test_parses_valid_json(self):
        # If setUp succeeds, JSON is valid
        self.assertIsInstance(self.data, list)

    def test_unique_ids(self):
        ids = [entry.get('id') for entry in self.data]
        self.assertEqual(len(ids), len(set(ids)), "Duplicate id values found")

    def test_required_fields_present(self):
        required_keys = {
            'id',
            'name',
            'releaseDate',
            'phase',
            'budget',
            'boxOffice',
            'imdbScore',
            'imdbId',
        }
        for movie in self.data:
            for key in required_keys:
                self.assertIn(key, movie)

if __name__ == '__main__':
    unittest.main()

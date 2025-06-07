import json
import os
import threading
import unittest
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.chrome.service import Service as ChromeService
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.common.exceptions import WebDriverException
from webdriver_manager.chrome import ChromeDriverManager


class TestSortTable(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        try:
            options = webdriver.ChromeOptions()
            options.add_argument("--headless=new")
            service = ChromeService(ChromeDriverManager().install())
            cls.driver = webdriver.Chrome(service=service, options=options)
        except Exception as e:  # noqa: BLE001 - broad catch for environment issues
            raise unittest.SkipTest(f"Chrome not available: {e}")

        cls.httpd = ThreadingHTTPServer(("localhost", 0), SimpleHTTPRequestHandler)
        cls.port = cls.httpd.server_address[1]
        cls.server_thread = threading.Thread(target=cls.httpd.serve_forever)
        cls.server_thread.daemon = True
        cls.server_thread.start()

        with open(os.path.join(os.path.dirname(__file__), "..", "mcu.json"), encoding="utf-8") as f:
            cls.movies = json.load(f)

    @classmethod
    def tearDownClass(cls):
        cls.driver.quit()
        cls.httpd.shutdown()
        cls.server_thread.join()

    def setUp(self):
        self.driver.get(f"http://localhost:{self.port}/mcu.html")
        WebDriverWait(self.driver, 10).until(
            lambda d: len(d.find_elements(By.CSS_SELECTOR, "#table-body tr")) > 0
        )

    def get_column(self, index):
        rows = self.driver.find_elements(By.CSS_SELECTOR, "#table-body tr")
        return [row.find_elements(By.TAG_NAME, "td")[index].text for row in rows]

    def test_sort_movie(self):
        header = self.driver.find_element(By.XPATH, "//th[.='Movie']")
        header.click()
        expected = [m["name"] for m in sorted(self.movies, key=lambda x: x["name"])]
        self.assertEqual(self.get_column(1), expected)

        header.click()
        expected = [
            m["name"] for m in sorted(self.movies, key=lambda x: x["name"], reverse=True)
        ]
        self.assertEqual(self.get_column(1), expected)

    def test_sort_release_date(self):
        header = self.driver.find_element(By.XPATH, "//th[.='Release Date']")
        header.click()
        expected = [
            m["releaseDate"]
            for m in sorted(self.movies, key=lambda x: x["releaseDate"])
        ]
        self.assertEqual(self.get_column(2), expected)

        header.click()
        expected = [
            m["releaseDate"]
            for m in sorted(self.movies, key=lambda x: x["releaseDate"], reverse=True)
        ]
        self.assertEqual(self.get_column(2), expected)


if __name__ == "__main__":
    unittest.main()

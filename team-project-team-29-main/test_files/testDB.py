import unittest
from app import app, db
from app.models import GpxRoutes
import json
import random

pass_count = 0
fail_count = 0

class FlaskTestCase(unittest.TestCase):
    def setUp(self):
        app.config['TESTING'] = True
        app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///:memory:'
        # Create a test client for this instance of the Flask app
        self.app = app.test_client()

        # Create an application context and push it
        self.ctx = app.app_context()
        self.ctx.push()

        db.create_all()

    def tearDown(self):
        # Remove the session and drop all tables
        db.session.remove()
        db.drop_all()

        self.ctx.pop()

    def test_receive_geojson(self):
        global pass_count
        global fail_count

        # Test with valid GeoJSON data
        for _ in range(10):
            # Generate random coordinates each time
            geojson_data = {
                "type": "Feature",
                "properties": {},
                "geometry": {
                    "type": "LineString",
                    "coordinates": [[random.randint(-500,500), random.randint(-500,500)], [random.randint(-500,500), random.randint(-500,500)]]
                }
            }
            speed = 10.5
            distance = 15.6
            time = 2.5

            # Send a POST request with the GeoJSON and its data
            response = self.app.post('/receive_geojson', json={
                'geoJSON': geojson_data,
                'speed': speed,
                'distance': distance,
                'time': time
            })

            # Increment the amount of passes/fails depending on the servers response
            if response.status_code == 200:
                pass_count += 1
            else:
                fail_count += 1

        # Test with invalid GeoJSON data
        for _ in range(10):
            # Have 2 sets of no data
            if _ >= 6 and _ < 8:
                geojson_data = None
            # Have 2 sets of no geometry
            elif _ >= 8 and _ < 10:
                geojson_data = {
                    "type": "Feature",
                    "properties": {},
                }
            else:
                geojson_data = {
                    "type": "Feature",
                    "properties": {},
                    "geometry": {
                        "type": "LineString",
                        "coordinates": [[random.randint(-500,500), random.randint(-500,500)], [random.randint(-500,500), random.randint(-500,500)]]
                    }
                }
            
            # Have 2 sets of no speed
            if _ >= 4 and _ < 6:
                speed = None
            else:
                speed = 10.5 
            # Have 2 sets of no distance
            if _ >= 2 and _ < 4:
                distance = None
            else:
                distance = 15.6
            # Have 2 sets of no time
            if _ < 2:
                time = None
            else:
                time = 2.5

            response = self.app.post('/receive_geojson', json={
                'geoJSON': geojson_data, 
                'speed': speed,
                'distance': distance,
                'time': time
            })

            if response.status_code == 200:
                pass_count += 1
            else:
                fail_count += 1

if __name__ == '__main__':
    # Run the test suite
    test_suite = unittest.TestLoader().loadTestsFromTestCase(FlaskTestCase)
    test_result = unittest.TextTestRunner().run(test_suite)

    flask_test_case = FlaskTestCase()

    # Display the results
    print()
    print("Out of 10 correct inputs and 10 incorrect inputs:")
    print(f"Pass count: {pass_count}/10")
    print(f"Fail count: {fail_count}/10")
    print()



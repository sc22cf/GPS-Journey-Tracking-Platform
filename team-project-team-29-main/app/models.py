from app import db
from flask_login import UserMixin
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.sql import func
from datetime import datetime

class User(db.Model, UserMixin):
    # Model for storing user details
    id = db.Column(db.Integer, primary_key=True)  # Unique identifier for the user
    username = db.Column(db.String(150), unique=True)  # User's username, must be unique
    email = db.Column(db.String(150), unique=True)  # User's email, must be unique
    password = db.Column(db.String(150))  # User's hashed password

    # Relationships
    payment_details = db.relationship("PaymentDetails", backref="user", uselist=False)  # One-to-one relationship with PaymentDetails
    membership = db.relationship("Membership")  # One-to-many relationship with Membership
    followers = db.relationship("Followership", passive_deletes=True)  # One-to-many relationship for followers
    gpxroutes_id = db.relationship("GpxRoutes")  # One-to-many relationship with GpxRoutes

    def is_admin(self):
        return False  # Basic method to check if the user is an admin

class Admin(db.Model, UserMixin):
    # Model for storing admin user details
    id = db.Column(db.Integer, primary_key=True)  # Unique identifier for the admin
    username = db.Column(db.String(150), unique=True)  # Admin's username, must be unique
    password = db.Column(db.String(150))  # Admin's hashed password

    def is_admin(self):
        return True  # Method to confirm the user is an admin

class Membership(db.Model):
    # Model for storing membership details
    id = db.Column(db.Integer, primary_key=True)  # Unique identifier for the membership
    payment_type = db.Column(db.String(150))  # Type of payment (e.g., monthly, yearly)
    payment_date = db.Column(db.DateTime)  # Date when the payment was made
    payment_expiry = db.Column(db.String(10))  # Expiry date of the payment
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)  # Foreign key linking to the User model

class Followership(db.Model):
    # Model for storing follower relationships
    id = db.Column(db.Integer, primary_key=True)  # Unique identifier for the followership record
    follower_id = db.Column(db.Integer)  # ID of the follower
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'))  # ID of the user being followed

class PaymentDetails(db.Model):
    # Model for storing payment details
    id = db.Column(db.Integer, primary_key=True)  # Unique identifier for the payment details
    street_address = db.Column(db.String(150))  # Street address of the user
    city = db.Column(db.String(150))  # City of the user
    postcode = db.Column(db.String(20))  # Postal code of the user
    country = db.Column(db.String(40))  # Country of the user
    stripe_token = db.Column(db.String(255))  # Stripe token used for transactions
    last_4_digits = db.Column(db.String(4))  # Last four digits of the user's credit card
    expiration_date = db.Column(db.String(5))  # Expiration date of the credit card
    user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=True)  # Foreign key linking to the User model

class GpxRoutes(db.Model):
    # Model for storing GPS route data
    id = db.Column(db.Integer, primary_key=True)  # Unique identifier for the route
    geojson = db.Column(db.Text)  # GeoJSON data for the route
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=True)  # Foreign key linking to the User model
    speed = db.Column(db.Float)  # Speed recorded for the route
    distance = db.Column(db.Float)  # Distance covered in the route
    time = db.Column(db.String(25))  # Time taken for the route
    file_name = db.Column(db.String(100))  # File name of the route
    date = db.Column(db.DateTime)  # Date when the route was recorded

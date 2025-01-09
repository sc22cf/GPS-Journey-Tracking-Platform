
from flask_wtf import FlaskForm
from wtforms import PasswordField, StringField, DateField, SelectField ,TextAreaField, FileField, IntegerField
from wtforms.validators import DataRequired, Email, Length, InputRequired
from wtforms import RadioField, widgets
import pycountry

class loginForm(FlaskForm):
    # Form for user login, capturing either email or username and password
    email_or_username = StringField("Email", [DataRequired("Please enter your email address or username.")])
    password = PasswordField("Password", [DataRequired()])

class registerForm(FlaskForm):
    # Form for user registration, requiring username, email, and password with specific validation rules
    username = StringField("Username", validators=[DataRequired(), Length(min=6, max=25)])
    email = StringField("Email", [DataRequired("Please enter your email address."), Email("This field requires a valid email address")])
    password = PasswordField("Password", validators=[DataRequired(), Length(min=8, max=16)])

class CustomRadioField(RadioField):
    # Customized RadioField to use specific widget options for radio buttons
    option_widget = widgets.RadioInput()

class PaymentPlan(FlaskForm):
    # Form for selecting a payment plan, entering address information, and choosing a country from a dynamically generated list
    plan = CustomRadioField('plan', choices=[('Weekly', 'Weekly £1.49'), ('Monthly', 'Monthly £4.99'), ('Yearly', 'Yearly £49.99')], validators=[InputRequired()], default='Weekly')
    street_address = StringField("Street", [DataRequired("Please enter street address")])
    city = StringField("City", [DataRequired("Please enter city")])
    postcode = StringField("Postcode", [DataRequired("Please provide a postcode")])
    countries = [(country.name, country.name) for country in pycountry.countries]  # List of countries generated from pycountry
    countries.sort(key=lambda x: x[1])  # Sorting countries by name
    countries.insert(0, ("United Kingdom", "United Kingdom"))
    countries.insert(1, ("United States", "United States"))
    country = SelectField("Country", choices=countries)  # Dropdown for selecting a country

class ChangeMembershipPlan(FlaskForm):
    # Form for changing membership plans with predefined options
    plan = CustomRadioField('plan', choices=[('Weekly', 'Weekly £1.49'), ('Monthly', 'Monthly £4.99'), ('Yearly', 'Yearly £49.99')], validators=[InputRequired()])

class routeSearch(FlaskForm):
    # Form for searching routes by name
    route = StringField("RouteName")

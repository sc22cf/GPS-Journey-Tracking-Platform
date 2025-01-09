from flask import render_template, flash, request, redirect ,url_for, jsonify, session
from app import app, db
from .forms import loginForm, registerForm, PaymentPlan, ChangeMembershipPlan,routeSearch
from .models import User, Membership, Followership,PaymentDetails, GpxRoutes, Admin
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
from flask_login import login_user, login_required, logout_user, current_user
import uuid
import os
import stripe
from datetime import datetime, timedelta,timezone
# stripe.api_key = "INSERT STRIPE API KEY FOR DEMO"
import json
from sqlalchemy import desc
from collections import Counter
from dateutil.relativedelta import relativedelta

# Landing Page Route
@app.route('/')
def default():
    return render_template("index.html")

# Admin Page Route
@app.route('/admin')
@login_required
def admin():
    # Redirect non-admin users to the home page
    if not current_user.is_admin():
        return redirect(url_for("home"))

    # Retrieve all users, routes, and memberships by payment frequency from the database
    total_users = User.query.all()
    total_routes = GpxRoutes.query.all()
    weekly_members = Membership.query.filter_by(payment_type='Weekly').all()
    monthly_members = Membership.query.filter_by(payment_type='Monthly').all()
    yearly_members = Membership.query.filter_by(payment_type='Yearly').all()
    # Fetch all users for dropdown menu use
    users = User.query.all()

    # Determine each user's membership type and the validity period of their membership
    for user in users:
        paid_user = Membership.query.filter_by(user_id=user.id).first()
        if paid_user:
            paid_datetime = paid_user.payment_date
            type = paid_user.payment_type
            current_datetime = datetime.utcnow()
            # Set the membership type and calculate the expiration based on the payment type
            if paid_datetime:
                if type == "Weekly":
                    valid_until_datetime = paid_datetime + timedelta(days=1)
                elif type == "Monthly":
                    valid_until_datetime = paid_datetime + timedelta(days=30)
                else:
                    valid_until_datetime = paid_datetime + timedelta(days=365)
                user.membership_type = type
            else:
                user.membership_type = "None"
        else:
            user.membership_type = "None"
    # Render the admin page with user and membership data
    return render_template('admin.html', total_users=len(total_users), routes=len(total_routes), weekly=len(weekly_members), monthly=len(monthly_members), yearly=len(yearly_members),
    users=users)

@app.route('/deleteUser')
@login_required 
def deleteUser():
    # Check if the current user has admin privileges
    if current_user.is_admin():
        # Retrieve the user ID from the request arguments
        id = request.args.get('id', '')
        # Fetch the user, their membership plan, and payment details from the database
        user = User.query.filter_by(id=id).first()
        plan = Membership.query.filter_by(user_id=id).first()
        pay = PaymentDetails.query.filter_by(user_id=id).first()

        # Delete the user, their membership plan, and payment details from the database
        db.session.delete(plan)
        db.session.delete(user)
        db.session.delete(pay)
                
        # Commit the changes to the database
        db.session.commit()

        # Calculate and return the updated counts of users, routes, and membership types
        total_users = len(User.query.all())
        total_routes = len(GpxRoutes.query.all())
        weekly_members = len(Membership.query.filter_by(payment_type='Weekly').all())
        monthly_members = len(Membership.query.filter_by(payment_type='Monthly').all())
        yearly_members = len(Membership.query.filter_by(payment_type='Yearly').all())
        return jsonify({"status":"success", "total_users": total_users, "total_routes": total_routes,
                        "weekly_members": weekly_members, "monthly_members": monthly_members, "yearly_members": yearly_members})
    # Return an error status if the current user is not an admin
    return jsonify({"status": "error"}), 400


@app.route('/editUser')
@login_required 
def editUser():
    # Verify if the current user has administrative privileges
    if current_user.is_admin():
        # Retrieve the user ID, new username, and new membership type from the request parameters
        id = request.args.get('id', '')
        username = request.args.get('username', '')
        membership = request.args.get('membership', '')

        # Fetch the corresponding user and their membership plan from the database
        plan = Membership.query.filter_by(user_id=id).first()
        user = User.query.filter_by(id=id).first()

        # Update the user's username and membership plan type
        plan.payment_type = membership
        user.username = username

        # Commit the changes to the database
        db.session.commit()

        # Calculate and return the updated counts of membership types
        weekly_members = len(Membership.query.filter_by(payment_type='Weekly').all())
        monthly_members = len(Membership.query.filter_by(payment_type='Monthly').all())
        yearly_members = len(Membership.query.filter_by(payment_type='Yearly').all())

        return jsonify({
            "status": "success",
            "weekly_members": weekly_members,
            "monthly_members": monthly_members,
            "yearly_members": yearly_members
        })
    # Return an error response if the current user is not an admin
    return jsonify({"status": "error"}), 400

@app.route('/updateGraph')
@login_required 
def updateGraph():
    # Log admin check to console
    if current_user.is_admin():
        # Retrieve date range and number of weeks from request parameters
        start = request.args.get('start', '')
        end = request.args.get('end', '')
        weeks = request.args.get('weeks', '')

        # Convert string dates to datetime objects, setting end date to end of day
        start = datetime.strptime(start, "%d/%m/%Y")
        end = datetime.strptime(end, "%d/%m/%Y")
        end = end.replace(hour=23, minute=59, second=59)

        # Fetch all membership plans
        plans = Membership.query.all()

        rev_per_week = []
        total_rev = 0

        # Initialize weekly revenue list with zeros
        for i in range(int(weeks)):
            rev_per_week.append(0)
        
        payments = []

        # Iterate through each plan to accumulate payments within the specified date range
        for plan in plans:
            date = plan.payment_date
            # Calculate revenue based on membership type and ensure date is within range
            if plan.payment_type == "Weekly":
                while date <= end:
                    if date >= start:
                        payments.append([date, 1.49])
                        total_rev += 1.49
                    date = date + relativedelta(weeks=1)
            elif plan.payment_type == "Monthly":
                while date <= end:
                    if date >= start:
                        payments.append([date, 4.99])
                        total_rev += 4.99
                    date = date + relativedelta(months=1)
            elif plan.payment_type == "Yearly":
                while date <= end:
                    if date >= start:
                        payments.append([date, 49.99])
                        total_rev += 49.99
                    date = date + relativedelta(years=1)
        
        # Allocate revenue to corresponding weeks
        for pay in payments:
            date1 = start
            date2 = start + relativedelta(weeks=1)
            date2 = date2.replace(hour=23, minute=59, second=59)
            week = 0
            while pay[0] <= date1 or pay[0] >= date2:
                date1 = date2
                date1 = date1.replace(hour=0, minute=0, second=0)
                date2 += relativedelta(weeks=1)
                week += 1
            rev_per_week[week] = round(rev_per_week[week]+pay[1],2)

        # Return success with weekly and total revenue data
        return jsonify({"status":"success", "weekly":rev_per_week, "total":round(total_rev,2)})
    # Return error if user is not an admin
    return jsonify({"status":"error"}), 400

@app.route('/home', methods=['GET', 'POST'])
@login_required 
def home():
    # Check if the current user has a membership record
    paid_user = Membership.query.filter_by(user_id=current_user.id).first()
    if not paid_user:
        # Redirect to payment page if no membership found
        return redirect(url_for("payment"))
    paid_datetime = paid_user.payment_date
    type = paid_user.payment_type
    current_datetime = datetime.utcnow()

    # Determine validity of the membership based on type
    if type == "Weekly":
        valid_until_datetime = paid_datetime + relativedelta(weeks=1)
    elif type == "Monthly":
        valid_until_datetime = paid_datetime + relativedelta(months=1)
    else:
        valid_until_datetime = paid_datetime + relativedelta(years=1)

    # Check if the membership has expired
    if current_datetime > valid_until_datetime:
        # Delete expired membership and commit changes to the database
        db.session.delete(paid_user)
        db.session.commit()
        # Redirect to payment page after deleting expired membership
        return redirect(url_for("payment"))

    # Fetch all routes of the current user
    routes = GpxRoutes.query.filter_by(user_id=current_user.id).order_by(desc(GpxRoutes.date)).all()
    # Fetch all followers of the current user
    friends = Followership.query.filter_by(user_id=current_user.id).order_by(desc(Followership.id)).all()

    # Retrieve and analyze user followings for social features
    all_users = User.query.all()
    most_common = []
    for user in all_users:
        if user.id != current_user.id:
            followers = Followership.query.filter_by(follower_id=user.id).all()
            most_common.append([user.id, followers])
    most_common = sorted(most_common, key=lambda x: len(x[1]), reverse=True)

    # Check if current user follows these popular users
    most_followed = []
    for i in range(len(most_common)):
        followed = Followership.query.filter_by(user_id=current_user.id, follower_id=most_common[i][0]).first()
        if followed:
            most_followed.append({'user': User.query.filter_by(id=most_common[i][0]).first(), 'followed': True, 'followers': len(most_common[i][1])})
        else:
            most_followed.append({'user': User.query.filter_by(id=most_common[i][0]).first(), 'followed': False, 'followers': len(most_common[i][1])})

    # Prepare data about friends for the template
    follower_ids = [friend.follower_id for friend in friends]
    friends_usernames = User.query.filter(User.id.in_(follower_ids)).all()
    friends_usernames_ordered = sorted(friends_usernames, key=lambda user: follower_ids.index(user.id))

    # Collect and prepare friend route data for display
    friends_routes = []
    for friend in friends:
        friend_routes = GpxRoutes.query.filter_by(user_id=friend.follower_id).order_by(desc(GpxRoutes.date)).limit(5).all()
        for route in friend_routes:
            friend_username = User.query.filter_by(id=friend.follower_id).first().username
            friends_routes.append({'route': route, 'username': friend_username})

    recent_friend_routes = sorted(friends_routes, key=lambda item: item['route'].date)[:5]

    # Render the home page with user routes and social data
    return render_template("home.html", routes=routes, friends_usernames=friends_usernames_ordered, most_followed=most_followed, recent_friend_routes=recent_friend_routes)

@app.route('/payment', methods=['GET', 'POST']) 
@login_required 
def payment():
    form = PaymentPlan()  # Initialize the payment plan form
    if request.method == "POST":
        # Handle form submission and determine payment plan
        plan = request.json.get('plan')
        # Determine the amount based on the selected plan (in cents)
        if plan == "Weekly":
            amount = 149
        elif plan == "Monthly":
            amount = 499
        else:  # Yearly
            amount = 4999

        # Get the Stripe token from the form
        token = request.json.get('token')

        try:
            # Create a Stripe charge
            charge = stripe.Charge.create(
                amount=amount,
                currency='usd',
                source=token,
                description=f'{plan} subscription charge'
            )

            # Set the membership expiration date based on the chosen plan
            current_datetime = datetime.utcnow()
            if plan == "Weekly":
                expiry_datetime = current_datetime + timedelta(days=7)
            elif plan == "Monthly":
                expiry_datetime = current_datetime + relativedelta(months=1)
            else:
                expiry_datetime = current_datetime + relativedelta(months=12)

            # Format the expiration date
            formatted_date = expiry_datetime.strftime('%d/%m/%y')
            formatted_datetime = formatted_date

            # Extract address and payment details from the request
            street_address = request.json.get('street_address')
            city = request.json.get('city')
            country = request.json.get('country')
            postcode = request.json.get('postcode')
            last_4_digits = request.json.get('last_4_digits')
            expiration_date = request.json.get('expiration_date')

            # Create a new payment record
            new_payment = PaymentDetails(
                street_address=street_address,
                city=city,
                country=country,
                postcode=postcode,
                stripe_token=token,
                last_4_digits=last_4_digits,
                expiration_date=expiration_date,
                user_id=current_user.id
            )

            # Save payment and membership details to the database
            db.session.add(new_payment)
            new_membership = Membership(
                payment_type=plan,
                user_id=current_user.id,
                payment_date=datetime.utcnow(),
                payment_expiry=formatted_datetime
            )
            db.session.add(new_membership)
            db.session.commit()

            # Redirect to the home page on successful payment
            return redirect(url_for('home'))

        except stripe.error.CardError as e:
            # Handle Stripe card errors
            flash(f'Payment error: {str(e)}', category='error')

    # Render the payment form if GET request or payment fails
    return render_template('payment.html', form=form, title='Payment')



@app.route('/change_membership', methods=['GET', 'POST'])
@login_required
def change_membership():
    # Retrieve user, payment, and membership details from the database
    user_details = User.query.filter_by(id=current_user.id).first()
    user_payment_details = PaymentDetails.query.filter_by(user_id=current_user.id).first()
    user_membership_details = Membership.query.filter_by(user_id=current_user.id).first()

    # Calculate the annual cost for weekly payments
    weeklypay = 1.49 * 52

    # Determine current savings based on the payment plan
    if user_membership_details.payment_type == "Weekly":
        yearly = weeklypay
        save = 0
    elif user_membership_details.payment_type == "Monthly":
        yearly = 4.99 * 12
        save = weeklypay - yearly
    else:
        yearly = 49.99
        save = weeklypay - yearly

    form1 = ChangeMembershipPlan()  # Initialize the change membership form

    if request.method == "POST":
        # Check if the form submission is a confirmation of changes
        if request.form.get("submit_button") == "confirm2":
            selected_plan = form1.plan.data
            current_datetime = datetime.utcnow()

            # Calculate the expiry date based on the selected new plan
            if selected_plan == "Weekly":
                expiry_datetime = current_datetime + timedelta(days=7)
            elif selected_plan == "Monthly":
                expiry_datetime = current_datetime + timedelta(days=30)
            else:
                expiry_datetime = current_datetime + timedelta(days=365)

            formatted_date = expiry_datetime.strftime('%d/%m/%y')
            formatted_datetime = formatted_date

            # Update membership details in the database
            user_membership_details.payment_type = selected_plan
            user_membership_details.payment_expiry = formatted_datetime
            db.session.commit()

        else:
            # Handle cancellation of current membership details
            db.session.delete(user_payment_details)
            db.session.delete(user_membership_details)
            db.session.commit()
            return redirect(url_for('payment'))

    else:
        # On a GET request, preset the form with current membership details
        form1.plan.default = user_membership_details.payment_type
        form1.process()

    # Render the change membership page with user and plan details
    return render_template('membership.html', user_details=user_details, user_payment_details=user_payment_details,
                           user_membership_details=user_membership_details, form1=form1, yearly=yearly, save=save)

@app.route('/retrieve_geojson/<gpx_id>', methods=['GET'])
def retrieve_geojson(gpx_id):
    # Query the database for a GPX route by its ID
    gpx_route = GpxRoutes.query.filter_by(id=gpx_id).first()
    # If the route is found, parse its geojson field and return it along with other route details
    if gpx_route:
        return jsonify({
            'geojson': json.loads(gpx_route.geojson),  # Parse the JSON data from the geojson column
            'filename': gpx_route.file_name,
            'distance': gpx_route.distance,
            'speed': gpx_route.speed,
            'time': gpx_route.time,
            'date': gpx_route.date
        })
    else:
        # Return an empty JSON response if no route is found
        return jsonify({})

@app.route('/receive_geojson', methods=['POST'])
def receive_geojson():
    # Retrieve the GeoJSON data and additional attributes from the POST request's JSON body
    geojson_data = request.json.get('geoJSON')  # Contains the GeoJSON data sent from the client
    speed = request.json.get('speed')
    distance = request.json.get('distance')
    time = request.json.get('time')
    file_name = request.json.get('fileName')
    hours = int(time)  # Extract hours from time

    # Calculate the minutes and seconds from the remaining decimal part of time
    remaining_minutes = (time - hours) * 60
    minutes = int(remaining_minutes)
    seconds = int((remaining_minutes - minutes) * 60)

    # Format time for display
    formatted_time = f'{hours}h {minutes}m {seconds}s'

    # Create a new GPX route record with the received data
    new_route = GpxRoutes(
        geojson=json.dumps(geojson_data),  # Store the GeoJSON data as a JSON string
        user_id=current_user.id,  # Associate the route with the current user's ID
        speed=round(speed, 2),  # Round speed to 2 decimal places
        distance=round(distance, 2),  # Round distance to 2 decimal places
        time=formatted_time,  # Store the formatted time
        file_name=file_name,  # Store the file name
        date=datetime.utcnow()  # Record the current date and time
    )

    # Add the new route to the session and commit it to the database
    db.session.add(new_route)
    db.session.commit()

    # Return a success response with details about the new route
    return jsonify({
        "status": "success",
        "message": "GeoJSON data received",
        "id": new_route.id,
        "time": formatted_time,
        "speed": round(speed, 2),
        "distance": round(distance, 2),
        "fileName": file_name
    }), 200

@app.route('/delete_route/<int:id>', methods=["GET"])
def delete_route(id):
    # Query the database to find the route by ID and ensure it belongs to the current user
    route = GpxRoutes.query.filter_by(id=id, user_id=current_user.id).first()

    # If the route exists and belongs to the current user, delete it from the database
    if route:
        db.session.delete(route)
        db.session.commit()
        # Return a success status in JSON format
        return jsonify({"status": "success"}), 200
    else:
        # If no such route exists (either it does not exist or does not belong to the current user)
        return jsonify({"status": "error", "message": "Route not found or access denied"}), 404

@app.route('/dateSearch')
def dateSearch():
    # Retrieve the date parameter from the URL query string
    date1 = request.args.get('date', '')

    if date1:
        # Parse the date string into a datetime object assuming the format 'YYYY-MM-DD'
        input_date = datetime.strptime(date1, "%Y-%m-%d").date()
        # Set the search range to cover the whole specified date
        start_of_day = datetime.combine(input_date, datetime.min.time())
        end_of_day = datetime.combine(input_date, datetime.max.time())

        # Query the database for routes that match the current user and the specified date range
        routes = GpxRoutes.query.filter(
            GpxRoutes.user_id == current_user.id,
            GpxRoutes.date >= start_of_day,
            GpxRoutes.date <= end_of_day
        ).order_by(desc(GpxRoutes.date)).all()

        # Create a list of dictionaries for each route containing relevant details
        if routes:
            result = [{'id': route.id, 'distance': route.distance, 'speed': route.speed, 'time': route.time, 'fileName': route.file_name} for route in routes]
        else:
            result = []
    else:
        # If no date is specified, retrieve all routes for the current user ordered by date
        routes = GpxRoutes.query.filter_by(user_id=current_user.id).order_by(desc(GpxRoutes.date)).all()
        result = [{'id': route.id, 'distance': route.distance, 'speed': route.speed, 'time': route.time, 'fileName': route.file_name} for route in routes]

    # Return the results in JSON format
    return jsonify({"results": result})

@app.route('/displayRecentRoutes')
def displayRecentRoutes():
    # Query the database for all followers of the current user, ordered by the latest first
    friends = Followership.query.filter_by(user_id=current_user.id).order_by(desc(Followership.id)).all()
    friends_routes = []

    # Iterate over each friend to fetch up to 5 of their most recent routes
    for friend in friends:
        friend_routes = GpxRoutes.query.filter_by(user_id=friend.follower_id).order_by(desc(GpxRoutes.date)).limit(5).all()
        for route in friend_routes:
            # Fetch the username of the friend for display purposes
            friend_username = User.query.filter_by(id=friend.follower_id).first().username
            # Append each route along with the associated username to the friends_routes list
            friends_routes.append({
                'route': {
                    'id': route.id,
                    'date': route.date.isoformat(),  # Convert datetime to ISO format for JSON serialization
                },
                'username': friend_username
            })

    # Sort all gathered routes by date, then pick the top 5 to showcase the most recent activity
    recent_friend_routes = sorted(friends_routes, key=lambda item: item['route']['date'], reverse=True)[:5]
    result = [{'id': route['route']['id']} for route in recent_friend_routes]

    # Return the result as a JSON response, listing the route IDs of the 5 most recent routes from friends
    return jsonify({"results": result})


@app.route('/routeSearch')
def routeSearch():
    # Extract the search text from query parameters and process it for case-insensitivity and whitespace trimming
    route_name = request.args.get('searchText', '').strip().lower()

    if route_name:
        # If a route name is provided, search the GpxRoutes table for entries matching the search criteria
        routes = GpxRoutes.query.filter_by(user_id=current_user.id).filter(GpxRoutes.file_name.ilike(f"%{route_name}%")).order_by(desc(GpxRoutes.date)).all()
        # Format the result into a list of dictionaries if routes are found
        if routes:
            result = [{'id': route.id, 'distance': route.distance, 'speed': route.speed, 'time': route.time, 'fileName': route.file_name} for route in routes]
        else:
            result = []
    else:
        # If no route name is provided, return all routes for the current user, sorted by date
        routes = GpxRoutes.query.filter_by(user_id=current_user.id).order_by(desc(GpxRoutes.date)).all()
        result = [{'id': route.id, 'distance': route.distance, 'speed': route.speed, 'time': route.time, 'fileName': route.file_name} for route in routes]

    # Return the search results as JSON
    return jsonify({"results": result})

@app.route('/friendSearch')
def friendSearch():
    # Retrieve the search text from the query parameters, ensuring it is lowercased and stripped of leading/trailing spaces
    text = request.args.get('searchText', '').strip().lower()

    if text:
        # Perform a case-insensitive search for users whose usernames contain the search text
        users = User.query.filter(User.username.ilike(f"%{text}%")).all()
        result = []

        # Iterate over each found user to check if the current user is following them
        for user in users:
            followed = Followership.query.filter_by(user_id=current_user.id, follower_id=user.id).first()
            # If the current user is following the user, add their details to the result list
            if followed:
                result.append({'username': user.username, 'id': user.id})
    else:
        # If no search text is provided, the result is empty as there's no basis for a search
        result = []

    # Return the search results as a JSON response
    return jsonify({"results": result})

@app.route('/displayFriendRoutes')
def displayFriendRoutes():
    # Retrieve the user ID from the request's query parameters
    user_id = request.args.get('userId', '')

    # Fetch the username associated with the provided user ID
    user = User.query.filter_by(id=user_id).first()
    if user:
        username = user.username

        # Fetch the top five most recent routes for the specified user, ordered by date
        routes = GpxRoutes.query.filter_by(user_id=user_id).order_by(desc(GpxRoutes.date)).limit(5).all()

        # If routes are found, format each route's details into a dictionary
        if routes:
            result = [{'username': username, 'id': route.id, 'distance': route.distance, 'speed': route.speed, 'time': route.time, 'fileName': route.file_name} for route in routes]
        else:
            result = []
    else:
        # If no user or routes are found, return an empty list
        result = []

    # Return the formatted route details as a JSON response
    return jsonify({"results": result})

@app.route('/userSearch')
def userSearch():
    # Get the search text from the query parameters, strip whitespace, and convert to lowercase
    text = request.args.get('searchText', '').strip().lower()

    if text:
        # Search the User table for usernames that include the search text, ignoring case
        users = User.query.filter(User.username.ilike(f"%{text}%")).all()
        result = []

        # Iterate over the list of users to prepare the response
        for user in users:
            if user.id != current_user.id:  # Exclude the current user from the results
                # Check if the current user is following the other user
                followed = Followership.query.filter_by(user_id=current_user.id, follower_id=user.id).first()
                
                if followed:
                    result.append({'username': user.username, 'id': user.id, 'followed': True})
                else:
                    result.append({'username': user.username, 'id': user.id, 'followed': False})

        # Limit the results to the first 5 users found
        result = result[:5]
    else:
        # Return an empty list if no search text is provided
        result = []

    # Return the search results as a JSON object
    return jsonify({"results": result})


@app.route('/follow_user', methods=['POST'])
def follow_user():
    # Retrieve the user ID of the user to be followed from the form data
    user_id = request.form.get('userId')

    if user_id:
        # Check if the current user already follows the specified user
        check_follow = Followership.query.filter_by(user_id=current_user.id, follower_id=user_id).first()
        if not check_follow:
            # If not already following, create a new follow relationship
            new_follower = Followership(user_id=current_user.id, follower_id=user_id)
            follower_username = User.query.filter_by(id=user_id).first().username  # Fetch the username of the new follow

            # Add the new follower to the database and commit the transaction
            db.session.add(new_follower)
            db.session.commit()

            # Return a success status with the username of the newly followed user
            return jsonify({"status": "success", "username": follower_username})
        else:
            # If already following, return an error message
            return jsonify({"status": "error", "message": "User already followed"})
    else:
        # If no user ID is provided, return an error message indicating the missing user ID
        return jsonify({"status": "error", "message": "User ID is missing"}), 400

@app.route('/unfollow_user', methods=['POST'])
def unfollow_user():
    # Retrieve the user ID of the user to unfollow from the form data
    user_id = request.form.get('userId')

    if user_id:
        # Find the follower relationship in the database
        friend = Followership.query.filter_by(user_id=current_user.id, follower_id=user_id).first()
        # Fetch the last five routes shared by the user to be unfollowed
        friend_routes = GpxRoutes.query.filter_by(user_id=user_id).order_by(desc(GpxRoutes.date)).limit(5).all()
        friend_route_ids = []

        # Collect the IDs of the last few routes shared by the unfollowed user
        if friend_routes:
            for friend_route in friend_routes:
                friend_route_ids.append({'id': friend_route.id})
        
        # If a follower relationship exists, delete it from the database
        if friend:
            db.session.delete(friend)
            db.session.commit()
            # Return a success status and the IDs of the last few routes from the unfollowed user
            return jsonify({"status": "success", "results": friend_route_ids})
        else:
            # If the relationship does not exist or an error occurred, notify the client
            return jsonify({"status": "error", "message": "No such follow relationship exists"}), 404
    else:
        # Return an error if no user ID is provided
        return jsonify({"status": "error", "message": "User ID is missing"}), 400


@app.route('/login', methods=['GET', 'POST'])
def login():
    form = loginForm()  # Instantiate the login form

    if request.method == "POST":
        if form.validate_on_submit():  # Validate form inputs based on form definitions
            username_or_email = form.email_or_username.data
            password = form.password.data

            with app.app_context():
                # Query database for user by email or username
                user_email = User.query.filter_by(email=username_or_email).first()
                user_username = User.query.filter_by(username=username_or_email).first()
                admin = Admin.query.filter_by(username=username_or_email).first()

                # Check if admin credentials are correct
                if admin:
                    if check_password_hash(admin.password, password):
                        if admin.is_admin():  # Verify admin status
                            login_user(admin, remember=True)
                            return redirect("/admin")
                    else:
                        flash("Email,Username or Password Incorrect", category='error')

                # Check if user credentials are correct for email
                elif user_email:
                    if check_password_hash(user_email.password, password):
                        login_user(user_email, remember=True)
                        return redirect("/home")
                    else:
                        flash("Email,Username or Password Incorrect", category='error')

                # Check if user credentials are correct for username
                elif user_username:
                    if check_password_hash(user_username.password, password):
                        login_user(user_username, remember=True)
                        return redirect("/home")
                    else:
                        flash("Email,Username or Password Incorrect", category='error')

                else:
                    flash("Email,Username or Password Incorrect", category='error')
        else:
            flash("Email,Username or Password Incorrect", category='error') 

        return render_template("login.html", form=form)

    if request.method == "GET":
        return render_template("login.html", form=form)

@app.route('/register', methods=['GET', 'POST'])
def register():
    db.create_all()  # Ensures that the database tables are created

    form = registerForm()  # Instantiate the registration form

    if request.method == "POST":  # Check if the current request is a POST request
        if form.validate_on_submit():  # Validates the form data
            username = form.username.data
            email = form.email.data
            password = form.password.data

            # Check if the provided email or username already exists in the database
            user_email_exists = User.query.filter_by(email=email).first()
            username_exists = User.query.filter_by(username=username).first()

            if user_email_exists:
                flash("Email has already been used!", category='error')  # Inform user that the email is already used
                return render_template("register.html", form=form)

            elif username_exists:
                flash("Username already exists!", category='error')  # Inform user that the username is already taken
                return render_template("register.html", form=form)

            else:
                with app.app_context():
                    # Create a new user with the hashed password
                    new_user = User(
                        username=username,
                        email=email,
                        password=generate_password_hash(password, method='pbkdf2:sha256')
                    )
                    db.session.add(new_user)  # Add the new user to the database session
                    db.session.commit()  # Commit the session to save the user to the database
                    login_user(new_user, remember=True)  # Log in the new user automatically

                    return redirect(url_for("payment"))  # Redirect to the payment page or a welcome page

        else:
            flash("Error, details entered incorrectly", category='error')  # General error flash message for invalid form entries

    # Render the registration form template on GET request
    return render_template("register.html", form=form)


@app.route('/logout')
@login_required 
def logout():
    logout_user()
    return redirect('/login')


[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-24ddc0f5d75046c5622901739e7c5dd533143b0c8e959d652212380cedb1ea36.svg)](https://classroom.github.com/a/Nrqv5LcV)
[![Open in Visual Studio Code](https://classroom.github.com/assets/open-in-vscode-718a45dd9cf7e7f842a935f5ebbe5719a5e09af4491e668f4dbf3b35d5cca122.svg)](https://classroom.github.com/online_ide?assignment_repo_id=13753492&assignment_repo_type=AssignmentRepo)

# COMP2913 Software Engineering Project

### Created By:
Will Hodges - sc22wh@leeds.ac.uk  
Joseph Gibson - sc22jg@leeds.ac.uk  
Casey Farrell - sc22cf@leeds.ac.uk  
Haley Rich - fy21hr@leeds.ac.uk  
Ellis Stonehouse - sc22es@leeds.ac.uk  
Josh Deane - sc22j2d@leeds.ac.uk  

---

# Trackr

**Trackr** is an app that allows you to record and view your hikes, runs, or cycles on an easy-to-use map interface. The app features an account system that enables members to securely store their data and review it in later sessions. Additionally, the accounts include a follower system, allowing users to follow friends and view their routes. The app also integrates a billing system using the Stripe library, which offers users a selection of membership options for accessing the program. Users upload each route as a .GPX file, enabling them to import their recorded outdoor activities from GPS devices or other apps directly into **Trackr**. Once uploaded, the app displays these routes on the map interface, which utilizes the OpenStreetMap API.

The app is developed using Python and the Flask framework, with some features written using JavaScript and Ajax. It also utilizes SQLAlchemy for database interactions.

## Installation:
To start using **Trackr**, please visit our website: **[Trackr Official Website](https://trackrsite.pythonanywhere.com/)**

Follow these simple steps to get started:
* **Create an Account:** Register on our site using the 'Register' link on the landing page. You will need to set up your membership plan during the registration process.
* **Upload Your Routes:** After logging in, navigate to 'Create New Route' to upload your .GPX files and view them on our map interface. (Please use the GPX files provided in test_files)
* **Explore:** Utilize the features like viewing routes, managing followers, and adjusting your membership plan as described in our website traversal diagram.

## Website Traversal Diagram:

```
.
└── Landing Page              
    ├── Register
    │   └── Setup Membership Plan
    ├── Login
    │   └── Home Page
    │       ├── Create New Route
    │       ├── View Routes
    │       │   ├── Download
    │       │   ├── Delete
    │       │   └── Toggle View
    │       ├── Friends Routes
    │       │   └── Toggle View
    │       ├── Following
    │       │   ├── View User's Routes
    │       │   └── Unfollow
    │       ├── Top Followed
    │       │   ├── Follow
    │       │   └── Unfollow
    │       │
    │       ├── Membership
    │       │   └── Change Membership Plan
    │       │
    └<──────┴── Logout
```
#### The Application has been edited to be viewed on an array different screen dimensions, it can comfortably be viewed on:   
- 360 x 640 pixels - *Most common smartphone screen size*  
- 768 x 1024 pixels - *Standard tablets*  
- 1366 x 768 pixels - *Common laptop screen size*  
- 1920 x 1080 pixels - *Standard desktop monitors*  

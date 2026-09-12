# Zero Waste Victoria Circular Hub

FIT5032 A1.3 – Business Requirements Implementation

## Overview

Zero Waste Victoria Circular Hub is a responsive Vue 3 web application designed to help users find suitable recycling and reuse options across Melbourne.

The application supports waste reduction and circular economy behaviours by allowing users to search for recycling locations by material and postcode, create user accounts, securely log in, rate recycling locations, and access role-specific functionality.

The current version extends the previous application with authentication, role-based access control, community ratings and additional security measures.

## Implemented Features

- Responsive Vue 3 user interface
- Recycling Finder with material and postcode input
- Client-side form validation
- Quick material category selection
- Dynamic recycling search results
- Postcode-prioritised search results
- Reusable recycling location cards
- Recent Searches stored using Local Storage
- User registration and login
- Multiple user accounts
- User and administrator roles
- Protected account and administrator routes
- User logout
- User account information page
- Administrator dashboard
- Community 1–5 star rating system
- Aggregated rating averages and rating counts
- Existing ratings can be updated without duplicate entries
- Password hashing using PBKDF2 and per-user random salts
- Input validation for user-generated content
- Protection against common XSS-style input
- Role verification to reduce client-side session role tampering
- Responsive navigation and mobile layout
- Vue Router navigation between pages

## Business Requirements

### BR C.1 – Authentication

The application implements a client-side authentication system that supports multiple registered users.

Users can:

- Create a new account
- Log in using their email and password
- Remain authenticated while navigating the application
- Access their account page
- Log out securely

Registered account information is stored in Local Storage for this client-side assignment implementation.

Passwords are not stored in plaintext.

### BR C.2 – Role-Based Authentication

The application supports two roles:

- `user`
- `admin`

Normal users can access their own account page but cannot access the administrator dashboard.

Administrators can access the protected `/admin` route and view registered account information.

Vue Router navigation guards are used to protect authenticated and administrator-only routes.

The application also verifies the current user's role against the registered user data rather than trusting only the role stored in the current session.

### BR C.3 – Community Rating

Authenticated users can rate recycling locations using a 1–5 star rating system.

The rating system:

- Stores ratings in Local Storage
- Associates ratings with both a user and recycling location
- Allows one rating per user for each location
- Allows users to update an existing rating
- Calculates the aggregated community rating
- Displays the average rating
- Displays the total number of ratings
- Allows guests to view ratings while requiring login to submit a rating

For example, if two users give a location ratings of 4 and 5, the displayed community rating is 4.5 / 5 with two ratings.

### BR C.4 – Security

Several client-side security measures have been implemented.

#### Password Protection

Passwords are processed using the browser Web Crypto API with:

- PBKDF2
- SHA-256
- 100,000 iterations
- A unique random salt for each account

Only `passwordHash` and `passwordSalt` are stored. Plaintext passwords are not stored in Local Storage.

#### Input Validation

Usernames are validated using a restricted character set.

Recycling search inputs are also validated to restrict unexpected or potentially unsafe characters before they are added to search history or URL query parameters.

Postcodes must:

- Contain exactly four digits
- Be within the current supported range of 3000–3999

#### XSS Protection

User-controlled content is rendered using Vue interpolation rather than raw HTML.

This means HTML-like input is displayed as text rather than executed as markup or JavaScript.

#### Role Protection

The current session is used primarily to identify the logged-in user.

The user's actual role is re-checked against the registered user record before protected functionality is authorised.

This reduces the ability for a normal user to gain administrator access by changing only the role stored in the current session.

> Note: This assignment uses a client-side Local Storage authentication model. In a production system, authentication, password storage and role authorisation should be managed by a trusted backend service.

## Demo Accounts

### Administrator

Email:

```text
admin@zwv.com
# Zero Waste Victoria Circular Hub

FIT5032 A1.2 – Basic Application Development Version 1

## Overview

Zero Waste Victoria Circular Hub is a responsive web application designed to help users find suitable recycling and reuse options across Melbourne.

The application supports waste reduction and circular economy behaviours by allowing users to search for recycling options by material and postcode, view dynamically generated recycling locations, and reuse previous searches stored in the browser.

## Implemented Features

- Responsive Vue 3 user interface
- Recycling Finder with material and postcode input
- Client-side form validation
- Quick material category selection
- Dynamic recycling search results
- Postcode-prioritised search results
- Reusable recycling location cards
- Recent Searches stored using Local Storage
- Responsive navigation and mobile layout
- Vue Router navigation between pages

## Business Requirements

### BR A.1 – Development Stack and Coding

The application is developed using Vue 3 with the Composition API and is structured using reusable components, views, routing and JavaScript data modules.

### BR A.2 – Responsiveness

Bootstrap 5 responsive utilities and grid layouts are used to support desktop, tablet and mobile screen sizes.

### BR B.1 – Validations

The Recycling Finder includes multiple client-side validations:

- A recycling item or category is required
- Postcodes must contain exactly four digits
- Postcodes must be within the current service area (3000–3999)

Validation feedback is displayed directly below the relevant input field.

### BR B.2 – Dynamic Data and Data Structures

Recycling locations are stored in JavaScript data structures and dynamically filtered according to the user's selected material.

Matching postcodes are prioritised in the results, and location information is displayed using reusable Vue components.

Recent searches are also stored in Local Storage so they remain available after the page is refreshed.

## Technology Stack

- Vue 3
- Composition API
- Vue Router
- Bootstrap 5
- JavaScript
- HTML
- CSS
- Local Storage
- Vite

## Project Structure

```text
src/
├── components/
│   ├── AppFooter.vue
│   ├── AppNavbar.vue
│   └── RecyclingCard.vue
├── data/
│   └── recyclingLocations.js
├── router/
│   └── index.js
├── views/
│   ├── HomeView.vue
│   ├── RecyclingFinderView.vue
│   └── SearchResultsView.vue
├── App.vue
└── main.js
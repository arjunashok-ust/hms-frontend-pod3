# HMS - Frontend

This is the frontend client for the Hospital Management System (HMS), a comprehensive web application designed to streamline hospital operations. Built with Angular, this Single Page Application (SPA) provides a responsive, secure, and user-friendly interface for all hospital staff and administrators.

## Table of Contents

1.  [About The Project](#about-the-project)
    - [Key Features](#key-features)
    - [Built With](#built-with)
2.  [Getting Started](#getting-started)
    - [Prerequisites](#prerequisites)
    - [Installation & Setup](#installation--setup)
3.  [Frontend Architecture](#frontend-architecture)
4.  [Request & Data Flow](#request--data-flow)
5.  [Project Maintainers](#project-maintainers)

## About The Project

This project serves as the user-facing part of the HMS ecosystem. It communicates with a separate backend service to handle data persistence and business logic, focusing entirely on delivering a rich user experience.

### Key Features

- **Role-Based UI:** Dynamically renders navigation and UI elements based on user roles and permissions.
- **Secure Authentication:** JWT-based login flow with automatic token refresh and secure route guards.
- **Dashboard:** An administrative overview of key system statistics.
- **Appointment Management:** A complete interface for booking, viewing, and managing patient appointments.
- **Employee & Patient Directories:** Full CRUD functionality for managing staff and patient records.
- **Medical Records (Encounters):** A feature-rich module for creating and managing clinical encounter notes.
- **Dynamic Access Control:** Granular control over UI elements and routes using custom directives and guards.
- **Administrative Panels:** Dedicated interfaces for managing departments, user roles, and application navigation.

### Built With

- **Angular:** The core framework for building the application.
- **TypeScript:** For type-safe and scalable code.
- **RxJS:** For managing asynchronous operations and data streams.
- **Bootstrap Icons:** For a clean and consistent set of UI icons.
- **ngx-toastr:** For user-friendly, non-intrusive notifications.

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- **Node.js & npm:** Download & Install Node.js
- **Angular CLI:** Install globally via `npm install -g @angular/cli`
- **Backend Server:** The `HMS-BACKEND` service must be running and accessible.

### Installation & Setup

1.  **Navigate to the frontend directory:**

    ```sh
    cd HMS-FRONTEND
    ```

2.  **Install NPM packages:**

    ```sh
    npm install
    ```

3.  **Configure Environment:**
    Open `src/environments/environment.ts` and ensure the `apiUrl` points to your running backend server.

    ```typescript
    export const environment = {
      production: false,
      apiUrl: 'http://localhost:5000', // Your backend URL
      pageSize: 5,
    };
    ```

4.  **Run the Development Server:**
    ```sh
    ng serve
    ```
    Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

## Frontend Architecture

The frontend is built on a modern, modular architecture to ensure scalability and maintainability.

- **`components`**: The core UI building blocks. Each major feature (e.g., `appointment`, `employee`) is encapsulated in its own component, often composed of smaller, reusable child components.
- **`services`**: Centralize data access and business logic. Services like `ApiService` and `AuthService` encapsulate all HTTP communication with the backend, making components cleaner and more focused on presentation.
- **`guards`**: Protect routes from unauthorized access. `authGuard` ensures a user is logged in, while `roleGuard` checks for specific permissions required to access a route.
- **`interceptors`**: Intercept outgoing HTTP requests and incoming responses. `authInterceptor` automatically attaches JWT tokens and handles token refresh logic, while `errorInterceptor` provides global error logging.
- **`directives`**: Custom structural directives like `hasPermission` allow for declarative control over the UI, showing or hiding elements based on the user's permissions.
- **`utils`**: A collection of pure helper functions for tasks like date validation and time slot calculations.

## Request & Data Flow

A typical authenticated API request follows this pipeline:

1.  **User Interaction**: A user clicks a button in an Angular **Component** (e.g., `AppointmentComponent`).
2.  **Service Call**: The component calls a method in a dedicated **Service** (e.g., `AppointmentService.getStats()`).
3.  **HTTP Client**: The service uses Angular's `HttpClient` to create an HTTP request.
4.  **Interceptors**: The request is automatically intercepted by:
    - `authInterceptor`: Attaches the `Authorization: Bearer <token>` header from local storage.
    - `errorInterceptor`: Prepares to catch any response errors.
5.  **Backend Communication**: The request is sent to the backend API.
6.  **Response Handling**:
    - **On Success**: The response flows back through the interceptors to the service, which returns it as an `Observable` to the component.
    - **On `401 Unauthorized` Error**: The `authInterceptor` catches the error, attempts to get a new access token using the refresh token, and automatically retries the original request with the new token. If refreshing fails, the user is logged out.
    - **On Other Errors**: The `errorInterceptor` logs the error, and it is propagated to the service's error handling block, where a user-facing notification is typically triggered.

## Project Maintainers

This project is currently maintained by:

- **[Your Name/Team Name]** - _Project Lead_

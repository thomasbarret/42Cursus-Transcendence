# Transcendance

**Transcendance** is a full-stack web application project developed as part of the 42 school curriculum. This project is designed to simulate a real-world web application with user authentication, game mechanics, and interactive communication. It leverages modern technologies such as Django, WebSocket, Redis, and Docker to provide a scalable and performant experience.

The project includes both a **frontend** and **backend** with a dedicated **game system**, **user management**, and **real-time features**. The app is built to provide a smooth gaming experience where users can sign up, play games, send messages, and interact with each other.

## Features

- **User Authentication**: Users can sign up, log in, and manage their profiles.
- **Real-time WebSocket Communication**: Chat with friends, join games, and manage tournaments in real-time.
- **Game System**: Play a Pong-style game with a leaderboard and competitive matchmaking.
- **Responsive Design**: A fully responsive interface, compatible with desktop and mobile devices.
- **Tournaments**: Organize and participate in tournaments with automatic scheduling and matchmaking.
- **Database**: All user data and game progress are stored in an SQLite database.
- **Redis**: Used to manage real-time game data and messaging.

## Tech Stack

- **Backend**: Django (Python)
  - Authentication
  - WebSocket support for real-time communication
  - Redis for caching and message management
- **Frontend**: HTML, CSS, JavaScript (Vanilla JS and custom libraries)
  - Dynamic game environment
  - User dashboard and profile management
  - Real-time game updates using WebSockets
- **Database**: SQLite
- **Game System**: Pong-style game with player-to-player interaction.
- **Docker**: For containerization of both frontend and backend services.

## Project Structure

```
Transcendance/
├── docker-compose.yml
├── readme.md
├── run.sh
└── srcs
    ├── backend
    │   ├── Dockerfile
    │   ├── authentication
    │   ├── chat
    │   ├── game
    │   ├── manage.py
    │   ├── requirements.txt
    │   ├── tournament
    │   ├── transcendence
    │   ├── user
    │   └── websocket
    ├── frontend
    │   ├── Dockerfile
    │   ├── nginx.conf
    │   └── srcs
    │       ├── index.html
    │       ├── js/
    │       └── pages/
    ├── pong_cli
    └── services
        └── redis
            └── dump.rdb
```

### Backend
- The backend is implemented in **Django** and contains multiple modules for user authentication, chat, game logic, and more.
- The `websocket` module handles real-time communication.
- The `tournament` module manages tournament scheduling and matchmaking.

### Frontend
- The frontend is a single-page application using HTML, CSS, and JavaScript.
- The **game** module within JavaScript handles the Pong-style game logic.
- The frontend also includes a variety of pages (e.g., login, dashboard, tournament, etc.) and uses WebSockets to update in real-time.

### Docker
- Docker is used to containerize both frontend and backend services for easy deployment.
- The `docker-compose.yml` file orchestrates the services.

## Getting Started

### Prerequisites

- Install [Docker](https://www.docker.com/products/docker-desktop).
- Install [docker-compose](https://docs.docker.com/compose/).

### Running the Application

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/transcendance.git
   ```

2. Navigate to the project directory:
   ```bash
   cd 42Cursus-Transcendence
   ```

3. Build and start the Docker containers:
   ```bash
   docker-compose up --build
   ```

4. Access the application in your browser:
   - Frontend: `http://localhost`
   - Backend and API are accessible through the Docker containers.

5. To run the application manually, use the `run.sh` script:
   ```bash
   ./run.sh
   ```

### Testing

The project includes unit tests for the backend and frontend logic. To run the tests:

1. For the backend (Django tests):
   ```bash
   docker-compose exec backend python manage.py test
   ```

2. For frontend testing, use your preferred JavaScript testing framework.

### Stopping the Application

To stop the application, run:
```bash
docker-compose down
```
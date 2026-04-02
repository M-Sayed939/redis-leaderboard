# Real-Time Leaderboard API 

A high-performance backend service for managing real-time game leaderboards. Built with Node.js, Express, and Redis Sorted Sets to ensure incredibly fast score insertions and ranking queries.

##  Features

* **User Authentication:** Secure registration and login using JSON Web Tokens (JWT).
* **Real-Time Rankings:** Powered by Redis in-memory storage for lightning-fast leaderboard updates.
* **Score Submission:** Submit scores globally or for specific games and time periods.
* **Player Rankings:** Instantly fetch a specific user's rank among thousands of players.
* **Top Player Reports:** Generate leaderboards for specific games or daily competitions.

##  Tech Stack

* **Runtime:** [Node.js](https://nodejs.org/)
* **Framework:** [Express.js](https://expressjs.com/)
* **Database:** [Redis](https://redis.io/) (via [Upstash](https://upstash.com/))
* **Authentication:** `jsonwebtoken` (JWT)

##  Prerequisites

* Node.js (v14 or higher)
* A free Redis database from [Upstash](https://upstash.com/) (or a local Redis instance).

##  Installation & Setup

**1. Initialize the project and install dependencies:**
```bash
npm init -y
npm install express redis jsonwebtoken dotenv
```

**2. Configure your Database:**
Open `server.js` and locate the `redisClient` configuration block. Replace the URL with your Upstash `rediss://` connection string.

```javascript
const redisClient = createClient({
    url: 'rediss://default:YOUR_PASSWORD@your-upstash-url.upstash.io:6379',
    socket: {
        tls: true,
        rejectUnauthorized: false // Bypasses strict local cert checks for cloud testing
    }
});
```

**3. Start the Server:**
```bash
node server.js
```
*The server will run on `http://localhost:3000`.*

##  API Endpoints

### Authentication
* **`POST /auth/register`**
  * **Body:** `{ "username": "player1", "password": "password123" }`
  * **Description:** Creates a new user.
* **`POST /auth/login`**
  * **Body:** `{ "username": "player1", "password": "password123" }`
  * **Description:** Authenticates the user and returns a JWT token.

### Leaderboard Operations
*(Endpoints marked with 🔒 require an `Authorization: Bearer <token>` header)*

* **`POST /scores`** 🔒
  * **Body:** `{ "score": 5000, "gameId": "pacman" }`
  * **Description:** Submits a score for the logged-in user to the global and game-specific leaderboards.
* **`GET /leaderboard?limit=10`**
  * **Description:** Returns the top 10 players on the global leaderboard.
* **`GET /leaderboard/rank`** 🔒
  * **Description:** Returns the exact rank and high score of the currently logged-in user.
* **`GET /reports/:period?limit=5`**
  * **Description:** Returns the top players for a specific game or time period (e.g., `/reports/pacman` or `/reports/daily:2023-10-24`).

##  Redis Commands Used Under the Hood

* `ZADD`: Upserts users and their scores into the Sorted Set.
* `ZREVRANGE`: Fetches the highest scores first (using `REV: true`).
* `ZREVRANK`: Finds a user's exact 0-based index rank without scanning the database.
* `ZSCORE`: Retrieves a specific user's raw score.

##  Future Improvements

* Swap the mock, in-memory user array with a persistent SQL/NoSQL database (e.g., PostgreSQL, MongoDB).
* Move the JWT Secret and Redis URL into a `.env` file for better security.
* Implement a tie-breaker mechanism (e.g., sorting by timestamp if scores are identical).

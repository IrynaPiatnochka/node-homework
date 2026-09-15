# Task List API

The project includes a Node.js/Express backend with PostgreSQL, Prisma, JWT authentication, Google OAuth, reCAPTCHA, security middleware, and analytics.

The backend is connected to a provided React frontend for local development.

## Features

- User registration and login
- JWT authentication using HTTP-only cookies
- CSRF protection
- Google OAuth login
- reCAPTCHA protection during registration
- Create, read, update, and delete tasks
- Bulk task creation
- Task pagination
- Task analytics
- PostgreSQL database with Prisma ORM
- Input validation
- Security middleware
- Rate limiting
- Automated tests

## Technologies

### Backend

- Node.js
- Express
- PostgreSQL
- Prisma
- JWT
- Google OAuth
- Joi
- Jest
- Helmet
- express-xss-sanitizer

### Frontend

- React
- Vite
- @react-oauth/google

The frontend was provided as part of the course and runs locally.

## Getting Started

### Install Dependencies

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root and add the required environment variables:

```env
DB_URL=
DATABASE_URL=
TEST_DATABASE_URL=
JWT_SECRET=
RECAPTCHA_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

**Important:** Do not commit the `.env` file or any secret credentials to GitHub.

### Database

Run Prisma migrations:

```bash
npx prisma migrate deploy
```

### Start the Backend

```bash
npm start
```

The API runs locally at:

`http://localhost:3000`

## API Routes

### Users

- `POST /api/users/register` — Register a new user
- `POST /api/users/logon` — Log in with email and password
- `POST /api/users/logoff` — Log out
- `POST /api/users/googleLogon` — Log in with Google

### Tasks

- `POST /api/tasks` — Create a task
- `GET /api/tasks` — Get tasks
- `POST /api/tasks/bulk` — Create multiple tasks
- `GET /api/tasks/:id` — Get a task
- `PATCH /api/tasks/:id` — Update a task
- `DELETE /api/tasks/:id` — Delete a task

### Analytics

- `GET /api/analytics/users` — Get analytics for all users
- `GET /api/analytics/users/:id` — Get analytics for a specific user

### Health Check

- `GET /health` — Check if the server is running

## Authentication

The application uses JWT authentication stored in an HTTP-only cookie.

Protected requests use a CSRF token for additional security.

Google authentication uses the authorization-code flow. The React frontend receives an authorization code from Google and sends it to the Node.js backend, where the code is exchanged for Google tokens.

## Security

The backend includes several security features:

- Helmet security headers
- XSS protection
- Rate limiting
- JWT authentication
- HTTP-only cookies
- CSRF protection
- reCAPTCHA during registration
- Input validation with Joi

## Testing

Run the test suite with:

```bash
npm test
```

## Deployment

The backend is deployed on Render.

The PostgreSQL database is hosted on Neon.

The React frontend is used locally and is not deployed.

## Project Structure

```text
node-homework/
├── controllers/
├── middleware/
├── routes/
├── validation/
├── prisma/
├── tests/
├── .env
├── .gitignore
├── app.js
├── server.js
├── package.json
└── README.md
```

## Author

Iryna Piatnochka

Built as part of the Code the Dream Node.js course.

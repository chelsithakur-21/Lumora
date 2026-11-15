# Lumora – Personal Finance Dashboard

**Lumora** is a full-stack personal finance dashboard built to help users track their income, expenses, savings, and financial goals in one place.

## Features

- **Dashboard:** Overview of income, expenses, balance, and savings.
- **Transaction Management:** Add and view income and expense transactions.
- **Financial Analytics:** Visual representation of financial activity.
- **Savings Goals:** Create and track personal financial goals.
- **Add Savings:** Increase the saved amount towards a goal.
- **Deduct Savings:** Reduce the saved amount while maintaining goal progress.
- **Settings:** View account information.

## Tech Stack

- **Frontend:** React.js, JavaScript, HTML, CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB
- **Tools:** VS Code, Git, GitHub

## Project Structure

```text
Lumora/
├── public/
├── server/
│   ├── models/
│   │   ├── Transaction.js
│   │   └── User.js
│   ├── server.js
│   └── package.json
├── src/
│   ├── components/
│   │   ├── Sidebar.jsx
│   │   └── TransactionModal.jsx
│   ├── App.jsx
│   ├── App.css
│   ├── index.css
│   └── main.jsx
├── index.html
├── package.json
└── vite.config.js
```

## Installation and Setup

### 1. Clone the repository

```bash
git clone https://github.com/chelsithakur-21/Lumora.git
cd Lumora
```

### 2. Install frontend dependencies

```bash
npm install
```

### 3. Install backend dependencies

```bash
cd server
npm install
```

### 4. Start the backend

```bash
node server.js
```

### 5. Start the frontend

Open a second terminal in the project root:

```bash
npm run dev
```

Open the local URL displayed by Vite.

**Prerequisite:** Make sure MongoDB is running and the backend database configuration is correct.

## Future Enhancements

- Live deployment
- Enhanced financial analytics
- Secure user authentication
- AI-powered financial insights

## Author

**Chelsi Thakur**

[GitHub Profile](https://github.com/chelsithakur-21)

---

*Lumora – Take control of your finances.*
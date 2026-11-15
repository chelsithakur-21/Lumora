
import { useState, useEffect, useMemo } from "react";
import "./App.css";
import TransactionModal from "./components/TransactionModal";
import Sidebar from "./components/Sidebar";

const API_URL = "http://localhost:5000/transactions";

function getTransactionDate(transaction) {
  if (transaction.date || transaction.createdAt) {
    const date = new Date(transaction.date || transaction.createdAt);
    if (!Number.isNaN(date.getTime())) return date;
  }

  // Fallback: MongoDB ObjectId contains a creation timestamp.
  if (transaction._id && /^[a-f\d]{24}$/i.test(transaction._id)) {
    const timestamp = parseInt(transaction._id.substring(0, 8), 16) * 1000;
    return new Date(timestamp);
  }

  return null;
}

function App() {
  const [showModal, setShowModal] = useState(false);
  const [activePage, setActivePage] = useState("Dashboard");
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [transactionError, setTransactionError] = useState("");

  const [goals, setGoals] = useState([
    {
      id: 1,
      name: "Buy a Laptop",
      description: "Saving for my new laptop",
      saved: 20000,
      target: 60000,
      icon: "💻",
    },
    {
      id: 2,
      name: "Travel Fund",
      description: "Save for your next adventure.",
      saved: 0,
      target: 50000,
      icon: "✈️",
    },
    {
      id: 3,
      name: "Emergency Fund",
      description: "Build a safety net for the future.",
      saved: 0,
      target: 100000,
      icon: "🏠",
    },
  ]);

  const [showGoalForm, setShowGoalForm] = useState(false);
  const [goalName, setGoalName] = useState("");
  const [goalDescription, setGoalDescription] = useState("");
  const [goalTarget, setGoalTarget] = useState("");

  // Chart month selector
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  // ================= CALCULATIONS =================

  const income = transactions
    .filter((transaction) => transaction.type === "Income")
    .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);

  const expenses = transactions
    .filter((transaction) => transaction.type === "Expense")
    .reduce((total, transaction) => total + Number(transaction.amount || 0), 0);

  const totalBalance = income - expenses;
  const savings = totalBalance;

  // ================= FETCH TRANSACTIONS =================

  const fetchTransactions = async () => {
    try {
      setLoadingTransactions(true);
      setTransactionError("");

      const response = await fetch(API_URL);

      if (!response.ok) {
        throw new Error("Unable to load transactions.");
      }

      const data = await response.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch error:", error);
      setTransactionError("Could not connect to the server. Please check your backend.");
    } finally {
      setLoadingTransactions(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  // ================= ADD TRANSACTION =================

  const addTransaction = async (transaction) => {
    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(transaction),
      });

      if (!response.ok) {
        throw new Error("Transaction could not be saved.");
      }

      const savedTransaction = await response.json();

      setTransactions((prev) => [savedTransaction, ...prev]);
      setShowModal(false);
    } catch (error) {
      console.error("Add transaction error:", error);
      alert("Unable to add transaction. Please try again.");
    }
  };

  // ================= DELETE TRANSACTION =================

  const deleteTransaction = async (id) => {
    const confirmed = window.confirm("Are you sure you want to delete this transaction?");
    if (!confirmed) return;

    try {
      const response = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Delete request failed.");
      }

      setTransactions((prev) =>
        prev.filter((transaction) => transaction._id !== id)
      );
    } catch (error) {
      console.error("Delete error:", error);
      alert("Could not delete this transaction. Check your backend DELETE route.");
    }
  };

  // ================= CHART DATA =================

  const availableMonths = useMemo(() => {
    const months = new Set();

    transactions.forEach((transaction) => {
      const date = getTransactionDate(transaction);
      if (date) {
        months.add(
          `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
        );
      }
    });

    const current = new Date();
    months.add(
      `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`
    );

    return Array.from(months).sort().reverse();
  }, [transactions]);

  const monthlyChartData = useMemo(() => {
    const [year, month] = selectedMonth.split("-").map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();

    const dailyData = Array.from({ length: daysInMonth }, (_, index) => ({
      day: index + 1,
      income: 0,
      expense: 0,
    }));

    transactions.forEach((transaction) => {
      const date = getTransactionDate(transaction);
      if (!date) return;

      if (
        date.getFullYear() !== year ||
        date.getMonth() + 1 !== month
      ) {
        return;
      }

      const dayIndex = date.getDate() - 1;
      const amount = Number(transaction.amount || 0);

      if (transaction.type === "Income") {
        dailyData[dayIndex].income += amount;
      } else if (transaction.type === "Expense") {
        dailyData[dayIndex].expense += amount;
      }
    });

    return dailyData;
  }, [transactions, selectedMonth]);

  const chartMax = Math.max(
    ...monthlyChartData.map((item) => Math.max(item.income, item.expense)),
    1
  );

  const monthlyIncome = monthlyChartData.reduce((sum, item) => sum + item.income, 0);
  const monthlyExpenses = monthlyChartData.reduce((sum, item) => sum + item.expense, 0);

  const selectedMonthLabel = new Date(
    Number(selectedMonth.split("-")[0]),
    Number(selectedMonth.split("-")[1]) - 1,
    1
  ).toLocaleDateString("en-IN", {
    month: "long",
    year: "numeric",
  });

  // Show up to 15 evenly spaced days to keep the chart readable.
  const visibleChartData = monthlyChartData.filter((item) => {
    const totalDays = monthlyChartData.length;
    const step = totalDays > 15 ? Math.ceil(totalDays / 15) : 1;
    return (item.day - 1) % step === 0 || item.day === totalDays;
  });


  // ================= CURVED CHART PATHS =================

  const getCurvePoints = (key) => {
    const width = 1000;
    const height = 250;
    const padding = 20;

    return visibleChartData.map((item, index) => ({
      x: padding + (index / Math.max(visibleChartData.length - 1, 1)) * (width - padding * 2),
      y: height - padding - (item[key] / chartMax) * (height - padding * 2),
      value: item[key],
      day: item.day,
    }));
  };

  const makeSmoothPath = (points) => {
    if (points.length === 0) return "";

    let path = `M ${points[0].x} ${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const current = points[i];
      const next = points[i + 1];
      const distance = (next.x - current.x) / 3;

      path += ` C ${current.x + distance} ${current.y},
        ${next.x - distance} ${next.y},
        ${next.x} ${next.y}`;
    }

    return path;
  };

  const incomePoints = getCurvePoints("income");
  const expensePoints = getCurvePoints("expense");

  const incomePath = makeSmoothPath(incomePoints);
  const expensePath = makeSmoothPath(expensePoints);

  const incomeArea = incomePath
    ? `${incomePath} L 980 250 L 20 250 Z`
    : "";

  const expenseArea = expensePath
    ? `${expensePath} L 980 250 L 20 250 Z`
    : "";

  // ================= CREATE GOAL =================

  const handleCreateGoal = () => {
    if (!goalName.trim() || !goalTarget || Number(goalTarget) <= 0) {
      alert("Please enter a valid goal name and target amount.");
      return;
    }

    const newGoal = {
      id: Date.now(),
      name: goalName.trim(),
      description: goalDescription || "Saving for my financial goal.",
      saved: 0,
      target: Number(goalTarget),
      icon: "🎯",
    };

    setGoals((prev) => [...prev, newGoal]);

    setGoalName("");
    setGoalDescription("");
    setGoalTarget("");
    setShowGoalForm(false);
  };

  // ================= ADD SAVINGS =================

  const addSavings = (goalId) => {
    const amount = window.prompt("How much would you like to save?");
    if (amount === null || amount.trim() === "") return;

    const savingAmount = Number(amount);

    if (!Number.isFinite(savingAmount) || savingAmount <= 0) {
      alert("Please enter a valid amount.");
      return;
    }

    setGoals((prev) =>
      prev.map((goal) => {
        if (goal.id !== goalId) return goal;

        return {
          ...goal,
          saved: Math.min(goal.saved + savingAmount, goal.target),
        };
      })
    );
  };

  // ================= DEDUCT SAVINGS =================

  const deductSavings = (goalId) => {
    alert("Deduct button is working!");

  const amount = window.prompt("Enter amount to deduct:");

  if (amount === null || amount.trim() === "") return;

  const deductAmount = Number(amount);

  if (!Number.isFinite(deductAmount) || deductAmount <= 0) {
    alert("Please enter a valid amount.");
    return;
  }

  const selectedGoal = goals.find((goal) => goal.id === goalId);

  if (!selectedGoal) return;

  if (deductAmount > selectedGoal.saved) {
    alert("You cannot deduct more than your saved amount.");
    return;
  }

  setGoals((previousGoals) =>
    previousGoals.map((goal) =>
      goal.id === goalId
        ? { ...goal, saved: goal.saved - deductAmount }
        : goal
    )
  );
};

  // ================= TRANSACTION ICON =================

  const getCategoryIcon = (category) => {
    switch (category) {
      case "Food & Dining":
        return "🍜";
      case "Shopping":
        return "🛍️";
      case "Travel":
        return "✈️";
      case "Entertainment":
        return "🎬";
      default:
        return "💰";
    }
  };

  // ================= TRANSACTION LIST =================

  const renderTransactions = (showCategory = false) => {
    if (loadingTransactions) {
      return <p className="subtitle">Loading transactions...</p>;
    }

    if (transactionError) {
      return (
        <div>
          <p className="subtitle">{transactionError}</p>
          <button className="view-button" onClick={fetchTransactions}>
            Try again
          </button>
        </div>
      );
    }

    if (transactions.length === 0) {
      return <p className="subtitle">No transactions yet.</p>;
    }

    return transactions.map((transaction) => (
      <div className="transaction" key={transaction._id}>
        <div className="transaction-icon">
          {getCategoryIcon(transaction.category)}
        </div>

        <div className="transaction-info">
          <strong>{transaction.name}</strong>
          <small>
            {showCategory
              ? transaction.category
              : getTransactionDate(transaction)?.toLocaleDateString("en-IN") || "Date unavailable"}
          </small>
        </div>

        <div className="transaction-actions">
          <span className={transaction.type === "Income" ? "income" : "expense"}>
            {transaction.type === "Income" ? "+" : "-"}₹
            {Number(transaction.amount || 0).toLocaleString("en-IN")}
          </span>

          <button
            className="delete-button"
            onClick={() => deleteTransaction(transaction._id)}
            title="Delete transaction"
          >
            🗑️
          </button>
        </div>
      </div>
    ));
  };

  // ================= RENDER =================

  return (
    <div className="app-layout">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />

      <main className="main-content">

        {/* ================= DASHBOARD ================= */}

        {activePage === "Dashboard" && (
          <>
            <div className="top-section">
              <div>
                <p className="eyebrow">OVERVIEW</p>
                <h1>Welcome back, Chelsi ✨</h1>
                <p className="subtitle">
                  Here's what's happening with your money today.
                </p>
              </div>

              <button
                className="add-button"
                onClick={() => setShowModal(true)}
              >
                + Add transaction
              </button>
            </div>

            <section className="stats-grid">
              <div className="stat-card balance-card">
                <p>Total Balance</p>
                <h2>₹{totalBalance.toLocaleString("en-IN")}</h2>
                <span className={totalBalance >= 0 ? "positive" : "negative"}>
                  {totalBalance >= 0 ? "Positive balance" : "Negative balance"}
                </span>
              </div>

              <div className="stat-card">
                <p>Total Income</p>
                <h2>₹{income.toLocaleString("en-IN")}</h2>
                <span className="positive">All recorded income</span>
              </div>

              <div className="stat-card">
                <p>Total Expenses</p>
                <h2>₹{expenses.toLocaleString("en-IN")}</h2>
                <span className="negative">All recorded expenses</span>
              </div>

              <div className="stat-card">
                <p>Net Savings</p>
                <h2>₹{savings.toLocaleString("en-IN")}</h2>
                <span className={savings >= 0 ? "positive" : "negative"}>
                  Income minus expenses
                </span>
              </div>
            </section>

            <section className="dashboard-grid">

              {/* LIVE MONTHLY CHART */}

              <div className="panel spending-panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">FINANCIAL ACTIVITY</p>
                    <h3>{selectedMonthLabel} overview</h3>
                  </div>

                  <select
                    value={selectedMonth}
                    onChange={(event) => setSelectedMonth(event.target.value)}
                    aria-label="Select chart month"
                  >
                    {availableMonths.map((month) => {
                      const [year, monthNumber] = month.split("-").map(Number);
                      const label = new Date(year, monthNumber - 1, 1)
                        .toLocaleDateString("en-IN", {
                          month: "short",
                          year: "numeric",
                        });

                      return (
                        <option value={month} key={month}>
                          {label}
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="chart-legend">
                  <span><i className="legend-income"></i> Income</span>
                  <span><i className="legend-expense"></i> Expenses</span>
                </div>

                
<div className="curved-chart">
  <svg
    viewBox="0 0 1000 250"
    preserveAspectRatio="none"
    className="curved-chart-svg"
  >
    <defs>
      <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#b99aff" stopOpacity="0.38" />
        <stop offset="100%" stopColor="#b99aff" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#45d9bd" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#45d9bd" stopOpacity="0" />
      </linearGradient>
    </defs>

    {[50, 100, 150, 200].map((y) => (
      <line
        key={y}
        x1="20"
        y1={y}
        x2="980"
        y2={y}
        stroke="rgba(180,160,255,0.13)"
        strokeDasharray="5 8"
      />
    ))}

    {incomeArea && <path d={incomeArea} fill="url(#incomeGradient)" />}
    {expenseArea && <path d={expenseArea} fill="url(#expenseGradient)" />}

    <path
      d={incomePath}
      fill="none"
      stroke="#b99aff"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    <path
      d={expensePath}
      fill="none"
      stroke="#45d9bd"
      strokeWidth="5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {incomePoints.map((point) => (
      <circle
        key={`income-${point.day}`}
        cx={point.x}
        cy={point.y}
        r="5"
        fill="#c6aaff"
        stroke="#211936"
        strokeWidth="3"
      >
        <title>{`Day ${point.day}: Income ₹${point.value.toLocaleString("en-IN")}`}</title>
      </circle>
    ))}

    {expensePoints.map((point) => (
      <circle
        key={`expense-${point.day}`}
        cx={point.x}
        cy={point.y}
        r="5"
        fill="#45d9bd"
        stroke="#15332f"
        strokeWidth="3"
      >
        <title>{`Day ${point.day}: Expenses ₹${point.value.toLocaleString("en-IN")}`}</title>
      </circle>
    ))}
  </svg>

  <div className="curved-chart-labels">
    {visibleChartData.map((item) => (
      <span key={item.day}>{item.day}</span>
    ))}
  </div>
</div>


                {monthlyIncome === 0 && monthlyExpenses === 0 && (
                  <p className="chart-empty">
                    No transactions recorded for this month yet.
                    Add a transaction to see your chart.
                  </p>
                )}

                <div className="chart-summary">
                  <div>
                    <small>Monthly income</small>
                    <strong className="income">
                      ₹{monthlyIncome.toLocaleString("en-IN")}
                    </strong>
                  </div>
                  <div>
                    <small>Monthly expenses</small>
                    <strong className="expense">
                      ₹{monthlyExpenses.toLocaleString("en-IN")}
                    </strong>
                  </div>
                </div>
              </div>

              {/* RECENT TRANSACTIONS */}

              <div className="panel">
                <div className="panel-header">
                  <div>
                    <p className="eyebrow">RECENT</p>
                    <h3>Transactions</h3>
                  </div>

                  <button
                    className="view-button"
                    onClick={() => setActivePage("Transactions")}
                  >
                    View all
                  </button>
                </div>

                {renderTransactions()}
              </div>
            </section>
          </>
        )}

        {/* ================= ANALYTICS ================= */}

        {activePage === "Analytics" && (
          <div className="analytics-page">
            <p className="eyebrow">ANALYTICS</p>

            <div className="top-section">
              <div>
                <h1>Spending Analytics 📊</h1>
                <p className="subtitle">
                  Here's a breakdown of your money.
                </p>
              </div>
            </div>

            <section className="stats-grid">
              <div className="stat-card">
                <p>Total Income</p>
                <h2>₹{income.toLocaleString("en-IN")}</h2>
              </div>

              <div className="stat-card">
                <p>Total Expenses</p>
                <h2>₹{expenses.toLocaleString("en-IN")}</h2>
              </div>

              <div className="stat-card balance-card">
                <p>Current Balance</p>
                <h2>₹{totalBalance.toLocaleString("en-IN")}</h2>
              </div>
            </section>

            <section className="panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">SUMMARY</p>
                  <h3>Financial Summary</h3>
                </div>
              </div>

              <div className="analytics-summary">
                <p>
                  💰 Income:
                  <strong> ₹{income.toLocaleString("en-IN")}</strong>
                </p>

                <p>
                  💸 Expenses:
                  <strong> ₹{expenses.toLocaleString("en-IN")}</strong>
                </p>

                <p>
                  💵 Savings:
                  <strong> ₹{savings.toLocaleString("en-IN")}</strong>
                </p>
              </div>
            </section>

            <section className="panel spending-panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">MONTHLY ACTIVITY</p>
                  <h3>{selectedMonthLabel}</h3>
                </div>
              </div>

              <div className="chart-legend">
                <span><i className="legend-income"></i> Income</span>
                <span><i className="legend-expense"></i> Expenses</span>
              </div>

              <div className="live-chart">
                {visibleChartData.map((item) => (
                  <div className="chart-column" key={item.day}>
                    <div className="bar-pair">
                      <div
                        className="chart-bar income-bar"
                        style={{
                          height: `${Math.max((item.income / chartMax) * 100, item.income > 0 ? 3 : 0)}%`,
                        }}
                        title={`Income: ₹${item.income.toLocaleString("en-IN")}`}
                      ></div>

                      <div
                        className="chart-bar expense-bar"
                        style={{
                          height: `${Math.max((item.expense / chartMax) * 100, item.expense > 0 ? 3 : 0)}%`,
                        }}
                        title={`Expenses: ₹${item.expense.toLocaleString("en-IN")}`}
                      ></div>
                    </div>
                    <span className="chart-day">{item.day}</span>
                  </div>
                ))}
              </div>

              {monthlyIncome === 0 && monthlyExpenses === 0 && (
                <p className="chart-empty">
                  No transactions recorded for this month yet.
                </p>
              )}
            </section>
          </div>
        )}

        {/* ================= TRANSACTIONS ================= */}

        {activePage === "Transactions" && (
          <div>
            <p className="eyebrow">TRANSACTIONS</p>

            <div className="top-section">
              <div>
                <h1>All Transactions 💳</h1>
                <p className="subtitle">
                  Manage all your transactions here.
                </p>
              </div>

              <button
                className="add-button"
                onClick={() => setShowModal(true)}
              >
                + Add transaction
              </button>
            </div>

            <section className="panel">
              {renderTransactions(true)}
            </section>
          </div>
        )}

        {/* ================= GOALS ================= */}

        {activePage === "Goals" && (
          <div className="goals-page">
            <div className="goals-header">
              <p className="eyebrow">GOALS</p>
              <h1>Financial Goals 🎯</h1>
              <p className="subtitle">
                Turn your plans into progress.
              </p>

              <button
                className="goal-button"
                onClick={() => setShowGoalForm(true)}
              >
                + Add new goal
              </button>
            </div>

            {goals.map((goal) => {
              const percentage = Math.min(
                Math.round((goal.saved / goal.target) * 100),
                100
              );

              const remaining = Math.max(goal.target - goal.saved, 0);

              return (
                <section className="goal-card" key={goal.id}>
                  <div className="goal-card-header">
                    <div className="goal-title">
                      <div className="goal-icon">{goal.icon}</div>

                      <div>
                        <h3>{goal.name}</h3>
                        <p>{goal.description}</p>
                      </div>
                    </div>

                    <div className="goal-percentage">
                      {percentage}%
                    </div>
                  </div>

                  <div className="progress-container">
                    <div className="progress-info">
                      <span>
                        Saved ₹{goal.saved.toLocaleString("en-IN")}
                      </span>

                      <span>
                        Target ₹{goal.target.toLocaleString("en-IN")}
                      </span>
                    </div>

                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="goal-bottom">
                    <div className="goal-amount">
                      <strong>
                        ₹{remaining.toLocaleString("en-IN")} left
                      </strong>

                      <span>
                        {percentage >= 100
                          ? "Goal completed! 🎉"
                          : "Keep going! ✨"}
                      </span>
                    </div>

                    <div className="goal-actions">
                      <button
                        className="goal-button"
                        onClick={() => addSavings(goal.id)}
                      >
                        + Add savings
                      </button>

                      <button
                        className="goal-deduct-button"
                        onClick={() => deductSavings(goal.id)}
                      >
                        − Deduct savings
                      </button>
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* ================= SETTINGS ================= */}

        
{activePage === "Settings" && (
  <div className="settings-page">
    <p className="eyebrow">PERSONALIZE YOUR SPACE</p>
    <h1>Settings ⚙️</h1>
    <p className="subtitle">
      Manage your account and customize your Lumora experience.
    </p>

    <div className="settings-profile panel">
      <div className="settings-avatar">C</div>
      <div>
        <h3>Chelsi</h3>
        <p>Personal account</p>
      </div>
      <span className="settings-status">Active</span>
    </div>

    <div className="settings-sections">

      <details className="settings-option" open>
        <summary>
          <span className="settings-icon">👤</span>
          <span className="settings-option-text">
            <strong>Profile & Account</strong>
            <small>View your personal account details</small>
          </span>
          <span className="settings-arrow">⌄</span>
        </summary>
        <div className="settings-content">
          <div className="settings-field">
            <label>Full name</label>
            <input type="text" defaultValue="Chelsi" />
          </div>
          <div className="settings-field">
            <label>Account type</label>
            <input type="text" value="Personal account" readOnly />
          </div>
          <p className="settings-note">
            Profile editing and account synchronization can be connected next.
          </p>
        </div>
      </details>

      <details className="settings-option">
        <summary>
          <span className="settings-icon">🌍</span>
          <span className="settings-option-text">
            <strong>Preferences</strong>
            <small>Currency and regional settings</small>
          </span>
          <span className="settings-arrow">⌄</span>
        </summary>
        <div className="settings-content">
          <div className="settings-field">
            <label>Display currency</label>
            <select defaultValue="INR">
              <option value="INR">INR — Indian Rupee (₹)</option>
              <option value="USD">USD — US Dollar ($)</option>
              <option value="EUR">EUR — Euro (€)</option>
              <option value="GBP">GBP — British Pound (£)</option>
            </select>
          </div>
          <div className="settings-field">
            <label>Date format</label>
            <select defaultValue="DD/MM/YYYY">
              <option>DD/MM/YYYY</option>
              <option>MM/DD/YYYY</option>
              <option>YYYY-MM-DD</option>
            </select>
          </div>
          <p className="settings-note">
            These selections currently affect the settings display only.
          </p>
        </div>
      </details>

      <details className="settings-option">
        <summary>
          <span className="settings-icon">🎨</span>
          <span className="settings-option-text">
            <strong>Appearance</strong>
            <small>Customize your dashboard look</small>
          </span>
          <span className="settings-arrow">⌄</span>
        </summary>
        <div className="settings-content">
          <div className="settings-field">
            <label>Current theme</label>
            <input value="Dark — Midnight Purple" readOnly />
          </div>
          <div className="theme-preview">
            <span className="theme-swatch"></span>
            <span>Midnight Purple</span>
            <span className="theme-selected">Selected</span>
          </div>
        </div>
      </details>

      <details className="settings-option">
        <summary>
          <span className="settings-icon">🔔</span>
          <span className="settings-option-text">
            <strong>Notifications</strong>
            <small>Manage your notification preferences</small>
          </span>
          <span className="settings-arrow">⌄</span>
        </summary>
        <div className="settings-content">
          <div className="settings-info-row">
            <div>
              <strong>Transaction alerts</strong>
              <small>Updates when transactions are added</small>
            </div>
            <span className="settings-coming">Coming soon</span>
          </div>
          <div className="settings-info-row">
            <div>
              <strong>Goal reminders</strong>
              <small>Reminders about your savings goals</small>
            </div>
            <span className="settings-coming">Coming soon</span>
          </div>
        </div>
      </details>

      <details className="settings-option">
        <summary>
          <span className="settings-icon">🔐</span>
          <span className="settings-option-text">
            <strong>Privacy & Security</strong>
            <small>Account protection information</small>
          </span>
          <span className="settings-arrow">⌄</span>
        </summary>
        <div className="settings-content">
          <div className="settings-info-row">
            <div>
              <strong>Password</strong>
              <small>Manage your login credentials</small>
            </div>
            <span className="settings-coming">Not configured</span>
          </div>
          <div className="settings-info-row">
            <div>
              <strong>Account security</strong>
              <small>Authentication and access protection</small>
            </div>
            <span className="settings-coming">View status</span>
          </div>
        </div>
      </details>

      <details className="settings-option">
        <summary>
          <span className="settings-icon">💾</span>
          <span className="settings-option-text">
            <strong>Data & Information</strong>
            <small>About your Lumora financial data</small>
          </span>
          <span className="settings-arrow">⌄</span>
        </summary>
        <div className="settings-content">
          <div className="settings-info-row">
            <div>
              <strong>Application</strong>
              <small>Lumora Personal Finance Dashboard</small>
            </div>
          </div>
          <div className="settings-info-row">
            <div>
              <strong>Storage</strong>
              <small>MongoDB transaction storage</small>
            </div>
          </div>
          <p className="settings-note">
            Goal backup and data export are not configured yet.
          </p>
        </div>
      </details>

    </div>
  </div>
)}

      </main>

      {/* ================= TRANSACTION MODAL ================= */}

      {showModal && (
        <TransactionModal
          onClose={() => setShowModal(false)}
          onAdd={addTransaction}
        />
      )}



      {/* ================= CREATE GOAL MODAL ================= */}

      {showGoalForm && (
        <div className="goal-modal-overlay">
          <div className="goal-modal">
            <div className="goal-modal-header">
              <div>
                <p className="eyebrow">NEW GOAL</p>

                <h2>Create a financial goal 🎯</h2>

                <p className="subtitle">
                  Give your goal a name and set your target.
                </p>
              </div>

              <button
                className="goal-close"
                onClick={() => setShowGoalForm(false)}
              >
                ✕
              </button>
            </div>

            <div className="goal-form">
              <label>Goal name</label>

              <input
                type="text"
                placeholder="e.g. Buy a new phone"
                value={goalName}
                onChange={(event) => setGoalName(event.target.value)}
              />

              <label>Description</label>

              <input
                type="text"
                placeholder="What are you saving for?"
                value={goalDescription}
                onChange={(event) => setGoalDescription(event.target.value)}
              />

              <label>Target amount</label>

              <input
                type="number"
                min="1"
                placeholder="₹ 50,000"
                value={goalTarget}
                onChange={(event) => setGoalTarget(event.target.value)}
              />

              <div className="goal-form-actions">
                <button
                  className="goal-cancel"
                  onClick={() => setShowGoalForm(false)}
                >
                  Cancel
                </button>

                <button
                  className="goal-button"
                  onClick={handleCreateGoal}
                >
                  Create goal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

import { useState } from "react";

function TransactionModal({ onClose, onAdd }) {
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState("Expense");
  const [category, setCategory] = useState("Other");

  const handleAdd = () => {
    if (!name || !amount) {
      alert("Please enter transaction name and amount");
      return;
    }

    const transaction = {
      id: Date.now(),
      name: name,
      amount: Number(amount),
      type: type,
      category: category,
    };

    onAdd(transaction);
  };

  return (
    <div className="modal-overlay">
      <div className="transaction-modal">

        <button className="close-button" onClick={onClose}>
          ×
        </button>

        <p className="eyebrow">NEW TRANSACTION</p>

        <h2>Add transaction</h2>

        <p className="modal-subtitle">
          Keep your finances organized ✨
        </p>

        <div className="form-group">
          <label>Transaction name</label>

          <input
            type="text"
            placeholder="e.g. Netflix subscription"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>Amount</label>

          <input
            type="number"
            placeholder="₹0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>

        <div className="form-row">

          <div className="form-group">
            <label>Type</label>

            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
            >
              <option>Expense</option>
              <option>Income</option>
            </select>
          </div>

          <div className="form-group">
            <label>Category</label>

            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option>Other</option>
              <option>Food & Dining</option>
              <option>Shopping</option>
              <option>Travel</option>
              <option>Entertainment</option>
              <option>Bills</option>
            </select>
          </div>

        </div>

        <button
          className="modal-add-button"
          onClick={handleAdd}
        >
          + Add transaction
        </button>

      </div>
    </div>
  );
}

export default TransactionModal;
import React, { useState } from "react";

function App() {
  const [formData, setFormData] = useState({
    AgeGroup: "",
    YearsTogether: "",
    Province: ""
  });

  const [result, setResult] = useState(null);

  const handleChange = e => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const response = await fetch("http://127.0.0.1:5000/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData)
    });
    const data = await response.json();
    setResult(data);
  };

  return (
    <div style={{ padding: "2rem", fontFamily: "Arial" }}>
      <h1>Divorce Insurance Quote</h1>
      <form onSubmit={handleSubmit}>
        <label>Age Group:
          <select name="AgeGroup" onChange={handleChange} required>
            <option value="">Select</option>
            <option value="Under30">Under 30</option>
            <option value="30to50">30 to 50</option>
            <option value="Over50">Over 50</option>
          </select>
        </label>
        <br /><br />

        <label>Years Together:
          <input
            type="number"
            name="YearsTogether"
            onChange={handleChange}
            required
            min="0"
          />
        </label>
        <br /><br />

        <label>Province:
          <select name="Province" onChange={handleChange} required>
            <option value="">Select</option>
            <option value="ON">Ontario</option>
            <option value="QC">Quebec</option>
            <option value="BC">British Columbia</option>
            <option value="AB">Alberta</option>
          </select>
        </label>
        <br /><br />

        <button type="submit">Get My Quote</button>
      </form>

      {result && (
        <div style={{ marginTop: "2rem" }}>
          <h3>Quote Details:</h3>
          <p>Estimated Divorce Risk: {(result.divorce_risk * 100).toFixed(1)}%</p>
          <p>Premium: ${result.premium}</p>
          <p>Payout on Divorce: ${result.payout}</p>
        </div>
      )}
    </div>
  );
}

export default App;

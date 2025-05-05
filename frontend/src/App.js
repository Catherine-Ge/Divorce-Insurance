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
            <option value="Under 20 years">Under 20 years</option>
            <option value="20 to 24 years">20 to 24 years</option>
            <option value="25 to 29 years">25 to 29 years</option>
            <option value="30 to 34 years">30 to 34 years</option>
            <option value="35 to 39 years">35 to 39 years</option>
            <option value="40 to 44 years">40 to 44 years</option>
            <option value="45 to 49 years">45 to 49 years</option>
            <option value="50 to 54 years">50 to 54 years</option>
            <option value="55 to 59 years">55 to 59 years</option>
            <option value="60 to 64 years">60 to 64 years</option>
            <option value="65 years and over">65 years and over</option>
  </select>
        </label>
        <br /><br />

        <label>Years Together:
          <select name="YearsTogether" onChange={handleChange} required>
            <option value="">Select</option>
            <option value="1 year">1 year</option>
            <option value="2 years">2 years</option>
            <option value="3 years">3 years</option>
            <option value="4 years">4 years</option>
            <option value="5 years">5 years</option>
            <option value="6 years">6 years</option>
            <option value="7 years">7 years</option>
            <option value="8 years">8 years</option>
            <option value="9 years">9 years</option>
            <option value="10 years or more">10 years or more</option>
          </select>
        </label>
        <br /><br />

        <label>Province:
          <select name="Province" onChange={handleChange} required>
            <option value="">Select</option>
            <option value="N.L.">Newfoundland and Labrador</option>
            <option value="P.E.I.">Prince Edward Island</option>
            <option value="N.S.">Nova Scotia</option>
            <option value="N.B.">New Brunswick</option>
            <option value="Que.">Quebec</option>
            <option value="Ont.">Ontario</option>
            <option value="Man.">Manitoba</option>
            <option value="Sask.">Saskatchewan</option>
            <option value="Alta.">Alberta</option>
            <option value="B.C.">British Columbia</option>
            <option value="Y.T.">Yukon</option>
            <option value="N.W.T.">Northwest Territories</option>
            <option value="Nvt.">Nunavut</option>
          </select>
        </label>
        <br /><br />

        <button type="submit">Get My Quote</button>

        <label>Email:
          <input
          type="email"
          name="email"
          value={formData.email || ""}
          onChange={handleChange}
          required
          />
        </label>

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

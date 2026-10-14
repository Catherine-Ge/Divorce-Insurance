import React, { useState } from "react";


function QuotePage() {
  const [formData, setFormData] = useState({
    AgeGroup: "",
    YearsTogether: "",
    Province: ""
  });

  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = e => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError("");
    setResult(null);
    setLoading(true);
    try {
    const response = await fetch("https://divorce-insurance.onrender.com/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(formData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to generate your quote.");
    setResult(data);
    } catch (err) {
      setError(err.message || "Unable to reach the quote service. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="quote-page">
      <h1>Divorce Insurance Quote</h1>
      <p>Demo insurance product · Single upfront premium</p>
      <p className="page-intro">Choose your details below for a personalized quote. Email is optional.</p>
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

        <label>Email:
          <input
          type="email"
          name="email"
          value={formData.email || ""}
          onChange={handleChange}
          />
        </label>

        <p className="field-help">Add your email if you would like a copy of this quote.</p>
        <button className="primary-button" type="submit" disabled={loading}>{loading ? "Getting your quote..." : "Get My Quote"}</button>
      </form>

      {error && <p role="alert">{error}</p>}
      {result && (
        <div style={{ marginTop: "2rem" }}>
          <h3>Quote Details:</h3>
          {result.email_status === "accepted" && <p role="status">Your quote email has been submitted. Check your inbox and spam folder.</p>}
          {result.email_status === "failed" && <p role="alert">Your quote is ready, but we could not send the email. Please save the details below.</p>}
          <p>Estimated Divorce Risk: {(result.divorce_risk * 100).toFixed(1)}%</p>
          <p>Single upfront premium: ${result.premium}</p>
          <p>Payout on Divorce: ${result.payout}</p>
        </div>
      )}
    </section>
  );
}

export default QuotePage;

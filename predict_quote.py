import pandas as pd

def predict_quote(age_group, years_together, province, model, encoder, threshold=0.25, cost=15000, margin=1.2):
    # Prepare input
    user_input = pd.DataFrame([[age_group, years_together, province]], columns=["AgeGroup", "YearsTogether", "Province"])

    # Encode
    user_encoded = encoder.transform(user_input)

    # Predict probability
    prob = model.predict_proba(user_encoded)[0][1]

    # Predict class based on threshold
    is_divorced = int(prob >= threshold)

    # Calculate premium
    premium = round(prob * cost * margin, 2)

    return {
        "Divorce Probability (%)": round(prob * 100, 2),
        "Predicted to Divorce?": "Yes" if is_divorced else "No",
        "Suggested Insurance Premium ($)": premium
    }

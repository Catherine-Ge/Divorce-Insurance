from insurance_design.logistic_model import train_logistic
from insurance_design.predict_quote import predict_quote


# Train the model
model, encoder, X_test, y_test = train_logistic("simulated_divorce_final.csv", use_smote=True)

# Best threshold
threshold = 0.3

# Predict user quote
result = predict_quote(
    age_group="25 to 29 years",
    years_together="2 years",
    province="Ont.",
    model=model,
    encoder=encoder,
    threshold=threshold
)

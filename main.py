from logistic_model import train_logistic
from threshold_tuner import find_best_threshold
from predict_quote import predict_quote

# Train the model
model, encoder, X_test, y_test = train_logistic("simulated_divorce_final.csv", use_smote=True)

# Find best threshold
best_threshold = find_best_threshold(model, X_test, y_test)

# Predict user quote
result = predict_quote(
    age_group="25 to 29 years",
    years_together="2 years",
    province="Ont.",
    model=model,
    encoder=encoder,
    threshold=best_threshold
)

print("\n=== Quote Result ===")
for k, v in result.items():
    print(f"{k}: {v}")
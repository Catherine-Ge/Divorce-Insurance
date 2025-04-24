from logistic_model import train_logistic
from threshold_tuner import find_best_threshold

# Train the model
model, encoder, X_test, y_test = train_logistic("simulated_divorce_final.csv", use_smote=True)

# Find best threshold
best_threshold = find_best_threshold(model, X_test, y_test)
